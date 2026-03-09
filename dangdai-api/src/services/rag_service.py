"""RAG retrieval logic service.

Orchestrate retrieval-augmented generation for quiz content with fallback strategy.
"""

from __future__ import annotations

import logging
from typing import Any

from src.repositories.vector_store import MIN_CHUNKS_THRESHOLD, VectorStore

logger = logging.getLogger(__name__)


class RagService:
    """Service for RAG retrieval operations with tiered fallback."""

    def __init__(self, vector_store: VectorStore | None = None) -> None:
        """Initialize RagService.

        Args:
            vector_store: Optional VectorStore instance (for dependency injection).
        """
        self._vector_store = vector_store or VectorStore()

    def retrieve_content(
        self,
        book_id: int,
        lesson: int,
        exercise_type: str,
    ) -> list[dict[str, Any]]:
        """Retrieve chapter content with tiered fallback strategy (NFR17).

        Fallback strategy:
        1. Filter by book + lesson + exercise_type (workbook preferred)
        2. Filter by book + lesson + exercise_type (any content_type)
        3. Filter by book + lesson only (any exercise_type)
        4. Filter by book only
        5. Return empty list if nothing found

        Args:
            book_id: Book number (1-6).
            lesson: Lesson number within the book.
            exercise_type: The exercise type to retrieve content for.

        Returns:
            List of content chunk dictionaries.
        """
        # Strategy 1: book + lesson + exercise_type + workbook
        chunks = self._vector_store.search_by_filters(
            book=book_id,
            lesson=lesson,
            exercise_type=exercise_type,
            content_type="workbook",
        )
        if len(chunks) >= MIN_CHUNKS_THRESHOLD:
            logger.info(
                "RAG: Found %d workbook chunks for book=%d, lesson=%d, type=%s",
                len(chunks),
                book_id,
                lesson,
                exercise_type,
            )
            return chunks

        # Strategy 2: book + lesson + exercise_type (any content_type)
        chunks = self._vector_store.search_by_filters(
            book=book_id,
            lesson=lesson,
            exercise_type=exercise_type,
        )
        if len(chunks) >= MIN_CHUNKS_THRESHOLD:
            logger.info(
                "RAG: Found %d chunks (any content_type) for book=%d, lesson=%d, type=%s",
                len(chunks),
                book_id,
                lesson,
                exercise_type,
            )
            return chunks

        # Strategy 3: book + lesson only (broader)
        chunks = self._vector_store.search_by_book_lesson(
            book=book_id,
            lesson=lesson,
        )
        if len(chunks) >= MIN_CHUNKS_THRESHOLD:
            logger.info(
                "RAG: Fell back to book+lesson, found %d chunks for book=%d, lesson=%d",
                len(chunks),
                book_id,
                lesson,
            )
            return chunks

        # Strategy 4: book only (broadest)
        chunks = self._vector_store.search_by_book(book=book_id)
        if chunks:
            logger.warning(
                "RAG: Fell back to book-only, found %d chunks for book=%d",
                len(chunks),
                book_id,
            )
            return chunks

        # No content found at all
        logger.error(
            "RAG: No content found for book=%d, lesson=%d, type=%s",
            book_id,
            lesson,
            exercise_type,
        )
        return []

    def retrieve_mixed_content(
        self,
        book_id: int,
        lesson: int,
        exercise_types: list[str],
    ) -> list[dict[str, Any]]:
        """Retrieve content for multiple exercise types (for "mixed" mode).

        Args:
            book_id: Book number (1-6).
            lesson: Lesson number.
            exercise_types: List of exercise types to include.

        Returns:
            Combined list of content chunks across exercise types.
        """
        all_chunks: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        for ex_type in exercise_types:
            chunks = self.retrieve_content(book_id, lesson, ex_type)
            for chunk in chunks:
                chunk_id = chunk.get("id", "")
                if chunk_id not in seen_ids:
                    seen_ids.add(chunk_id)
                    all_chunks.append(chunk)

        if not all_chunks:
            # Fall back to all chapter content
            all_chunks = self._vector_store.search_by_book_lesson(book_id, lesson)

        return all_chunks
