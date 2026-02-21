"""Quiz API endpoints.

POST /api/quizzes/generate      - Generate a new quiz
POST /api/quizzes/validate-answer - Validate an open-ended answer via LLM
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import get_current_user
from src.api.schemas import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    ValidationRequest,
    ValidationResponse,
)
from src.services.quiz_service import QuizService
from src.services.validation_service import ValidationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

_quiz_service = QuizService()
_validation_service = ValidationService()


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
    logger.info(
        "generate_quiz called: user=%s chapter_id=%d book_id=%d exercise_type=%s",
        user_id,
        request.chapter_id,
        request.book_id,
        request.exercise_type.value,
    )

    # Validate chapter_id format (exercise_type is already validated by Pydantic)
    if request.chapter_id < 100:
        logger.warning(
            "Invalid chapter_id=%d from user=%s", request.chapter_id, user_id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chapter_id: must be >= 100 (format: book_id * 100 + chapter_number)",
        )

    try:
        response = await _quiz_service.generate_quiz(request, user_id)
        logger.info(
            "Quiz generated successfully: quiz_id=%s questions=%d",
            response.quiz_id,
            response.question_count,
        )
        return response

    except TimeoutError as e:
        logger.error(
            "Quiz generation TIMEOUT for user=%s chapter=%d: %s",
            user_id,
            request.chapter_id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        )

    except ValueError as e:
        error_msg = str(e)
        logger.error(
            "Quiz generation ValueError for user=%s chapter=%d: %s",
            user_id,
            request.chapter_id,
            error_msg,
        )
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
        logger.exception(
            "Quiz generation UNEXPECTED ERROR for user=%s chapter=%d exercise_type=%s",
            user_id,
            request.chapter_id,
            request.exercise_type.value,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during quiz generation",
        )


@router.post(
    "/validate-answer",
    response_model=ValidationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"description": "Invalid exercise_type or empty required fields"},
        401: {"description": "Invalid or missing JWT"},
        500: {"description": "LLM invocation failure"},
        504: {"description": "Answer validation exceeded 3-second time limit"},
    },
)
async def validate_answer(
    request: ValidationRequest,
    user_id: str = Depends(get_current_user),
) -> ValidationResponse:
    """Validate an open-ended answer using LLM evaluation.

    Only supports sentence_construction and dialogue_completion exercise types,
    where multiple valid answers may exist. Requires a valid Supabase JWT.

    Args:
        request: Validation request with question, user_answer, correct_answer,
                 and exercise_type.
        user_id: Authenticated user ID from JWT.

    Returns:
        ValidationResponse with is_correct, explanation, and alternatives.
    """
    try:
        return await _validation_service.validate_answer(request)

    except TimeoutError as exc:
        logger.error(
            "Answer validation timeout for user=%s exercise_type=%s: %s",
            user_id,
            request.exercise_type.value,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Answer validation timed out",
        )

    except Exception:
        logger.exception(
            "Unexpected error during answer validation for user=%s exercise_type=%s",
            user_id,
            request.exercise_type.value,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Answer validation failed",
        )
