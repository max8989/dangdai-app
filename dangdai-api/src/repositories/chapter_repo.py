"""Chapter repository.

Handle chapter content and metadata retrieval from the database.
"""

from __future__ import annotations

import logging
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)


class ChapterRepository:
    """Repository for chapter content and metadata operations."""

    def __init__(self) -> None:
        """Initialize ChapterRepository with Supabase client."""
        self._client = get_supabase_client()

    @staticmethod
    def parse_chapter_id(chapter_id: int) -> tuple[int, int]:
        """Parse chapter_id into book_id and lesson number.

        Convention: chapter_id = book_id * 100 + chapter_number.
        E.g., Book 2 Chapter 12 = 212.

        Args:
            chapter_id: Composite chapter identifier.

        Returns:
            Tuple of (book_id, lesson_number).
        """
        book_id = chapter_id // 100
        lesson_number = chapter_id % 100
        return book_id, lesson_number

    def get_chapter_progress(
        self,
        user_id: str,
        chapter_id: int,
        book_id: int,
    ) -> dict[str, Any] | None:
        """Get chapter progress for a user.

        Args:
            user_id: The user's UUID.
            chapter_id: The chapter identifier.
            book_id: The book identifier.

        Returns:
            Chapter progress record or None if not found.
        """
        response = (
            self._client.table("chapter_progress")
            .select("*")
            .eq("user_id", user_id)
            .eq("chapter_id", chapter_id)
            .eq("book_id", book_id)
            .limit(1)
            .execute()
        )
        if response.data:
            return response.data[0]
        return None

    def get_available_exercise_types(
        self,
        book: int,
        lesson: int,
    ) -> list[str]:
        """Get available exercise types for a chapter from RAG content.

        Args:
            book: Book number.
            lesson: Lesson number.

        Returns:
            List of distinct exercise type strings available.
        """
        response = (
            self._client.table("dangdai_chunks")
            .select("exercise_type")
            .eq("book", book)
            .eq("lesson", lesson)
            .not_.is_("exercise_type", "null")
            .execute()
        )
        if not response.data:
            return []

        exercise_types: set[str] = set()
        for row in response.data:
            et = row.get("exercise_type")
            if et:
                exercise_types.add(et)
        return sorted(exercise_types)
