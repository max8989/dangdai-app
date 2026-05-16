"""Insights endpoints.

POST /api/insights/learning-summary — generate (and persist) an AI summary of
the authenticated user's recent quiz performance for the home screen.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import get_current_user
from src.api.schemas import LearningSummaryResponse
from src.services.learning_summary_service import LearningSummaryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/insights", tags=["insights"])

_service = LearningSummaryService()


@router.post(
    "/learning-summary",
    response_model=LearningSummaryResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid or missing JWT"},
        500: {"description": "Summary generation failed"},
    },
)
async def generate_learning_summary(
    user_id: str = Depends(get_current_user),
) -> LearningSummaryResponse:
    """Generate the latest learning summary for the authenticated user.

    Reads the user's last ~30 question_results, asks the LLM for a structured
    summary (strengths, weaknesses, focus areas, actionable recommendations),
    and upserts it into ``learning_summaries`` so subsequent home-screen loads
    can render the cached row directly from Supabase.

    Args:
        user_id: Authenticated user id from the Supabase JWT.

    Returns:
        LearningSummaryResponse with the freshly generated summary.
    """
    logger.info("[insights] generate_learning_summary user=%s", user_id)
    try:
        return await asyncio.to_thread(_service.generate, user_id)
    except Exception:
        logger.exception("[insights] UNEXPECTED ERROR user=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during learning summary generation",
        )
