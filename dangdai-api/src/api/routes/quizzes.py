"""Quiz API endpoints.

POST /api/quizzes/generate — Generate a new quiz
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.api.dependencies import get_current_user
from src.api.schemas import (
    QuizGenerateMultiRequest,
    QuizGenerateMultiResponse,
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
    request_body: QuizGenerateRequest,
    http_request: Request,
    user_id: str = Depends(get_current_user),
) -> QuizGenerateResponse:
    """Generate a quiz for a chapter and exercise type.

    Requires a valid Supabase JWT in the Authorization header.
    Checks for client disconnection before invoking LangGraph to avoid
    wasting LLM API calls when the client has already navigated away.

    Args:
        request_body: Quiz generation parameters.
        http_request: FastAPI Request object for disconnection detection.
        user_id: Authenticated user ID from JWT.

    Returns:
        QuizGenerateResponse with generated questions.

    Raises:
        asyncio.CancelledError: If client disconnects before generation starts.
        HTTPException: On validation errors, timeouts, or unexpected failures.
    """
    logger.info(
        "generate_quiz called: user=%s chapter_id=%d book_id=%d exercise_type=%s",
        user_id,
        request_body.chapter_id,
        request_body.book_id,
        request_body.exercise_type.value,
    )

    # Validate chapter_id format (exercise_type is already validated by Pydantic)
    if request_body.chapter_id < 100:
        logger.warning(
            "Invalid chapter_id=%d from user=%s", request_body.chapter_id, user_id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chapter_id: must be >= 100 (format: book_id * 100 + chapter_number)",
        )

    try:
        response = await _quiz_service.generate_quiz(
            request_body, user_id, http_request
        )
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
            request_body.chapter_id,
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
            request_body.chapter_id,
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

    except asyncio.CancelledError:
        raise  # Do NOT swallow — let cancellation propagate
    except Exception:
        logger.exception(
            "Quiz generation UNEXPECTED ERROR for user=%s chapter=%d exercise_type=%s",
            user_id,
            request_body.chapter_id,
            request_body.exercise_type.value,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during quiz generation",
        )


@router.post(
    "/generate-multi",
    response_model=QuizGenerateMultiResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid or missing JWT"},
        400: {"description": "Invalid range, exercise types or question count"},
        404: {"description": "No content available for the chapter range"},
        504: {"description": "Generation exceeded time limit"},
    },
)
async def generate_multi_chapter_quiz(
    request_body: QuizGenerateMultiRequest,
    http_request: Request,
    user_id: str = Depends(get_current_user),
) -> QuizGenerateMultiResponse:
    """Generate a quiz spanning a range of chapters and exercise types.

    Fans out the existing single-chapter LangGraph in parallel — one call per
    (chapter_id, exercise_type) combination — and merges the results into one
    quiz of the requested size.
    """
    logger.info(
        "generate_multi_chapter_quiz called: user=%s range=%d..%d types=%s count=%d",
        user_id,
        request_body.chapter_id_start,
        request_body.chapter_id_end,
        [t.value for t in request_body.exercise_types],
        request_body.question_count,
    )

    try:
        response = await _quiz_service.generate_multi_chapter_quiz(
            request_body, user_id, http_request
        )
        logger.info(
            "Multi-chapter quiz generated: quiz_id=%s questions=%d chapters=%d",
            response.quiz_id,
            response.question_count,
            len(response.chapter_ids),
        )
        return response

    except TimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        )

    except ValueError as e:
        error_msg = str(e)
        logger.error(
            "Multi-chapter quiz ValueError for user=%s range=%d..%d: %s",
            user_id,
            request_body.chapter_id_start,
            request_body.chapter_id_end,
            error_msg,
        )
        if (
            "no questions" in error_msg.lower()
            or "no valid chapters" in error_msg.lower()
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception(
            "Multi-chapter quiz UNEXPECTED ERROR for user=%s range=%d..%d",
            user_id,
            request_body.chapter_id_start,
            request_body.chapter_id_end,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during multi-chapter quiz generation",
        )
