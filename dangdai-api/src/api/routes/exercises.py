"""On-the-fly AI exercise generation endpoint (Story 4.17).

POST /api/exercises/generate — single-call LLM exercise generation with
cache-on-success. Successful results are upserted into `premade_exercises`
so subsequent users get the same exercise via the instant Premade path.
"""

from __future__ import annotations

import asyncio
import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.api.dependencies import get_current_user
from src.api.schemas import (
    ExerciseGenerateRequest,
    ExerciseGenerateResponse,
    QuizGenerateRequest,
)
from src.repositories.content_repo import ContentRepository
from src.services.quiz_service import QuizService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/exercises", tags=["exercises"])

_quiz_service = QuizService()
_content_repo = ContentRepository()


def _exercise_title(exercise_type: str) -> str:
    titles = {
        "vocabulary": "Vocabulary Practice",
        "grammar": "Grammar Practice",
        "fill_in_blank": "Fill in the Blank",
        "matching": "Matching Exercise",
        "dialogue_completion": "Dialogue Completion",
        "sentence_construction": "Sentence Construction",
        "reading_comprehension": "Reading Comprehension",
        "mixed": "Mixed Practice",
    }
    return titles.get(exercise_type, "Exercise")


def _exercise_instructions(exercise_type: str) -> str:
    instructions = {
        "vocabulary": "Practice the chapter vocabulary.",
        "grammar": "Practice the chapter grammar patterns.",
        "fill_in_blank": "Fill in the blanks with the appropriate words.",
        "matching": "Match the items in the left column to the right column.",
        "dialogue_completion": "Complete the dialogue with the best response.",
        "sentence_construction": "Arrange the words in the correct order.",
        "reading_comprehension": "Read the passage and answer the questions.",
        "mixed": "Answer the following mixed practice questions.",
    }
    return instructions.get(exercise_type, "Complete the exercise.")


def _generation_timeout_seconds() -> int:
    try:
        return int(os.getenv("GENERATION_TIMEOUT_SECONDS", "25"))
    except ValueError:
        return 25


@router.post(
    "/generate",
    response_model=ExerciseGenerateResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid or missing JWT"},
        400: {"description": "Invalid exercise_type or chapter_id"},
        404: {"description": "Chapter content not available"},
        500: {"description": "Generation failed or LLM error"},
        504: {"description": "Generation exceeded time limit"},
    },
)
async def generate_exercise(
    request_body: ExerciseGenerateRequest,
    http_request: Request,
    user_id: str = Depends(get_current_user),
) -> ExerciseGenerateResponse:
    """Generate an exercise on-the-fly and cache it as a premade row.

    Passes `http_request` through the graph state so every node can check
    `request.is_disconnected()` and abort the OpenAI call when the client
    cancels. On cancellation, no row is written to `premade_exercises`.
    On successful generation, the result is upserted via ContentRepository
    so subsequent users load it through the instant Premade path.
    """
    logger.info(
        "[exercises.generate] user=%s book=%d chapter=%d type=%s",
        user_id,
        request_body.book_id,
        request_body.chapter_id,
        request_body.exercise_type.value,
    )

    if request_body.chapter_id < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid chapter_id: must be >= 100 "
                "(format: book_id * 100 + chapter_number)"
            ),
        )

    lesson_id = request_body.chapter_id - request_body.book_id * 100
    if lesson_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chapter_id does not match book_id",
        )

    quiz_request = QuizGenerateRequest(
        chapter_id=request_body.chapter_id,
        book_id=request_body.book_id,
        exercise_type=request_body.exercise_type,
    )

    timeout = _generation_timeout_seconds()
    try:
        quiz_response = await asyncio.wait_for(
            _quiz_service.generate_quiz(quiz_request, user_id, http_request),
            timeout=timeout,
        )
    except asyncio.CancelledError:
        logger.info(
            "[exercises.generate] cancelled user=%s chapter=%d",
            user_id,
            request_body.chapter_id,
        )
        raise  # Propagate — FastAPI closes the connection silently, no cache write
    except TimeoutError:
        logger.error(
            "[exercises.generate] TIMEOUT user=%s chapter=%d type=%s limit=%ds",
            user_id,
            request_body.chapter_id,
            request_body.exercise_type.value,
            timeout,
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Exercise generation exceeded {timeout}s time limit",
        )
    except ValueError as exc:
        logger.error(
            "[exercises.generate] ValueError user=%s chapter=%d: %s",
            user_id,
            request_body.chapter_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Exercise generation failed: {exc}",
        )
    except Exception:
        logger.exception(
            "[exercises.generate] UNEXPECTED user=%s chapter=%d type=%s",
            user_id,
            request_body.chapter_id,
            request_body.exercise_type.value,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during exercise generation",
        )

    # Success — check one more time for disconnect before we persist to cache.
    if await http_request.is_disconnected():
        logger.info(
            "[exercises.generate] client disconnected post-generation, "
            "skipping cache write user=%s chapter=%d",
            user_id,
            request_body.chapter_id,
        )
        raise asyncio.CancelledError("Client disconnected after generation")

    questions_payload = [
        q.model_dump(mode="json") if hasattr(q, "model_dump") else dict(q)
        for q in quiz_response.questions
    ]
    content: dict = {"questions": questions_payload}
    title = _exercise_title(request_body.exercise_type.value)
    instructions = _exercise_instructions(request_body.exercise_type.value)

    try:
        _content_repo.upsert_premade_exercise(
            book_id=request_body.book_id,
            lesson_id=lesson_id,
            exercise_type=request_body.exercise_type.value,
            title=title,
            instructions=instructions,
            content=content,
        )
    except Exception:
        # Cache failure should not block the user — log and continue.
        logger.exception(
            "[exercises.generate] cache upsert failed user=%s chapter=%d type=%s",
            user_id,
            request_body.chapter_id,
            request_body.exercise_type.value,
        )

    return ExerciseGenerateResponse(
        exercise_type=request_body.exercise_type.value,
        book_id=request_body.book_id,
        lesson_id=lesson_id,
        title=title,
        instructions=instructions,
        content=content,
    )
