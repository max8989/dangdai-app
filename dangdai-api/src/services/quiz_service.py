"""Quiz business logic service.

Orchestrate quiz generation via LangGraph and format responses.

Story 4.15: 3-tier hybrid generation with per-tier timeouts:
- Tier 1 (algorithmic): 5s timeout — zero LLM calls, should complete in <200ms
- Tier 2 (single LLM):  120s timeout — one LLM call, 2-4s happy path
- Mixed: 120s timeout — combination of Tier 1 + Tier 2 questions
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from pydantic import ValidationError
from starlette.requests import Request

from src.agent.graph import TIER_1_TYPES, graph
from src.api.schemas import QuizGenerateRequest, QuizGenerateResponse

logger = logging.getLogger(__name__)

# Tier 1: algorithmic only — should complete in <200ms, 5s gives ample headroom
TIER_1_TIMEOUT_SECONDS = 5

# Tier 2: single LLM call (2-4s happy path) + 2 retries worst case
# Budget: ~4s generation + ~4s retry + ~4s retry = ~12s worst case, 120s cap
TIER_2_TIMEOUT_SECONDS = 120

# Default fallback (mixed type)
GENERATION_TIMEOUT_SECONDS = 120


class QuizService:
    """Service for quiz generation orchestration."""

    async def generate_quiz(
        self,
        request: QuizGenerateRequest,
        user_id: str,
        http_request: Request | None = None,
    ) -> QuizGenerateResponse:
        """Generate a quiz by invoking the LangGraph agent.

        Checks for client disconnection before invoking LangGraph to avoid
        wasting LLM API calls when the client has already navigated away.
        The http_request object is also passed into the graph state so that
        individual nodes can check disconnection before expensive operations.

        Args:
            request: Quiz generation request with chapter_id, book_id, exercise_type.
            user_id: Authenticated user's UUID.
            http_request: Optional FastAPI Request for disconnection detection.
                          When provided, checks is_disconnected() before invoking
                          LangGraph and passes it to graph nodes for mid-graph checks.

        Returns:
            QuizGenerateResponse with generated questions.

        Raises:
            asyncio.CancelledError: If client disconnects before or during generation.
            TimeoutError: If generation exceeds timeout.
            ValueError: If generation produces no valid questions.
        """
        import time

        quiz_id = str(uuid.uuid4())

        # Check for client disconnection before starting expensive LangGraph invocation
        if http_request and await http_request.is_disconnected():
            logger.info(
                "[QuizService] Client disconnected before graph start for chapter=%d user=%s",
                request.chapter_id,
                user_id,
            )
            raise asyncio.CancelledError("Client disconnected")

        # Determine generation tier and corresponding timeout
        exercise_type_str = request.exercise_type.value
        is_tier1 = exercise_type_str in TIER_1_TYPES
        timeout = TIER_1_TIMEOUT_SECONDS if is_tier1 else TIER_2_TIMEOUT_SECONDS
        tier_label = "tier1-algorithmic" if is_tier1 else "tier2-llm"

        # Prepare graph input state — include request for mid-graph disconnection checks
        graph_input: dict[str, Any] = {
            "chapter_id": request.chapter_id,
            "book_id": request.book_id,
            "exercise_type": exercise_type_str,
            "user_id": user_id,
        }
        if http_request is not None:
            graph_input["request"] = http_request

        logger.info(
            "[QuizService] Starting graph for quiz_id=%s chapter=%d type=%s tier=%s timeout=%ds",
            quiz_id,
            request.chapter_id,
            exercise_type_str,
            tier_label,
            timeout,
        )
        start = time.perf_counter()

        # Invoke graph with tier-appropriate timeout
        try:
            result = await asyncio.wait_for(
                graph.ainvoke(graph_input),  # type: ignore[call-overload, arg-type]
                timeout=timeout,
            )
        except asyncio.CancelledError:
            elapsed = time.perf_counter() - start
            logger.info(
                "[QuizService] Quiz generation cancelled by client disconnect "
                "(chapter=%d user=%s elapsed=%.1fs)",
                request.chapter_id,
                user_id,
                elapsed,
            )
            raise  # Let FastAPI handle it (closes connection silently)
        except TimeoutError:
            elapsed = time.perf_counter() - start
            logger.error(
                "[QuizService] TIMEOUT after %.1fs (limit=%ds tier=%s) for quiz_id=%s chapter=%d",
                elapsed,
                timeout,
                tier_label,
                quiz_id,
                request.chapter_id,
            )
            raise TimeoutError(
                f"Quiz generation exceeded {timeout}s time limit ({tier_label})"
            )

        elapsed = time.perf_counter() - start
        logger.info(
            "[QuizService] Graph completed in %.1fs for quiz_id=%s",
            elapsed,
            quiz_id,
        )

        # Extract results
        quiz_payload = result.get("quiz_payload", {})
        questions = quiz_payload.get("questions", [])
        validation_errors = result.get("validation_errors", [])
        retry_count = result.get("retry_count", 0)

        logger.info(
            "[QuizService] Result: %d questions, %d validation_errors, %d retries",
            len(questions),
            len(validation_errors),
            retry_count,
        )

        if validation_errors:
            logger.warning(
                "[QuizService] Validation errors: %s",
                validation_errors,
            )

        if not questions:
            error_detail = (
                "; ".join(validation_errors)
                if validation_errors
                else "No questions generated"
            )
            logger.error(
                "[QuizService] No questions for quiz_id=%s: %s",
                quiz_id,
                error_detail,
            )
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
                "[QuizService] Schema validation FAILED for quiz_id=%s: %d errors — %s",
                quiz_id,
                e.error_count(),
                e.errors(),
            )
            raise ValueError(
                f"Quiz generation produced invalid questions: {e.error_count()} "
                f"validation errors"
            ) from e

        logger.info(
            "[QuizService] Quiz ready: quiz_id=%s questions=%d elapsed=%.1fs",
            quiz_id,
            response.question_count,
            time.perf_counter() - start,
        )
        return response
