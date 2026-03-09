"""Performance repository.

Query question_results for weakness aggregation to inform adaptive quiz
generation (exercise type selection and content focus).
"""

from __future__ import annotations

import logging
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)


class PerformanceRepository:
    """Repository for querying performance and weakness data."""

    def __init__(self) -> None:
        """Initialize PerformanceRepository with Supabase client."""
        self._client = get_supabase_client()

    def get_weak_areas(self, user_id: str) -> dict[str, Any]:
        """Query question_results to aggregate weakness areas.

        Returns empty profile if table doesn't exist yet. This is expected
        until the quiz_attempts/question_results schema is created in a
        later epic.

        Args:
            user_id: The user's UUID.

        Returns:
            Weakness profile dict with weak_vocab, weak_grammar,
            weak_exercise_types lists.
        """
        empty_profile: dict[str, Any] = {
            "weak_vocab": [],
            "weak_grammar": [],
            "weak_exercise_types": [],
        }

        try:
            # Query incorrect answers from question_results
            response = (
                self._client.table("question_results")
                .select("exercise_type, correct, vocabulary_item, grammar_pattern")
                .eq("user_id", user_id)
                .eq("correct", False)
                .order("created_at", desc=True)
                .limit(100)
                .execute()
            )

            if not response.data:
                return empty_profile

            # Aggregate weak exercise types
            exercise_counts: dict[str, int] = {}
            vocab_counts: dict[str, int] = {}
            grammar_counts: dict[str, int] = {}

            for row in response.data:
                et = row.get("exercise_type", "unknown")
                exercise_counts[et] = exercise_counts.get(et, 0) + 1

                vocab = row.get("vocabulary_item")
                if vocab:
                    vocab_counts[vocab] = vocab_counts.get(vocab, 0) + 1

                grammar = row.get("grammar_pattern")
                if grammar:
                    grammar_counts[grammar] = grammar_counts.get(grammar, 0) + 1

            weak_types = sorted(
                exercise_counts.keys(),
                key=lambda k: exercise_counts[k],
                reverse=True,
            )
            weak_vocab = sorted(
                vocab_counts.keys(),
                key=lambda k: vocab_counts[k],
                reverse=True,
            )
            weak_grammar = sorted(
                grammar_counts.keys(),
                key=lambda k: grammar_counts[k],
                reverse=True,
            )

            return {
                "weak_vocab": weak_vocab[:10],
                "weak_grammar": weak_grammar[:10],
                "weak_exercise_types": weak_types[:3],
            }

        except Exception:
            # Table doesn't exist yet or query failed - return empty profile
            logger.info(
                "question_results table not available for user %s, "
                "returning empty weakness profile",
                user_id,
            )
            return empty_profile
