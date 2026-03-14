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
        # Duplicate question is dropped, valid one kept
        assert len(result["questions"]) == 1
        assert result["questions"][0]["question_id"] == "q1"
        # No validation_errors since we still have valid questions
        assert result["validation_errors"] == []

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
        # Only question was invalid and dropped — triggers retry
        assert len(result["questions"]) == 0
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

    def test_full_grammar_coverage_passes(self):
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
        result = validate_structure(state)
        assert result["validation_errors"] == []
        assert result["retry_count"] == 0

    def test_missing_grammar_coverage_triggers_retry(self):
        """Test that missing grammar point coverage triggers retry."""
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
        result = validate_structure(state)
        assert result["retry_count"] == 1
        assert any("Using 在" in e for e in result["validation_errors"])
        assert "evaluator_feedback" in result
        assert "Using 在" in result["evaluator_feedback"]

    def test_no_grammar_points_skips_coverage_check(self):
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
        result = validate_structure(state)
        assert result["validation_errors"] == []
        assert result["retry_count"] == 0

    def test_no_grammar_points_key_skips_coverage_check(self):
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
        result = validate_structure(state)
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
    """Tests confirming graph uses retrieve_structured_content node."""

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

    def test_graph_still_has_all_other_nodes(self):
        """Verify query_weakness, generate_quiz, validate_structure, evaluate_content remain."""
        from src.agent.graph import graph

        node_names = list(graph.nodes.keys())
        for expected in [
            "query_weakness",
            "generate_quiz",
            "validate_structure",
            "evaluate_content",
        ]:
            assert expected in node_names


class TestBackwardCompatibility:
    """Tests verifying the quiz response format is unchanged (AC #4)."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_evaluate_content_produces_same_payload_format(self, mock_llm_client):
        """Test evaluate_content still produces quiz_payload with questions list."""
        from src.agent.nodes import evaluate_content

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
                    "options": ["to study", "to eat", "to go", "to read"],
                }
            ],
            "retry_count": 0,
            "validation_errors": [],
        }

        result = await evaluate_content(state)

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
