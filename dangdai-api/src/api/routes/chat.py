"""Chat / RAG Q&A endpoint.

POST /api/chat — Ask the textbook/workbook RAG agent a question.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import get_current_user
from src.api.schemas import ChatRequest, ChatResponse
from src.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

_chat_service = ChatService()


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid or missing JWT"},
        500: {"description": "Chat generation failed"},
    },
)
async def chat(
    request_body: ChatRequest,
    user_id: str = Depends(get_current_user),
) -> ChatResponse:
    """Answer a question about the textbook/workbook using RAG.

    Args:
        request_body: Chat request with query and optional filters.
        user_id: Authenticated user id from the Supabase JWT.

    Returns:
        ChatResponse with the answer and source citations.
    """
    logger.info(
        "[chat] user=%s book=%s lesson=%s content_type=%s query=%r",
        user_id,
        request_body.book,
        request_body.lesson,
        request_body.content_type,
        request_body.query[:120],
    )

    try:
        return await asyncio.to_thread(
            _chat_service.ask,
            query=request_body.query,
            book=request_body.book,
            lesson=request_body.lesson,
            content_type=request_body.content_type,
            num_chunks=request_body.num_chunks,
        )
    except ValueError as exc:
        logger.error("[chat] ValueError user=%s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
    except Exception:
        logger.exception("[chat] UNEXPECTED ERROR user=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during chat generation",
        )
