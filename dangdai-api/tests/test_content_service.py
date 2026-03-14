"""Tests for content service with mocked repository."""

from unittest.mock import MagicMock

from src.services.content_service import ContentService

MOCK_VOCAB = [
    {"traditional": "學", "pinyin": "xué", "english": "to study"},
    {"traditional": "生", "pinyin": "shēng", "english": "to be born"},
]

MOCK_GRAMMAR = [
    {
        "title_english": "Using 是",
        "title_chinese": "是的用法",
        "function_description": "Equative verb",
        "structure_pattern": "Subject + 是 + Noun",
        "usage_notes": "Basic identification",
        "examples": [{"chinese": "我是學生", "english": "I am a student"}],
    },
]

MOCK_DIALOGUES = [
    {
        "dialogue_number": 1,
        "title_traditional": "在學校",
        "title_english": "At School",
        "lines": [{"speaker": "A", "traditional": "你好！", "english": "Hello!"}],
    },
]


class TestContentServiceRetrieveChapterContent:
    """Tests for ContentService.retrieve_chapter_content()."""

    def test_vocabulary_type_returns_vocab_and_grammar(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR
        mock_repo.get_dialogues.return_value = MOCK_DIALOGUES

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="vocabulary"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result
        assert len(result["vocabulary"]) == 2
        assert len(result["grammar_points"]) == 1
        mock_repo.get_vocabulary.assert_called_once_with(1, 1)
        mock_repo.get_grammar_points.assert_called_once_with(1, 1)

    def test_grammar_type_returns_vocab_and_grammar(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="grammar"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result
        mock_repo.get_vocabulary.assert_called_once()
        mock_repo.get_grammar_points.assert_called_once()

    def test_dialogue_type_includes_dialogues(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR
        mock_repo.get_dialogues.return_value = MOCK_DIALOGUES

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="dialogue_completion"
        )

        assert "dialogues" in result
        assert len(result["dialogues"]) == 1
        mock_repo.get_dialogues.assert_called_once_with(1, 1)

    def test_reading_comprehension_includes_dialogues(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR
        mock_repo.get_dialogues.return_value = MOCK_DIALOGUES

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="reading_comprehension"
        )

        assert "dialogues" in result
        mock_repo.get_dialogues.assert_called_once()

    def test_matching_type_returns_vocab_and_grammar(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="matching"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result
        # Matching doesn't need dialogues by default
        mock_repo.get_dialogues.assert_not_called()

    def test_fill_in_blank_type_returns_vocab_and_grammar(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="fill_in_blank"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result
        mock_repo.get_dialogues.assert_not_called()

    def test_sentence_construction_returns_vocab_and_grammar(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="sentence_construction"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result

    def test_mixed_type_includes_everything(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR
        mock_repo.get_dialogues.return_value = MOCK_DIALOGUES

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="mixed"
        )

        assert "vocabulary" in result
        assert "grammar_points" in result
        assert "dialogues" in result

    def test_includes_rag_chunks_when_provided(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        mock_rag = MagicMock()
        mock_rag.retrieve_content.return_value = [{"content": "supplementary"}]

        service = ContentService(content_repo=mock_repo, rag_service=mock_rag)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="vocabulary"
        )

        assert "rag_chunks" in result
        assert len(result["rag_chunks"]) == 1

    def test_no_rag_chunks_when_no_rag_service(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = MOCK_VOCAB
        mock_repo.get_grammar_points.return_value = MOCK_GRAMMAR

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=1, exercise_type="vocabulary"
        )

        # No rag_chunks key when RAG service is not provided
        assert "rag_chunks" not in result

    def test_returns_empty_content_when_repo_returns_empty(self):
        mock_repo = MagicMock()
        mock_repo.get_vocabulary.return_value = []
        mock_repo.get_grammar_points.return_value = []

        service = ContentService(content_repo=mock_repo)
        result = service.retrieve_chapter_content(
            book_id=1, lesson_id=99, exercise_type="vocabulary"
        )

        assert result["vocabulary"] == []
        assert result["grammar_points"] == []
