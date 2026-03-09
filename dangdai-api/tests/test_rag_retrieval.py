"""Tests for RAG retrieval service with mocked vector store."""

from unittest.mock import MagicMock

from src.repositories.vector_store import MIN_CHUNKS_THRESHOLD
from src.services.rag_service import RagService


def _make_chunks(n, exercise_type="vocabulary", content_type="workbook"):
    return [
        {
            "id": f"chunk-{i}",
            "content": f"Content {i}",
            "book": 1,
            "lesson": 1,
            "section": "Vocabulary",
            "content_type": content_type,
            "exercise_type": exercise_type,
            "topic": f"topic-{i}",
            "lesson_title": "Lesson 1",
            "difficulty": "beginner",
            "page_range": "1-5",
            "category": "vocabulary",
        }
        for i in range(n)
    ]


class TestRagServiceRetrieveContent:
    def test_returns_workbook_chunks_when_sufficient(self):
        mock_vs = MagicMock()
        mock_vs.search_by_filters.return_value = _make_chunks(5)
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_content(1, 1, "vocabulary")

        assert len(result) == 5
        mock_vs.search_by_filters.assert_called_once_with(
            book=1, lesson=1, exercise_type="vocabulary", content_type="workbook"
        )

    def test_falls_back_to_any_content_type(self):
        mock_vs = MagicMock()
        # First call (workbook): insufficient
        # Second call (any content_type): sufficient
        mock_vs.search_by_filters.side_effect = [
            _make_chunks(1),  # workbook: too few
            _make_chunks(5),  # any content_type: enough
        ]
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_content(1, 1, "vocabulary")

        assert len(result) == 5
        assert mock_vs.search_by_filters.call_count == 2

    def test_falls_back_to_book_lesson(self):
        mock_vs = MagicMock()
        mock_vs.search_by_filters.side_effect = [
            _make_chunks(1),  # workbook: too few
            _make_chunks(1),  # any content_type: still too few
        ]
        mock_vs.search_by_book_lesson.return_value = _make_chunks(10)
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_content(1, 1, "vocabulary")

        assert len(result) == 10
        mock_vs.search_by_book_lesson.assert_called_once()

    def test_falls_back_to_book_only(self):
        mock_vs = MagicMock()
        mock_vs.search_by_filters.side_effect = [[], []]
        mock_vs.search_by_book_lesson.return_value = []
        mock_vs.search_by_book.return_value = _make_chunks(3)
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_content(1, 1, "vocabulary")

        assert len(result) == 3
        mock_vs.search_by_book.assert_called_once()

    def test_returns_empty_when_no_content(self):
        mock_vs = MagicMock()
        mock_vs.search_by_filters.side_effect = [[], []]
        mock_vs.search_by_book_lesson.return_value = []
        mock_vs.search_by_book.return_value = []
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_content(1, 1, "vocabulary")

        assert result == []

    def test_min_chunks_threshold_is_3(self):
        assert MIN_CHUNKS_THRESHOLD == 3


class TestRagServiceRetrieveMixedContent:
    def test_mixed_content_combines_types(self):
        mock_vs = MagicMock()
        # Return different chunks for each exercise type
        mock_vs.search_by_filters.return_value = _make_chunks(3)
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_mixed_content(1, 1, ["vocabulary", "grammar"])

        # Should have chunks from both types (deduped by id)
        assert len(result) == 3  # same IDs, so deduped

    def test_mixed_falls_back_if_empty(self):
        mock_vs = MagicMock()
        mock_vs.search_by_filters.side_effect = [[], [], [], []]
        mock_vs.search_by_book_lesson.side_effect = [[], [], _make_chunks(5)]
        mock_vs.search_by_book.side_effect = [[], []]
        service = RagService(vector_store=mock_vs)

        result = service.retrieve_mixed_content(1, 1, ["vocabulary", "grammar"])

        assert len(result) == 5
