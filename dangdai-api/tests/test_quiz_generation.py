"""Tests for quiz generation graph nodes with mocked dependencies."""

import json
from unittest.mock import MagicMock, patch

from src.agent.nodes import (
    _format_chapter_content,
    _parse_questions_json,
    retrieve_content,
    validate_quiz,
)
from src.repositories.chapter_repo import ChapterRepository
from src.services.weakness_service import WeaknessService


class TestChapterRepository:
    def test_parse_chapter_id_book1_chapter5(self):
        book, lesson = ChapterRepository.parse_chapter_id(105)
        assert book == 1
        assert lesson == 5

    def test_parse_chapter_id_book2_chapter12(self):
        book, lesson = ChapterRepository.parse_chapter_id(212)
        assert book == 2
        assert lesson == 12

    def test_parse_chapter_id_book6_chapter1(self):
        book, lesson = ChapterRepository.parse_chapter_id(601)
        assert book == 6
        assert lesson == 1


class TestWeaknessService:
    def test_select_mixed_types_prioritizes_weak(self):
        service = WeaknessService(performance_repo=MagicMock())
        profile = {"weak_exercise_types": ["grammar", "fill_in_blank"]}
        available = ["vocabulary", "grammar", "fill_in_blank", "matching"]

        result = service.select_mixed_exercise_types(profile, available, count=3)

        # Weak types first, then others
        assert result[0] == "grammar"
        assert result[1] == "fill_in_blank"
        assert len(result) == 3

    def test_select_mixed_types_no_weakness(self):
        service = WeaknessService(performance_repo=MagicMock())
        profile = {"weak_exercise_types": []}
        available = ["vocabulary", "grammar"]

        result = service.select_mixed_exercise_types(profile, available, count=2)

        assert len(result) == 2
        assert set(result) == {"vocabulary", "grammar"}

    def test_select_mixed_types_empty_available(self):
        service = WeaknessService(performance_repo=MagicMock())
        profile = {"weak_exercise_types": ["grammar"]}

        result = service.select_mixed_exercise_types(profile, [], count=3)

        assert result == []


class TestFormatChapterContent:
    def test_format_empty_chunks(self):
        result = _format_chapter_content([])
        assert "No chapter content" in result

    def test_format_single_chunk(self):
        chunks = [
            {
                "section": "Vocab",
                "content": "Hello world",
                "exercise_type": "vocabulary",
                "topic": "greetings",
            }
        ]
        result = _format_chapter_content(chunks)
        assert "Hello world" in result
        assert "Vocab" in result

    def test_format_multiple_chunks(self):
        chunks = [
            {"section": "A", "content": "First", "exercise_type": None, "topic": None},
            {"section": "B", "content": "Second", "exercise_type": None, "topic": None},
        ]
        result = _format_chapter_content(chunks)
        assert "First" in result
        assert "Second" in result


class TestParseQuestionsJson:
    def test_parse_valid_json_array(self):
        json_str = json.dumps([{"question_id": "q1", "text": "test"}])
        result = _parse_questions_json(json_str)
        assert len(result) == 1
        assert result[0]["question_id"] == "q1"

    def test_parse_json_with_code_block(self):
        json_str = '```json\n[{"question_id": "q1"}]\n```'
        result = _parse_questions_json(json_str)
        assert len(result) == 1

    def test_parse_json_with_questions_key(self):
        json_str = json.dumps({"questions": [{"question_id": "q1"}]})
        result = _parse_questions_json(json_str)
        assert len(result) == 1

    def test_parse_invalid_json_returns_empty(self):
        result = _parse_questions_json("not json at all")
        assert result == []

    def test_parse_single_object_wraps_in_list(self):
        json_str = json.dumps({"question_id": "q1"})
        result = _parse_questions_json(json_str)
        assert len(result) == 1


class TestValidateQuiz:
    def test_validates_empty_questions(self):
        state = {"questions": [], "retry_count": 0}
        result = validate_quiz(state)
        assert len(result["validation_errors"]) > 0
        assert result["retry_count"] == 1

    def test_validates_missing_fields(self):
        state = {
            "questions": [{"question_id": "q1"}],
            "retry_count": 0,
        }
        result = validate_quiz(state)
        assert len(result["validation_errors"]) > 0

    def test_validates_duplicate_question_text(self):
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Same",
                    "correct_answer": "a",
                    "exercise_type": "vocabulary",
                    "explanation": "x",
                },
                {
                    "question_id": "q2",
                    "question_text": "Same",
                    "correct_answer": "b",
                    "exercise_type": "vocabulary",
                    "explanation": "y",
                },
            ],
            "retry_count": 0,
        }
        result = validate_quiz(state)
        assert any("duplicate" in e for e in result["validation_errors"])

    def test_validates_duplicate_options(self):
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test",
                    "correct_answer": "a",
                    "exercise_type": "vocabulary",
                    "explanation": "x",
                    "options": ["a", "a", "b", "c"],
                },
            ],
            "retry_count": 0,
        }
        result = validate_quiz(state)
        assert any("duplicate options" in e for e in result["validation_errors"])

    def test_validates_correct_answer_not_in_options(self):
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test",
                    "correct_answer": "d",
                    "exercise_type": "vocabulary",
                    "explanation": "x",
                    "options": ["a", "b", "c", "e"],
                },
            ],
            "retry_count": 0,
        }
        result = validate_quiz(state)
        assert any(
            "correct_answer not in options" in e for e in result["validation_errors"]
        )

    def test_validates_good_questions_pass(self):
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "exercise_type": "vocabulary",
                    "explanation": "學 means to study",
                    "options": ["to study", "to eat", "to go", "to read"],
                },
            ],
            "retry_count": 0,
        }
        result = validate_quiz(state)
        assert result["validation_errors"] == []
        assert result["quiz_payload"]["questions"] is not None

    def test_retry_count_increments_on_error(self):
        state = {"questions": [], "retry_count": 1}
        result = validate_quiz(state)
        assert result["retry_count"] == 2


class TestRetrieveContentNode:
    @patch("src.agent.nodes.RagService")
    def test_retrieve_content_vocabulary(self, mock_rag_cls):
        mock_instance = MagicMock()
        mock_instance.retrieve_content.return_value = [{"content": "test"}]
        mock_rag_cls.return_value = mock_instance

        state = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": "user-1",
        }
        result = retrieve_content(state)

        assert "retrieved_content" in result
        assert len(result["retrieved_content"]) == 1

    @patch("src.agent.nodes.RagService")
    @patch("src.agent.nodes.ChapterRepository")
    def test_retrieve_content_mixed(self, mock_chapter_cls, mock_rag_cls):
        mock_rag = MagicMock()
        mock_rag.retrieve_mixed_content.return_value = [{"content": "mixed"}]
        mock_rag_cls.return_value = mock_rag

        mock_chapter = MagicMock()
        mock_chapter.get_available_exercise_types.return_value = [
            "vocabulary",
            "grammar",
        ]
        mock_chapter_cls.return_value = mock_chapter
        # parse_chapter_id is a staticmethod, patch it to return expected values
        mock_chapter_cls.parse_chapter_id.return_value = (1, 1)

        state = {
            "book_id": 1,
            "chapter_id": 101,
            "exercise_type": "mixed",
            "user_id": "user-1",
        }
        result = retrieve_content(state)

        assert len(result["retrieved_content"]) == 1
        mock_rag.retrieve_mixed_content.assert_called_once()
