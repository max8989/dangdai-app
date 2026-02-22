"""Tests for quiz generation graph nodes with mocked dependencies."""

import json
from unittest.mock import MagicMock, patch

from src.agent.nodes import (
    _format_chapter_content,
    _parse_evaluation_response,
    _parse_questions_json,
    retrieve_content,
    validate_structure,
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


class TestValidateStructure:
    def test_validates_empty_questions(self):
        state = {"questions": [], "retry_count": 0}
        result = validate_structure(state)
        assert len(result["validation_errors"]) > 0
        assert result["retry_count"] == 1

    def test_validates_missing_fields(self):
        state = {
            "questions": [{"question_id": "q1"}],
            "retry_count": 0,
        }
        result = validate_structure(state)
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
        result = validate_structure(state)
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
        result = validate_structure(state)
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
        result = validate_structure(state)
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
        result = validate_structure(state)
        assert result["validation_errors"] == []
        # validate_structure no longer sets quiz_payload (evaluate_content does)
        assert "quiz_payload" not in result

    def test_retry_count_increments_on_error(self):
        state = {"questions": [], "retry_count": 1}
        result = validate_structure(state)
        assert result["retry_count"] == 2


class TestParseEvaluationResponse:
    def test_parse_valid_passed(self):
        content = '{"passed": true, "issues": []}'
        result = _parse_evaluation_response(content)
        assert result["passed"] is True
        assert result["issues"] == []

    def test_parse_valid_failed(self):
        content = json.dumps(
            {
                "passed": False,
                "issues": [
                    {
                        "question_id": "q1",
                        "rule": "traditional_chinese",
                        "detail": "Found Simplified 学",
                    }
                ],
            }
        )
        result = _parse_evaluation_response(content)
        assert result["passed"] is False
        assert len(result["issues"]) == 1

    def test_parse_with_code_block(self):
        content = '```json\n{"passed": true, "issues": []}\n```'
        result = _parse_evaluation_response(content)
        assert result["passed"] is True

    def test_parse_invalid_json_defaults_to_pass(self):
        result = _parse_evaluation_response("not valid json")
        assert result["passed"] is True
        assert result["issues"] == []

    def test_parse_non_dict_defaults_to_pass(self):
        result = _parse_evaluation_response("[1, 2, 3]")
        assert result["passed"] is True


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


class TestEvaluateContentNode:
    """Tests for the evaluate_content LLM-based content evaluator node."""

    @patch("src.agent.nodes.get_llm_client")
    async def test_evaluate_content_passed(self, mock_llm_client):
        """Test evaluate_content when all questions pass all 5 rules."""
        from src.agent.nodes import evaluate_content

        # Mock LLM to return passed evaluation
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = '{"passed": true, "issues": []}'
        mock_llm.ainvoke.return_value = mock_response
        mock_llm_client.return_value = mock_llm

        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "exercise_type": "vocabulary",
                    "explanation": "學 means to study",
                }
            ],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

        assert result["validation_errors"] == []
        assert result["evaluator_feedback"] == ""
        assert "quiz_payload" in result
        assert result["quiz_payload"]["questions"] == state["questions"]
        mock_llm.ainvoke.assert_called_once()

    @patch("src.agent.nodes.get_llm_client")
    async def test_evaluate_content_failed_traditional_chinese(self, mock_llm_client):
        """Test evaluate_content detects Simplified Chinese violation."""
        from src.agent.nodes import evaluate_content

        # Mock LLM to return failed evaluation with Simplified Chinese issue
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "passed": False,
                "issues": [
                    {
                        "question_id": "q1",
                        "rule": "traditional_chinese",
                        "detail": "Field 'character' contains Simplified '学' — should be '學'",
                    }
                ],
            }
        )
        mock_llm.ainvoke.return_value = mock_response
        mock_llm_client.return_value = mock_llm

        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "character": "学",  # Simplified
                    "question_text": "Test",
                }
            ],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

        assert len(result["validation_errors"]) == 1
        assert "Content evaluation failed" in result["validation_errors"][0]
        assert "traditional_chinese" in result["evaluator_feedback"]
        assert result["retry_count"] == 1

    @patch("src.agent.nodes.get_llm_client")
    async def test_evaluate_content_failed_pinyin_diacritics(self, mock_llm_client):
        """Test evaluate_content detects pinyin tone number violation."""
        from src.agent.nodes import evaluate_content

        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "passed": False,
                "issues": [
                    {
                        "question_id": "q2",
                        "rule": "pinyin_diacritics",
                        "detail": "Pinyin uses tone numbers 'ni3' — should be 'nǐ'",
                    }
                ],
            }
        )
        mock_llm.ainvoke.return_value = mock_response
        mock_llm_client.return_value = mock_llm

        state = {
            "questions": [{"question_id": "q2", "pinyin": "ni3 hao3"}],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

        assert len(result["validation_errors"]) == 1
        assert "pinyin_diacritics" in result["evaluator_feedback"]

    @patch("src.agent.nodes.get_llm_client")
    async def test_evaluate_content_skipped_when_structural_errors(
        self, mock_llm_client
    ):
        """Test evaluate_content is skipped if structural validation failed."""
        from src.agent.nodes import evaluate_content

        state = {
            "questions": [{"question_id": "q1"}],
            "retry_count": 0,
            "validation_errors": ["Missing required field 'question_text'"],
        }

        result = await evaluate_content(state)

        assert result == {}
        mock_llm_client.assert_not_called()

    @patch("src.agent.nodes.get_llm_client")
    async def test_evaluate_content_defaults_to_pass_on_llm_error(
        self, mock_llm_client
    ):
        """Test evaluate_content defaults to PASS if evaluator LLM fails."""
        from src.agent.nodes import evaluate_content

        mock_llm = MagicMock()
        mock_llm.ainvoke.side_effect = Exception("OpenAI API timeout")
        mock_llm_client.return_value = mock_llm

        state = {
            "questions": [{"question_id": "q1", "question_text": "Test"}],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

        assert result["validation_errors"] == []
        assert result["evaluator_feedback"] == ""
        assert "quiz_payload" in result


class TestGraphRoutingFunctions:
    """Tests for graph conditional edge routing functions."""

    def test_after_structure_validation_no_errors_routes_to_evaluator(self):
        """Test routing to evaluate_content when structural validation passes."""
        from src.agent.graph import _after_structure_validation

        state = {"validation_errors": [], "retry_count": 0}
        result = _after_structure_validation(state)
        assert result == "evaluate_content"

    def test_after_structure_validation_errors_routes_to_retry(self):
        """Test routing to generate_quiz when structural errors exist and retries remain."""
        from src.agent.graph import _after_structure_validation

        state = {
            "validation_errors": ["Missing field 'question_text'"],
            "retry_count": 0,
        }
        result = _after_structure_validation(state)
        assert result == "generate_quiz"

    def test_after_structure_validation_max_retries_routes_to_end(self):
        """Test routing to END when max retries reached."""
        from src.agent.graph import _after_structure_validation

        state = {"validation_errors": ["Error"], "retry_count": 3}
        result = _after_structure_validation(state)
        assert result == "__end__"

    def test_after_content_evaluation_no_errors_routes_to_end(self):
        """Test routing to END when content evaluation passes."""
        from src.agent.graph import _after_content_evaluation

        state = {"validation_errors": [], "retry_count": 0}
        result = _after_content_evaluation(state)
        assert result == "__end__"

    def test_after_content_evaluation_errors_routes_to_retry(self):
        """Test routing to generate_quiz when content evaluation fails and retries remain."""
        from src.agent.graph import _after_content_evaluation

        state = {
            "validation_errors": ["Content evaluation failed"],
            "retry_count": 1,
        }
        result = _after_content_evaluation(state)
        assert result == "generate_quiz"

    def test_after_content_evaluation_max_retries_routes_to_end(self):
        """Test routing to END when max retries reached after content evaluation."""
        from src.agent.graph import _after_content_evaluation

        state = {"validation_errors": ["Error"], "retry_count": 3}
        result = _after_content_evaluation(state)
        assert result == "__end__"
