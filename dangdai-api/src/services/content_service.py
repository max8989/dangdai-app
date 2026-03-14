"""Content retrieval orchestration service.

Fetch structured curriculum content for quiz generation, with optional
RAG supplementary context.
"""

from __future__ import annotations

import logging
from typing import Any

from src.repositories.content_repo import ContentRepository
from src.services.rag_service import RagService

logger = logging.getLogger(__name__)

# Exercise types that require dialogue content
_DIALOGUE_TYPES = {"dialogue_completion", "reading_comprehension", "mixed"}


class ContentService:
    """Orchestrate structured content retrieval for quiz generation."""

    def __init__(
        self,
        content_repo: ContentRepository | None = None,
        rag_service: RagService | None = None,
    ) -> None:
        """Initialize ContentService.

        Args:
            content_repo: Optional ContentRepository (for DI/testing).
            rag_service: Optional RagService for supplementary RAG chunks.
        """
        self._repo = content_repo or ContentRepository()
        self._rag = rag_service

    def retrieve_chapter_content(
        self,
        book_id: int,
        lesson_id: int,
        exercise_type: str,
    ) -> dict[str, Any]:
        """Retrieve structured chapter content based on exercise type.

        For vocabulary/grammar/fill_in_blank/matching/sentence_construction:
            → vocabulary + grammar_points

        For dialogue_completion/reading_comprehension:
            → dialogues + vocabulary + grammar_points

        For mixed:
            → vocabulary + grammar_points + dialogues

        Args:
            book_id: Book number (1-6).
            lesson_id: Lesson number within the book.
            exercise_type: The exercise type being generated.

        Returns:
            Dict with keys: vocabulary, grammar_points, and optionally
            dialogues and rag_chunks.
        """
        result: dict[str, Any] = {}

        # Always fetch vocabulary and grammar — core of every exercise type
        result["vocabulary"] = self._repo.get_vocabulary(book_id, lesson_id)
        result["grammar_points"] = self._repo.get_grammar_points(book_id, lesson_id)

        logger.info(
            "Structured content for book=%d lesson=%d type=%s: %d vocab, %d grammar",
            book_id,
            lesson_id,
            exercise_type,
            len(result["vocabulary"]),
            len(result["grammar_points"]),
        )

        # Fetch dialogues for types that need them
        if exercise_type in _DIALOGUE_TYPES:
            result["dialogues"] = self._repo.get_dialogues(book_id, lesson_id)
            logger.info(
                "Fetched %d dialogues for type=%s",
                len(result["dialogues"]),
                exercise_type,
            )

        # Optionally include RAG chunks as supplementary context
        if self._rag is not None:
            rag_chunks = self._rag.retrieve_content(book_id, lesson_id, exercise_type)
            result["rag_chunks"] = rag_chunks
            logger.info("Included %d supplementary RAG chunks", len(rag_chunks))

        return result
