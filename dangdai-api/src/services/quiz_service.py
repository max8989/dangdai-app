"""Quiz business logic service.

Orchestrate quiz generation via LangGraph and format responses.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from pydantic import ValidationError

from src.agent.graph import graph
from src.api.schemas import QuizGenerateRequest, QuizGenerateResponse

logger = logging.getLogger(__name__)

# Maximum time for quiz generation (NFR1: 8 seconds)
GENERATION_TIMEOUT_SECONDS = 8


class QuizService:
    """Service for quiz generation orchestration."""

    async def generate_quiz(
        self,
        request: QuizGenerateRequest,
        user_id: str,
    ) -> QuizGenerateResponse:
        """Generate a quiz by invoking the LangGraph agent.

        Args:
            request: Quiz generation request with chapter_id, book_id, exercise_type.
            user_id: Authenticated user's UUID.

        Returns:
            QuizGenerateResponse with generated questions.

        Raises:
            TimeoutError: If generation exceeds 8 seconds.
            ValueError: If generation produces no valid questions.
        """
        quiz_id = str(uuid.uuid4())

        # Prepare graph input state
        graph_input: dict[str, Any] = {
            "chapter_id": request.chapter_id,
            "book_id": request.book_id,
            "exercise_type": request.exercise_type.value,
            "user_id": user_id,
        }

        # Invoke graph with timeout
        try:
            result = await asyncio.wait_for(
                graph.ainvoke(graph_input),  # type: ignore[arg-type]
                timeout=GENERATION_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error(
                "Quiz generation timed out after %ds for chapter=%d",
                GENERATION_TIMEOUT_SECONDS,
                request.chapter_id,
            )
            raise TimeoutError(
                f"Quiz generation exceeded {GENERATION_TIMEOUT_SECONDS}s time limit"
            )

        # Extract results
        quiz_payload = result.get("quiz_payload", {})
        questions = quiz_payload.get("questions", [])
        validation_errors = result.get("validation_errors", [])

        if not questions:
            error_detail = (
                "; ".join(validation_errors)
                if validation_errors
                else "No questions generated"
            )
            logger.error("Quiz generation produced no questions: %s", error_detail)
            raise ValueError(f"Quiz generation failed: {error_detail}")

        # Enrich questions with question_id if missing
        for i, q in enumerate(questions):
            if not q.get("question_id"):
                q["question_id"] = f"q{i + 1}"

        # Validate questions against Pydantic schemas before building response
        try:
            response = QuizGenerateResponse(
                quiz_id=quiz_id,
                chapter_id=request.chapter_id,
                book_id=request.book_id,
                exercise_type=request.exercise_type.value,
                question_count=len(questions),
                questions=questions,
            )
        except ValidationError as e:
            logger.error(
                "Generated questions failed schema validation: %s", e.error_count()
            )
            raise ValueError(
                f"Quiz generation produced invalid questions: {e.error_count()} "
                f"validation errors"
            ) from e

        return response
