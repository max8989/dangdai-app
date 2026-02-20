"""Vector store repository.

Handle pgvector operations for semantic search and content retrieval.
"""

from __future__ import annotations

import logging
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Minimum number of chunks considered sufficient for quiz generation
MIN_CHUNKS_THRESHOLD = 3


class VectorStore:
    """Repository for pgvector and content retrieval operations."""

    def __init__(self) -> None:
        """Initialize VectorStore with Supabase client."""
        self._client = get_supabase_client()

    def search_by_filters(
        self,
        book: int,
        lesson: int,
        exercise_type: str | None = None,
        content_type: str | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Retrieve chunks filtered by book, lesson, and optional exercise type.

        Args:
            book: Book number (1-6).
            lesson: Lesson/chapter number within the book.
            exercise_type: Optional exercise type filter.
            content_type: Optional content type ('textbook' or 'workbook').
            limit: Maximum number of results.

        Returns:
            List of chunk dictionaries with content and metadata.
        """
        query = (
            self._client.table("dangdai_chunks")
            .select(
                "id, content, book, lesson, section, content_type, "
                "category, topic, exercise_type, lesson_title, difficulty, page_range"
            )
            .eq("book", book)
            .eq("lesson", lesson)
        )

        if exercise_type is not None:
            query = query.eq("exercise_type", exercise_type)

        if content_type is not None:
            query = query.eq("content_type", content_type)

        query = query.limit(limit)

        response = query.execute()
        return response.data if response.data else []

    def search_by_book_lesson(
        self,
        book: int,
        lesson: int,
        limit: int = 30,
    ) -> list[dict[str, Any]]:
        """Retrieve all chunks for a book and lesson (broad fallback).

        Args:
            book: Book number (1-6).
            lesson: Lesson/chapter number.
            limit: Maximum number of results.

        Returns:
            List of chunk dictionaries.
        """
        response = (
            self._client.table("dangdai_chunks")
            .select(
                "id, content, book, lesson, section, content_type, "
                "category, topic, exercise_type, lesson_title, difficulty, page_range"
            )
            .eq("book", book)
            .eq("lesson", lesson)
            .limit(limit)
            .execute()
        )
        return response.data if response.data else []

    def search_by_book(
        self,
        book: int,
        limit: int = 30,
    ) -> list[dict[str, Any]]:
        """Retrieve chunks for a book only (broadest fallback).

        Args:
            book: Book number (1-6).
            limit: Maximum number of results.

        Returns:
            List of chunk dictionaries.
        """
        response = (
            self._client.table("dangdai_chunks")
            .select(
                "id, content, book, lesson, section, content_type, "
                "category, topic, exercise_type, lesson_title, difficulty, page_range"
            )
            .eq("book", book)
            .limit(limit)
            .execute()
        )
        return response.data if response.data else []
