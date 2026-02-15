"""Pydantic request/response models.

This module defines the API schemas for request validation and response serialization.
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str


class QuizRequest(BaseModel):
    """Quiz generation request schema."""

    chapter_id: int
    book_id: int
    quiz_type: str = "vocabulary"


class QuizResponse(BaseModel):
    """Quiz response schema."""

    quiz_id: str
    status: str
