"""Structured content repository.

Query vocabulary, grammar_points, and dialogues tables for curriculum data.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Number of retry attempts on transient failures before returning empty.
_MAX_RETRIES = 1


class ContentRepository:
    """Repository for structured content table queries."""

    def __init__(self) -> None:
        """Initialize ContentRepository with Supabase client."""
        self._client = get_supabase_client()

    def get_vocabulary(self, book_id: int, lesson_id: int) -> list[dict[str, Any]]:
        """Get all vocabulary items for a chapter.

        Retries once on transient failure before returning empty list.

        Args:
            book_id: Book number (1-6).
            lesson_id: Lesson number within the book.

        Returns:
            List of vocabulary item dictionaries, sorted by sort_order.
        """
        for attempt in range(_MAX_RETRIES + 1):
            try:
                result = (
                    self._client.table("vocabulary")
                    .select(
                        "traditional, pinyin, english, part_of_speech, "
                        "vocab_section, is_name"
                    )
                    .eq("book_id", book_id)
                    .eq("lesson_id", lesson_id)
                    .order("sort_order")
                    .execute()
                )
                return result.data or []
            except Exception:
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "Retrying vocabulary query for book=%d, lesson=%d "
                        "(attempt %d/%d)",
                        book_id,
                        lesson_id,
                        attempt + 1,
                        _MAX_RETRIES + 1,
                    )
                    time.sleep(0.1)
                else:
                    logger.exception(
                        "Failed to query vocabulary for book=%d, lesson=%d "
                        "after %d attempts",
                        book_id,
                        lesson_id,
                        _MAX_RETRIES + 1,
                    )
        return []

    def get_grammar_points(self, book_id: int, lesson_id: int) -> list[dict[str, Any]]:
        """Get all grammar points for a chapter.

        Retries once on transient failure before returning empty list.

        Args:
            book_id: Book number (1-6).
            lesson_id: Lesson number within the book.

        Returns:
            List of grammar point dictionaries, sorted by sort_order.
        """
        for attempt in range(_MAX_RETRIES + 1):
            try:
                result = (
                    self._client.table("grammar_points")
                    .select(
                        "title_english, title_chinese, function_description, "
                        "structure_pattern, usage_notes, examples"
                    )
                    .eq("book_id", book_id)
                    .eq("lesson_id", lesson_id)
                    .order("sort_order")
                    .execute()
                )
                return result.data or []
            except Exception:
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "Retrying grammar_points query for book=%d, lesson=%d "
                        "(attempt %d/%d)",
                        book_id,
                        lesson_id,
                        attempt + 1,
                        _MAX_RETRIES + 1,
                    )
                    time.sleep(0.1)
                else:
                    logger.exception(
                        "Failed to query grammar_points for book=%d, lesson=%d "
                        "after %d attempts",
                        book_id,
                        lesson_id,
                        _MAX_RETRIES + 1,
                    )
        return []

    def get_dialogues(self, book_id: int, lesson_id: int) -> list[dict[str, Any]]:
        """Get all dialogues for a chapter.

        Retries once on transient failure before returning empty list.

        Args:
            book_id: Book number (1-6).
            lesson_id: Lesson number within the book.

        Returns:
            List of dialogue dictionaries, sorted by dialogue_number.
        """
        for attempt in range(_MAX_RETRIES + 1):
            try:
                result = (
                    self._client.table("dialogues")
                    .select("dialogue_number, title_traditional, title_english, lines")
                    .eq("book_id", book_id)
                    .eq("lesson_id", lesson_id)
                    .order("dialogue_number")
                    .execute()
                )
                return result.data or []
            except Exception:
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "Retrying dialogues query for book=%d, lesson=%d "
                        "(attempt %d/%d)",
                        book_id,
                        lesson_id,
                        attempt + 1,
                        _MAX_RETRIES + 1,
                    )
                    time.sleep(0.1)
                else:
                    logger.exception(
                        "Failed to query dialogues for book=%d, lesson=%d "
                        "after %d attempts",
                        book_id,
                        lesson_id,
                        _MAX_RETRIES + 1,
                    )
        return []

    def get_vocabulary_biased(
        self,
        book_id: int,
        lesson_id: int,
        weak_vocab_items: list[str],
    ) -> list[dict[str, Any]]:
        """Get vocabulary for a chapter, returning weak items first.

        Fetches all vocabulary for the chapter and reorders so that items
        matching the weak_vocab_items list appear at the beginning. The
        caller is responsible for applying the 30-50% weak-item bias.

        Retries once on transient failure before returning empty list.

        Args:
            book_id: Book number (1-6).
            lesson_id: Lesson number within the book.
            weak_vocab_items: List of Traditional Chinese strings that the
                user struggles with. Items in this list are sorted first.

        Returns:
            List of vocabulary item dictionaries with weak items at the front.
        """
        vocab = self.get_vocabulary(book_id, lesson_id)
        if not vocab or not weak_vocab_items:
            return vocab

        weak_set: set[str] = set(weak_vocab_items)
        weak = [v for v in vocab if v.get("traditional", "") in weak_set]
        normal = [v for v in vocab if v.get("traditional", "") not in weak_set]
        return weak + normal

    def get_vocabulary_for_cumulative(
        self, book_id: int, up_to_lesson_id: int
    ) -> list[dict[str, Any]]:
        """Get vocabulary for cumulative review up to a given lesson.

        Retries once on transient failure before returning empty list.

        Args:
            book_id: Book number (1-6).
            up_to_lesson_id: Include vocabulary up to and including this lesson.

        Returns:
            List of vocabulary item dictionaries across multiple lessons.
            Includes lesson_id for downstream filtering.
        """
        for attempt in range(_MAX_RETRIES + 1):
            try:
                result = (
                    self._client.table("vocabulary")
                    .select(
                        "lesson_id, traditional, pinyin, english, part_of_speech, "
                        "vocab_section, is_name"
                    )
                    .eq("book_id", book_id)
                    .lte("lesson_id", up_to_lesson_id)
                    .order("sort_order")
                    .execute()
                )
                return result.data or []
            except Exception:
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "Retrying cumulative vocabulary query for book=%d, "
                        "up_to=%d (attempt %d/%d)",
                        book_id,
                        up_to_lesson_id,
                        attempt + 1,
                        _MAX_RETRIES + 1,
                    )
                    time.sleep(0.1)
                else:
                    logger.exception(
                        "Failed to query cumulative vocabulary for book=%d, "
                        "up_to=%d after %d attempts",
                        book_id,
                        up_to_lesson_id,
                        _MAX_RETRIES + 1,
                    )
        return []
