"""Tests for quiz generation graph nodes with mocked dependencies."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.agent.nodes import (
    _format_chapter_content,
    _format_structured_dialogues,
    _format_structured_grammar_points,
    _format_structured_vocabulary,
    _parse_evaluation_response,
    _parse_questions_json,
    retrieve_content,
    retrieve_structured_content,
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
    @pytest.mark.asyncio
    async def test_validates_empty_questions(self):
        state = {"questions": [], "retry_count": 0}
        result = await validate_structure(state)
        assert len(result["validation_errors"]) > 0
        assert result["retry_count"] == 1

    @pytest.mark.asyncio
    async def test_validates_missing_fields(self):
        state = {
            "questions": [{"question_id": "q1"}],
            "retry_count": 0,
        }
        result = await validate_structure(state)
        assert len(result["validation_errors"]) > 0

    @pytest.mark.asyncio
    async def test_validates_duplicate_question_text(self):
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
        result = await validate_structure(state)
        # Duplicate question is dropped, valid one kept
        assert len(result["questions"]) == 1
        assert result["questions"][0]["question_id"] == "q1"
        # No validation_errors since we still have valid questions
        assert result["validation_errors"] == []

    @pytest.mark.asyncio
    async def test_validates_duplicate_options(self):
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
        result = await validate_structure(state)
        # Only question was invalid and dropped — triggers retry
        assert len(result["questions"]) == 0
        assert any("duplicate options" in e for e in result["validation_errors"])

    @pytest.mark.asyncio
    async def test_validates_correct_answer_not_in_options(self):
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
        result = await validate_structure(state)
        assert any(
            "correct_answer not in options" in e for e in result["validation_errors"]
        )

    @pytest.mark.asyncio
    async def test_validates_good_questions_pass(self):
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
        result = await validate_structure(state)
        assert result["validation_errors"] == []
        # Story 4.15: validate_structure now sets quiz_payload directly
        # (evaluate_content node deprecated — AC #9)
        assert "quiz_payload" in result
        assert result["quiz_payload"]["questions"][0]["question_id"] == "q1"

    @pytest.mark.asyncio
    async def test_retry_count_increments_on_error(self):
        state = {"questions": [], "retry_count": 1}
        result = await validate_structure(state)
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
    @pytest.mark.asyncio
    @patch("src.agent.nodes.RagService")
    async def test_retrieve_content_vocabulary(self, mock_rag_cls):
        mock_instance = MagicMock()
        mock_instance.retrieve_content.return_value = [{"content": "test"}]
        mock_rag_cls.return_value = mock_instance

        state = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": "user-1",
        }
        result = await retrieve_content(state)

        assert "retrieved_content" in result
        assert len(result["retrieved_content"]) == 1

    @pytest.mark.asyncio
    @patch("src.agent.nodes.RagService")
    @patch("src.agent.nodes.ChapterRepository")
    async def test_retrieve_content_mixed(self, mock_chapter_cls, mock_rag_cls):
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
        result = await retrieve_content(state)

        assert len(result["retrieved_content"]) == 1
        mock_rag.retrieve_mixed_content.assert_called_once()


class TestEvaluateContentNode:
    """Tests for the evaluate_content LLM-based content evaluator node."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_evaluate_content_passed(self, mock_llm_client):
        """Test evaluate_content when all questions pass all 5 rules."""
        from src.agent.nodes import evaluate_content

        # Mock LLM to return passed evaluation
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = '{"passed": true, "issues": []}'
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)
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

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
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
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)
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

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
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
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)
        mock_llm_client.return_value = mock_llm

        state = {
            "questions": [{"question_id": "q2", "pinyin": "ni3 hao3"}],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

        assert len(result["validation_errors"]) == 1
        assert "pinyin_diacritics" in result["evaluator_feedback"]

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
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

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_evaluate_content_defaults_to_pass_on_llm_error(
        self, mock_llm_client
    ):
        """Test evaluate_content defaults to PASS if evaluator LLM fails."""
        from src.agent.nodes import evaluate_content

        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(side_effect=Exception("OpenAI API timeout"))
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
    """Tests for graph conditional edge routing functions (Story 4.15 topology)."""

    def test_after_structure_validation_no_errors_routes_to_end(self):
        """Test routing to END when validation passes (evaluate_content removed — AC #9)."""
        from src.agent.graph import _after_structure_validation

        state = {"validation_errors": [], "retry_count": 0}
        result = _after_structure_validation(state)
        # Story 4.15: no evaluate_content — goes to END on success
        assert result == "__end__"

    def test_after_structure_validation_errors_routes_to_retry(self):
        """Test routing to generate_quiz when validation errors exist and retries remain."""
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

    def test_route_by_tier_vocabulary_routes_to_algorithmic(self):
        """Test Tier 1 vocabulary routes to algorithmic_generate."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "vocabulary"}
        result = _route_by_tier(state)
        assert result == "algorithmic_generate"

    def test_route_by_tier_matching_routes_to_algorithmic(self):
        """Test Tier 1 matching routes to algorithmic_generate."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "matching"}
        result = _route_by_tier(state)
        assert result == "algorithmic_generate"

    def test_route_by_tier_fill_in_blank_routes_to_algorithmic(self):
        """Test Tier 1 fill_in_blank routes to algorithmic_generate."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "fill_in_blank"}
        result = _route_by_tier(state)
        assert result == "algorithmic_generate"

    def test_route_by_tier_grammar_routes_to_structured(self):
        """Test Tier 2 grammar routes to retrieve_structured_content."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "grammar"}
        result = _route_by_tier(state)
        assert result == "retrieve_structured_content"

    def test_route_by_tier_sentence_construction_routes_to_structured(self):
        """Test Tier 2 sentence_construction routes to retrieve_structured_content."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "sentence_construction"}
        result = _route_by_tier(state)
        assert result == "retrieve_structured_content"

    def test_route_by_tier_dialogue_completion_routes_to_structured(self):
        """Test Tier 2 dialogue_completion routes to retrieve_structured_content."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "dialogue_completion"}
        result = _route_by_tier(state)
        assert result == "retrieve_structured_content"

    def test_route_by_tier_reading_comprehension_routes_to_structured(self):
        """Test Tier 2 reading_comprehension routes to retrieve_structured_content."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "reading_comprehension"}
        result = _route_by_tier(state)
        assert result == "retrieve_structured_content"

    def test_route_by_tier_mixed_routes_to_structured(self):
        """Test mixed type routes to retrieve_structured_content (Tier 2 path)."""
        from src.agent.graph import _route_by_tier

        state = {"exercise_type": "mixed"}
        result = _route_by_tier(state)
        assert result == "retrieve_structured_content"


# -----------------------------------------------------------------------
# Structured content node tests (Story 4.14)
# -----------------------------------------------------------------------


class TestRetrieveStructuredContentNode:
    """Tests for the retrieve_structured_content graph node."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.ContentService")
    async def test_returns_structured_content(self, mock_service_cls):
        """Test normal structured content retrieval."""
        mock_service = MagicMock()
        mock_service.retrieve_chapter_content.return_value = {
            "vocabulary": [{"traditional": "學", "pinyin": "xué"}],
            "grammar_points": [{"title_english": "Using 是"}],
            "dialogues": [],
        }
        mock_service_cls.return_value = mock_service

        state = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": "user-1",
        }
        result = await retrieve_structured_content(state)

        assert "structured_content" in result
        assert "grammar_points_list" in result
        assert len(result["grammar_points_list"]) == 1
        assert result["grammar_points_list"][0]["title_english"] == "Using 是"

    @pytest.mark.asyncio
    @patch("src.agent.nodes.RagService")
    @patch("src.agent.nodes.ContentService")
    async def test_falls_back_to_rag_when_empty(self, mock_service_cls, mock_rag_cls):
        """Test fallback to RAG when structured tables are empty."""
        mock_service = MagicMock()
        mock_service.retrieve_chapter_content.return_value = {
            "vocabulary": [],
            "grammar_points": [],
        }
        mock_service_cls.return_value = mock_service

        mock_rag = MagicMock()
        mock_rag.retrieve_content.return_value = [{"content": "rag chunk"}]
        mock_rag_cls.return_value = mock_rag

        state = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": "user-1",
        }
        result = await retrieve_structured_content(state)

        assert result["structured_content"] == {}
        assert result["grammar_points_list"] == []
        assert len(result["retrieved_content"]) == 1
        mock_rag.retrieve_content.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.ContentService")
    async def test_client_disconnection_aborts(self, mock_service_cls):
        """Test cancellation when client disconnects."""
        import asyncio

        mock_request = MagicMock()
        mock_request.is_disconnected = AsyncMock(return_value=True)

        state = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": "user-1",
            "request": mock_request,
        }

        with pytest.raises(asyncio.CancelledError):
            await retrieve_structured_content(state)

        mock_service_cls.assert_not_called()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.ContentService")
    async def test_passes_rag_chunks_as_retrieved_content(self, mock_service_cls):
        """Test that rag_chunks from content service pass to retrieved_content."""
        mock_service = MagicMock()
        mock_service.retrieve_chapter_content.return_value = {
            "vocabulary": [{"traditional": "好"}],
            "grammar_points": [{"title_english": "Verb 好"}],
            "rag_chunks": [{"content": "supplementary"}],
        }
        mock_service_cls.return_value = mock_service

        state = {
            "book_id": 1,
            "chapter_id": 101,
            "exercise_type": "grammar",
            "user_id": "user-1",
        }
        result = await retrieve_structured_content(state)

        assert result["retrieved_content"] == [{"content": "supplementary"}]


class TestValidateStructureGrammarCoverage:
    """Tests for grammar coverage validation in validate_structure (AC #3)."""

    @pytest.mark.asyncio
    async def test_full_grammar_coverage_passes(self):
        """Test that all grammar points covered = no retry."""
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test 是",
                    "correct_answer": "a",
                    "exercise_type": "grammar",
                    "explanation": "x",
                    "grammar_pattern": "Using 是",
                },
                {
                    "question_id": "q2",
                    "question_text": "Test 在",
                    "correct_answer": "b",
                    "exercise_type": "grammar",
                    "explanation": "y",
                    "grammar_pattern": "Using 在",
                },
            ],
            "retry_count": 0,
            "grammar_points_list": [
                {"title_english": "Using 是"},
                {"title_english": "Using 在"},
            ],
        }
        result = await validate_structure(state)
        assert result["validation_errors"] == []
        assert result["retry_count"] == 0

    @pytest.mark.asyncio
    async def test_missing_grammar_coverage_triggers_retry(self):
        """Test that missing grammar point coverage triggers retry (min(4,total) check)."""
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test 是",
                    "correct_answer": "a",
                    "exercise_type": "grammar",
                    "explanation": "x",
                    "grammar_pattern": "Using 是",
                },
            ],
            "retry_count": 0,
            "grammar_points_list": [
                {"title_english": "Using 是"},
                {"title_english": "Using 在"},
            ],
        }
        result = await validate_structure(state)
        assert result["retry_count"] == 1
        assert any("Using 在" in e for e in result["validation_errors"])
        # Story 4.15: evaluator_feedback removed — feedback in validation_errors
        assert "evaluator_feedback" not in result

    @pytest.mark.asyncio
    async def test_no_grammar_points_skips_coverage_check(self):
        """Test that empty grammar_points_list skips coverage validation."""
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test",
                    "correct_answer": "a",
                    "exercise_type": "vocabulary",
                    "explanation": "x",
                },
            ],
            "retry_count": 0,
            "grammar_points_list": [],
        }
        result = await validate_structure(state)
        assert result["validation_errors"] == []
        assert result["retry_count"] == 0

    @pytest.mark.asyncio
    async def test_no_grammar_points_key_skips_coverage_check(self):
        """Test that missing grammar_points_list key skips coverage."""
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "Test",
                    "correct_answer": "a",
                    "exercise_type": "vocabulary",
                    "explanation": "x",
                },
            ],
            "retry_count": 0,
        }
        result = await validate_structure(state)
        assert result["validation_errors"] == []


class TestFormatStructuredVocabulary:
    """Tests for _format_structured_vocabulary helper."""

    def test_formats_vocabulary_items(self):
        vocab = [
            {
                "traditional": "學",
                "pinyin": "xué",
                "english": "to study",
                "part_of_speech": "V",
            },
        ]
        result = _format_structured_vocabulary(vocab)
        assert "學" in result
        assert "xué" in result
        assert "to study" in result
        assert "(V)" in result

    def test_empty_list_returns_placeholder(self):
        result = _format_structured_vocabulary([])
        assert "No vocabulary" in result

    def test_missing_part_of_speech(self):
        vocab = [
            {"traditional": "我", "pinyin": "wǒ", "english": "I"},
        ]
        result = _format_structured_vocabulary(vocab)
        assert "我" in result
        assert "()" not in result


class TestFormatStructuredGrammarPoints:
    """Tests for _format_structured_grammar_points helper."""

    def test_formats_grammar_points(self):
        gps = [
            {
                "title_english": "Using 是",
                "title_chinese": "是的用法",
                "structure_pattern": "Subject + 是 + Noun",
                "function_description": "Equative verb",
                "usage_notes": "Identification",
                "examples": [{"chinese": "我是學生", "english": "I am a student"}],
            },
        ]
        result = _format_structured_grammar_points(gps)
        assert "Using 是" in result
        assert "Subject + 是 + Noun" in result
        assert "我是學生" in result

    def test_empty_list_returns_placeholder(self):
        result = _format_structured_grammar_points([])
        assert "No grammar" in result


class TestFormatStructuredDialogues:
    """Tests for _format_structured_dialogues helper."""

    def test_formats_dialogues(self):
        dialogues = [
            {
                "dialogue_number": 1,
                "title_traditional": "在學校",
                "title_english": "At School",
                "lines": [
                    {"speaker": "A", "traditional": "你好！", "english": "Hello!"},
                ],
            },
        ]
        result = _format_structured_dialogues(dialogues)
        assert "Dialogue 1" in result
        assert "在學校" in result
        assert "你好！" in result

    def test_empty_list_returns_placeholder(self):
        result = _format_structured_dialogues([])
        assert "No dialogue" in result


class TestGraphTopologyUpdated:
    """Tests confirming graph topology after Story 4.15 (3-tier hybrid)."""

    def test_graph_has_retrieve_structured_content_node(self):
        """Confirm the compiled graph includes retrieve_structured_content."""
        from src.agent.graph import graph

        # The compiled Pregel graph has .nodes attribute
        node_names = list(graph.nodes.keys())
        assert "retrieve_structured_content" in node_names

    def test_graph_does_not_have_old_retrieve_content_node(self):
        """Confirm retrieve_content was replaced in the graph."""
        from src.agent.graph import graph

        node_names = list(graph.nodes.keys())
        assert "retrieve_content" not in node_names

    def test_graph_has_algorithmic_generate_node(self):
        """Confirm algorithmic_generate (Tier 1) node exists in graph (AC #9)."""
        from src.agent.graph import graph

        node_names = list(graph.nodes.keys())
        assert "algorithmic_generate" in node_names

    def test_graph_does_not_have_evaluate_content_node(self):
        """Confirm evaluate_content node removed from graph (AC #9)."""
        from src.agent.graph import graph

        node_names = list(graph.nodes.keys())
        assert "evaluate_content" not in node_names

    def test_graph_has_required_tier2_nodes(self):
        """Verify Tier 2 nodes: query_weakness, generate_quiz, validate_structure."""
        from src.agent.graph import graph

        node_names = list(graph.nodes.keys())
        for expected in [
            "query_weakness",
            "generate_quiz",
            "validate_structure",
        ]:
            assert expected in node_names


class TestBackwardCompatibility:
    """Tests verifying the quiz response format is unchanged (AC #8)."""

    @pytest.mark.asyncio
    async def test_validate_structure_produces_same_payload_format(self):
        """Test validate_structure produces quiz_payload with questions list (Story 4.15)."""
        state = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "exercise_type": "vocabulary",
                    "explanation": "學 means to study",
                    "options": ["to study", "to eat", "to go", "to read"],
                }
            ],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await validate_structure(state)

        # Verify backward-compatible payload structure
        assert "quiz_payload" in result
        assert "questions" in result["quiz_payload"]
        questions = result["quiz_payload"]["questions"]
        assert len(questions) == 1
        q = questions[0]
        assert "question_text" in q
        assert "correct_answer" in q
        assert "exercise_type" in q
        assert "explanation" in q
        assert "options" in q


class TestStateStructuredContentFields:
    """Tests confirming new state fields exist in QuizGenerationState."""

    def test_state_has_structured_content_field(self):
        """Verify QuizGenerationState accepts structured_content."""
        from src.agent.state import QuizGenerationState

        annotations = QuizGenerationState.__annotations__
        assert "structured_content" in annotations
        assert "grammar_points_list" in annotations

    def test_state_has_generation_tier_field(self):
        """Verify QuizGenerationState accepts generation_tier (Story 4.15)."""
        from src.agent.state import QuizGenerationState

        annotations = QuizGenerationState.__annotations__
        assert "generation_tier" in annotations

    def test_state_does_not_have_evaluator_feedback(self):
        """Verify evaluator_feedback removed from state (AC #9)."""
        from src.agent.state import QuizGenerationState

        annotations = QuizGenerationState.__annotations__
        assert "evaluator_feedback" not in annotations


class TestMultiChapterRangeExpansion:
    """Range expansion + question distribution helpers used by the
    multi-chapter quiz endpoint."""

    def test_expand_skips_gap_between_books(self):
        """215..303 expands to [211..215, 301..303] — 216..300 are skipped."""
        from src.services.quiz_service import _expand_chapter_range

        result = _expand_chapter_range(211, 303)
        expected = [211, 212, 213, 214, 215, 301, 302, 303]
        assert result == expected

    def test_expand_single_chapter(self):
        from src.services.quiz_service import _expand_chapter_range

        assert _expand_chapter_range(105, 105) == [105]

    def test_expand_empty_for_invalid_book(self):
        """Book 5 is not in BOOK_CHAPTER_COUNTS so its ids are skipped."""
        from src.services.quiz_service import _expand_chapter_range

        assert _expand_chapter_range(501, 510) == []

    def test_expand_skips_invalid_chapter_within_book(self):
        """Book 1 has 15 chapters; 116..120 must be skipped."""
        from src.services.quiz_service import _expand_chapter_range

        result = _expand_chapter_range(114, 120)
        assert result == [114, 115]

    def test_distribute_even(self):
        from src.services.quiz_service import _distribute

        assert _distribute(10, 5) == [2, 2, 2, 2, 2]

    def test_distribute_remainder(self):
        from src.services.quiz_service import _distribute

        # 10 / 3 = 3 base + 1 remainder. First slot gets the extra.
        assert _distribute(10, 3) == [4, 3, 3]
        assert sum(_distribute(10, 3)) == 10

    def test_distribute_more_slots_than_total(self):
        """When slots > total, base=0 and the first `total` slots get 1."""
        from src.services.quiz_service import _distribute

        assert _distribute(3, 5) == [1, 1, 1, 0, 0]


class TestMultiChapterQuizService:
    """End-to-end tests for QuizService.generate_multi_chapter_quiz with
    graph.ainvoke mocked."""

    def _make_question(self, etype: str, idx: int) -> dict:
        """Build a minimal vocabulary-shaped question that passes
        the discriminated union validation."""
        return {
            "exercise_type": "vocabulary",
            "question_text": f"q-{etype}-{idx}",
            "correct_answer": "A",
            "explanation": "because",
            "source_citation": "src",
            "options": ["A", "B", "C", "D"],
            "character": "你",
            "pinyin": "nǐ",
            "meaning": "you",
            "question_subtype": "char_to_pinyin",
        }

    @pytest.mark.asyncio
    async def test_merges_questions_across_combos(self):
        from src.api.schemas import ExerciseType, QuizGenerateMultiRequest
        from src.services.quiz_service import QuizService

        service = QuizService()

        # Each combo returns 5 questions; we ask for 6 total across 2
        # chapters x 1 type = 2 combos -> 3 each.
        async def fake_ainvoke(graph_input):
            etype = graph_input["exercise_type"]
            return {
                "quiz_payload": {
                    "questions": [self._make_question(etype, i) for i in range(5)]
                }
            }

        request = QuizGenerateMultiRequest(
            chapter_id_start=211,
            chapter_id_end=212,
            question_count=6,
            exercise_types=[ExerciseType.VOCABULARY],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await service.generate_multi_chapter_quiz(
                request, user_id="u1", http_request=None
            )

        assert response.question_count == 6
        assert len(response.questions) == 6
        assert response.chapter_ids == [211, 212]
        assert response.exercise_types == ["vocabulary"]
        # Re-ID assertion
        assert [q.question_id for q in response.questions] == [
            f"q{i + 1}" for i in range(6)
        ]

    @pytest.mark.asyncio
    async def test_one_failing_combo_does_not_sink_quiz(self):
        from src.api.schemas import ExerciseType, QuizGenerateMultiRequest
        from src.services.quiz_service import QuizService

        service = QuizService()

        async def fake_ainvoke(graph_input):
            if graph_input["chapter_id"] == 211:
                raise RuntimeError("boom")
            return {
                "quiz_payload": {
                    "questions": [
                        self._make_question("vocabulary", i) for i in range(5)
                    ]
                }
            }

        request = QuizGenerateMultiRequest(
            chapter_id_start=211,
            chapter_id_end=212,
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await service.generate_multi_chapter_quiz(
                request, user_id="u1", http_request=None
            )

        # 212 returned 5 questions; 211 errored. We still get 5.
        assert response.question_count == 5

    @pytest.mark.asyncio
    async def test_invalid_range_raises(self):
        from src.api.schemas import ExerciseType, QuizGenerateMultiRequest
        from src.services.quiz_service import QuizService

        request = QuizGenerateMultiRequest(
            chapter_id_start=303,
            chapter_id_end=211,
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )
        with pytest.raises(ValueError, match="chapter_id_start must be"):
            await QuizService().generate_multi_chapter_quiz(
                request, user_id="u1", http_request=None
            )

    @pytest.mark.asyncio
    async def test_all_failing_combos_raises(self):
        from src.api.schemas import ExerciseType, QuizGenerateMultiRequest
        from src.services.quiz_service import QuizService

        async def fake_ainvoke(_):
            raise RuntimeError("nope")

        request = QuizGenerateMultiRequest(
            chapter_id_start=211,
            chapter_id_end=212,
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            with pytest.raises(ValueError, match="no questions produced"):
                await QuizService().generate_multi_chapter_quiz(
                    request, user_id="u1", http_request=None
                )


class TestCustomQuizService:
    """End-to-end tests for QuizService.generate_custom_quiz with
    graph.ainvoke mocked."""

    def _make_question(self, etype: str, tag: str) -> dict:
        """Build a minimal vocabulary-shaped question that passes
        the discriminated union validation."""
        return {
            "exercise_type": "vocabulary",
            "question_text": f"q-{etype}-{tag}",
            "correct_answer": "A",
            "explanation": "because",
            "source_citation": "src",
            "options": ["A", "B", "C", "D"],
            "character": "你",
            "pinyin": "nǐ",
            "meaning": "you",
            "question_subtype": "char_to_pinyin",
        }

    @pytest.mark.asyncio
    async def test_explicit_chapter_list_is_used(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        seen_chapter_ids: list[int] = []

        async def fake_ainvoke(graph_input):
            seen_chapter_ids.append(graph_input["chapter_id"])
            return {
                "quiz_payload": {
                    "questions": [
                        self._make_question(
                            graph_input["exercise_type"],
                            f"{graph_input['chapter_id']}-{i}",
                        )
                        for i in range(4)
                    ]
                }
            }

        request = QuizGenerateCustomRequest(
            chapter_ids=[101, 207, 305],
            question_count=9,
            exercise_types=[ExerciseType.VOCABULARY],
            seed=42,
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

        assert sorted(seen_chapter_ids) == [101, 207, 305]
        assert response.chapter_ids == [101, 207, 305]
        assert response.question_count == 9
        assert response.seed == 42
        # Re-IDed sequentially
        assert [q.question_id for q in response.questions] == [
            f"q{i + 1}" for i in range(9)
        ]

    @pytest.mark.asyncio
    async def test_invalid_chapter_ids_are_filtered(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        async def fake_ainvoke(graph_input):
            return {
                "quiz_payload": {
                    "questions": [self._make_question("vocabulary", "x")]
                }
            }

        # 999 and 250 (book 2 only has 15 lessons) are invalid; 101 valid
        request = QuizGenerateCustomRequest(
            chapter_ids=[999, 250, 101],
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

        assert response.chapter_ids == [101]

    @pytest.mark.asyncio
    async def test_all_invalid_chapter_ids_raises(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        request = QuizGenerateCustomRequest(
            chapter_ids=[999, 888],
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )
        with pytest.raises(ValueError, match="No valid chapter_ids"):
            await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

    @pytest.mark.asyncio
    async def test_diversity_seed_is_threaded_into_graph(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        diversity_seeds: list[int] = []
        avoid_lists: list[list[str]] = []
        temps: list[float] = []

        async def fake_ainvoke(graph_input):
            diversity_seeds.append(graph_input.get("diversity_seed"))
            avoid_lists.append(graph_input.get("avoid_question_texts"))
            temps.append(graph_input.get("generation_temperature"))
            return {
                "quiz_payload": {
                    "questions": [
                        self._make_question("vocabulary", "a"),
                        self._make_question("vocabulary", "b"),
                    ]
                }
            }

        request = QuizGenerateCustomRequest(
            chapter_ids=[101, 102],
            question_count=6,
            exercise_types=[ExerciseType.VOCABULARY],
            seed=7,
            avoid_question_texts=["prev-1", "prev-2"],
            temperature=1.0,
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

        # All combos must carry the avoid list + temperature override.
        assert all(a == ["prev-1", "prev-2"] for a in avoid_lists)
        assert all(t == 1.0 for t in temps)
        # Diversity seeds must be distinct per combo so two combos produce
        # different LLM outputs even for the same chapter/type.
        assert len(set(diversity_seeds)) == len(diversity_seeds)
        assert response.seed == 7

    @pytest.mark.asyncio
    async def test_dedupe_against_avoid_list(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        async def fake_ainvoke(graph_input):
            # Combo returns one question that the client said to avoid + new
            return {
                "quiz_payload": {
                    "questions": [
                        {
                            **self._make_question("vocabulary", "stale"),
                            "question_text": "prev-1",
                        },
                        self._make_question("vocabulary", "fresh"),
                    ]
                }
            }

        request = QuizGenerateCustomRequest(
            chapter_ids=[101, 102],
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
            avoid_question_texts=["prev-1"],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

        # None of the returned questions should match the avoid list.
        for q in response.questions:
            assert q.question_text != "prev-1"

    @pytest.mark.asyncio
    async def test_random_seed_when_not_provided(self):
        from src.api.schemas import ExerciseType, QuizGenerateCustomRequest
        from src.services.quiz_service import QuizService

        async def fake_ainvoke(_):
            return {
                "quiz_payload": {
                    "questions": [self._make_question("vocabulary", "x")]
                }
            }

        request = QuizGenerateCustomRequest(
            chapter_ids=[101],
            question_count=5,
            exercise_types=[ExerciseType.VOCABULARY],
        )

        with patch(
            "src.services.quiz_service.graph.ainvoke",
            side_effect=fake_ainvoke,
        ):
            response = await QuizService().generate_custom_quiz(
                request, user_id="u1", http_request=None
            )

        # Seed was auto-generated and surfaced back to the caller.
        assert response.seed > 0
