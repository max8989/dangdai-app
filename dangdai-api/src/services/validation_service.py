"""LLM-based answer validation for complex exercise types.

Validate open-ended answers for Sentence Construction and Dialogue Completion
where multiple valid responses exist.
"""

from __future__ import annotations

import asyncio
import json
import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.prompts import (
    ANSWER_VALIDATION_PROMPT,
    ANSWER_VALIDATION_SYSTEM_PROMPT,
)
from src.api.schemas import ValidationRequest, ValidationResponse
from src.utils.llm_factory import get_llm

logger = logging.getLogger(__name__)

# Maximum time for LLM validation call
VALIDATION_TIMEOUT_SECONDS = 3


class ValidationService:
    """Service for LLM-based answer validation."""

    async def validate_answer(
        self,
        request: ValidationRequest,
    ) -> ValidationResponse:
        """Validate a user's answer using LLM evaluation.

        Args:
            request: Validation request with question, user_answer,
                     correct_answer, and exercise_type.

        Returns:
            ValidationResponse with is_correct, explanation, alternatives.

        Raises:
            TimeoutError: If LLM call exceeds 3 seconds.
            Exception: If LLM invocation fails.
        """
        prompt_text = ANSWER_VALIDATION_PROMPT.format(
            exercise_type=request.exercise_type.value,
            question=request.question,
            correct_answer=request.correct_answer,
            user_answer=request.user_answer,
        )

        llm = get_llm()
        messages = [
            SystemMessage(content=ANSWER_VALIDATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt_text),
        ]

        try:
            response = await asyncio.wait_for(
                llm.ainvoke(messages),
                timeout=VALIDATION_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error(
                "Answer validation timed out after %ds for exercise_type=%s",
                VALIDATION_TIMEOUT_SECONDS,
                request.exercise_type.value,
            )
            raise TimeoutError(
                f"Answer validation exceeded {VALIDATION_TIMEOUT_SECONDS}s time limit"
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        return self._parse_validation_response(content, request)

    def _parse_validation_response(
        self,
        content: str,
        request: ValidationRequest,
    ) -> ValidationResponse:
        """Parse LLM response into ValidationResponse.

        Falls back to exact-match comparison if parsing fails.

        Args:
            content: Raw LLM response text.
            request: Original validation request for fallback.

        Returns:
            Parsed ValidationResponse.
        """
        # Strip markdown code blocks if present
        text = content.strip()
        if text.startswith("```"):
            first_newline = text.index("\n") if "\n" in text else len(text)
            text = text[first_newline + 1 :]
            if text.rstrip().endswith("```"):
                text = text.rstrip()[:-3].rstrip()

        try:
            parsed = json.loads(text)
            return ValidationResponse(
                is_correct=bool(parsed.get("is_correct", False)),
                explanation=str(parsed.get("explanation", "")),
                alternatives=list(parsed.get("alternatives", [])),
            )
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.warning("Failed to parse LLM validation response: %s", exc)
            # Fallback: exact-match comparison
            is_correct = (
                request.user_answer.strip().lower()
                == request.correct_answer.strip().lower()
            )
            return ValidationResponse(
                is_correct=is_correct,
                explanation=(
                    "Your answer matches the expected answer."
                    if is_correct
                    else f"The expected answer is: {request.correct_answer}"
                ),
                alternatives=[],
            )
