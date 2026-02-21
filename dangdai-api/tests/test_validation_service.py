"""Unit tests for ValidationService."""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.api.schemas import ValidationRequest, ValidationResponse
from src.services.validation_service import ValidationService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_request(
    exercise_type: str = "sentence_construction",
    user_answer: str = "我在大學學中文",
    correct_answer: str = "我在大學學中文",
    question: str = "Arrange these words: 我 中文 學 在 大學",
) -> ValidationRequest:
    return ValidationRequest(
        question=question,
        user_answer=user_answer,
        correct_answer=correct_answer,
        exercise_type=exercise_type,  # type: ignore[arg-type]
    )


def _mock_llm_response(content: str) -> MagicMock:
    response = MagicMock()
    response.content = content
    return response


# ---------------------------------------------------------------------------
# Tests: validate_answer — successful LLM responses
# ---------------------------------------------------------------------------


class TestValidationServiceCorrectAnswer:
    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_correct_answer_returns_is_correct_true(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                json.dumps(
                    {
                        "is_correct": True,
                        "explanation": "Your sentence is correct.",
                        "alternatives": ["在大學我學中文"],
                    }
                )
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(_make_request())

        assert isinstance(result, ValidationResponse)
        assert result.is_correct is True
        assert "correct" in result.explanation.lower()
        assert len(result.alternatives) == 1

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_incorrect_answer_returns_is_correct_false(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                json.dumps(
                    {
                        "is_correct": False,
                        "explanation": "Word order is incorrect.",
                        "alternatives": ["我在大學學中文", "在大學我學中文"],
                    }
                )
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(
            _make_request(user_answer="中文我學在大學")
        )

        assert result.is_correct is False
        assert len(result.alternatives) == 2

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_dialogue_completion_request_processed(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                json.dumps(
                    {
                        "is_correct": True,
                        "explanation": "Contextually appropriate response.",
                        "alternatives": [],
                    }
                )
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(
            _make_request(
                exercise_type="dialogue_completion",
                question="A: 你好！B: ___",
                user_answer="你好！",
                correct_answer="你好！",
            )
        )

        assert result.is_correct is True
        assert result.alternatives == []

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_empty_alternatives_list_accepted(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                json.dumps(
                    {
                        "is_correct": True,
                        "explanation": "Perfect!",
                        "alternatives": [],
                    }
                )
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(_make_request())

        assert result.alternatives == []


# ---------------------------------------------------------------------------
# Tests: validate_answer — LLM parse failures (fallback to exact match)
# ---------------------------------------------------------------------------


class TestValidationServiceParseFailure:
    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_invalid_json_falls_back_to_exact_match_correct(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response("This is not valid JSON at all.")
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        # Same user_answer and correct_answer → exact match → is_correct=True
        result = await service.validate_answer(
            _make_request(user_answer="我學中文", correct_answer="我學中文")
        )

        assert result.is_correct is True
        assert result.alternatives == []

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_invalid_json_falls_back_to_exact_match_incorrect(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=_mock_llm_response("{broken json}"))
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        # Different user_answer and correct_answer → exact match → is_correct=False
        result = await service.validate_answer(
            _make_request(user_answer="wrong answer", correct_answer="我學中文")
        )

        assert result.is_correct is False
        assert "我學中文" in result.explanation

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_markdown_code_block_stripped_before_parse(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                "```json\n"
                + json.dumps(
                    {
                        "is_correct": True,
                        "explanation": "Correct!",
                        "alternatives": [],
                    }
                )
                + "\n```"
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(_make_request())

        assert result.is_correct is True

    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_missing_fields_in_json_use_defaults(self, mock_get_llm):
        """Partial JSON response — missing keys fall back to defaults."""
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=_mock_llm_response(
                json.dumps({"is_correct": True})  # no explanation or alternatives
            )
        )
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        result = await service.validate_answer(_make_request())

        assert result.is_correct is True
        assert result.explanation == ""
        assert result.alternatives == []


# ---------------------------------------------------------------------------
# Tests: validate_answer — timeout
# ---------------------------------------------------------------------------


class TestValidationServiceTimeout:
    @patch("src.services.validation_service.get_llm_client")
    @pytest.mark.asyncio
    async def test_timeout_raises_timeout_error(self, mock_get_llm):
        async def slow_invoke(*args, **kwargs):
            await asyncio.sleep(5)  # Exceeds 3s timeout

        mock_llm = MagicMock()
        mock_llm.ainvoke = slow_invoke
        mock_get_llm.return_value = mock_llm

        service = ValidationService()
        with pytest.raises(TimeoutError) as exc_info:
            # Patch VALIDATION_TIMEOUT_SECONDS to 0.05s for speed
            import src.services.validation_service as vs_module

            original_timeout = vs_module.VALIDATION_TIMEOUT_SECONDS
            vs_module.VALIDATION_TIMEOUT_SECONDS = 0.05
            try:
                await service.validate_answer(_make_request())
            finally:
                vs_module.VALIDATION_TIMEOUT_SECONDS = original_timeout

        assert (
            "time limit" in str(exc_info.value).lower()
            or "exceeded" in str(exc_info.value).lower()
        )


# ---------------------------------------------------------------------------
# Tests: prompt formatting
# ---------------------------------------------------------------------------


class TestValidationPromptFormatting:
    def test_answer_validation_prompt_formats_correctly(self):
        from src.agent.prompts import ANSWER_VALIDATION_PROMPT

        formatted = ANSWER_VALIDATION_PROMPT.format(
            exercise_type="sentence_construction",
            question="Arrange: 我 學 中文",
            correct_answer="我學中文",
            user_answer="中文我學",
        )

        assert "sentence_construction" in formatted
        assert "Arrange: 我 學 中文" in formatted
        assert "我學中文" in formatted
        assert "中文我學" in formatted
        assert "is_correct" in formatted
        assert "explanation" in formatted
        assert "alternatives" in formatted

    def test_answer_validation_system_prompt_contains_critical_rules(self):
        from src.agent.prompts import ANSWER_VALIDATION_SYSTEM_PROMPT

        assert "Sentence Construction" in ANSWER_VALIDATION_SYSTEM_PROMPT
        assert "Dialogue Completion" in ANSWER_VALIDATION_SYSTEM_PROMPT
        assert "JSON" in ANSWER_VALIDATION_SYSTEM_PROMPT
        assert "semantic equivalence" in ANSWER_VALIDATION_SYSTEM_PROMPT.lower()

    def test_answer_validation_prompt_distinct_from_quiz_validation_prompt(self):
        from src.agent.prompts import ANSWER_VALIDATION_PROMPT, VALIDATION_PROMPT

        # Ensure they are different prompts for different purposes
        assert ANSWER_VALIDATION_PROMPT != VALIDATION_PROMPT
        assert "{exercise_type}" in ANSWER_VALIDATION_PROMPT
        assert "{questions_json}" in VALIDATION_PROMPT
