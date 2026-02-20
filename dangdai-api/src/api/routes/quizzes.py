"""Quiz API endpoints.

POST /api/quizzes/generate - Generate a new quiz
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import get_current_user
from src.api.schemas import (
    ExerciseType,
    QuizGenerateRequest,
    QuizGenerateResponse,
)
from src.services.quiz_service import QuizService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

_quiz_service = QuizService()


@router.post(
    "/generate",
    response_model=QuizGenerateResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid or missing JWT"},
        400: {"description": "Invalid exercise_type or chapter_id"},
        404: {"description": "Chapter content not available in RAG"},
        504: {"description": "Generation exceeded time limit"},
    },
)
async def generate_quiz(
    request: QuizGenerateRequest,
    user_id: str = Depends(get_current_user),
) -> QuizGenerateResponse:
    """Generate a quiz for a chapter and exercise type.

    Requires a valid Supabase JWT in the Authorization header.

    Args:
        request: Quiz generation parameters.
        user_id: Authenticated user ID from JWT.

    Returns:
        QuizGenerateResponse with generated questions.
    """
    # Validate exercise_type is a valid enum value
    try:
        ExerciseType(request.exercise_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid exercise_type: {request.exercise_type}. "
            f"Valid types: {[e.value for e in ExerciseType]}",
        )

    # Validate chapter_id format
    if request.chapter_id < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chapter_id: must be >= 100 (format: book_id * 100 + chapter_number)",
        )

    try:
        response = await _quiz_service.generate_quiz(request, user_id)
        return response

    except TimeoutError as e:
        logger.error("Quiz generation timeout: %s", e)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        )

    except ValueError as e:
        error_msg = str(e)
        if "no questions" in error_msg.lower() or "insufficient" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not enough content available for this chapter and exercise type",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {error_msg}",
        )

    except Exception:
        logger.exception("Unexpected error during quiz generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during quiz generation",
        )
