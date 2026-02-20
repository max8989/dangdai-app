"""Weakness profile service.

Compute user weakness profiles from question_results for adaptive quiz generation.
"""

from __future__ import annotations

import logging
from typing import Any

from src.repositories.performance_repo import PerformanceRepository

logger = logging.getLogger(__name__)


class WeaknessService:
    """Service for computing weakness profiles from performance data."""

    def __init__(self, performance_repo: PerformanceRepository | None = None) -> None:
        """Initialize WeaknessService.

        Args:
            performance_repo: Optional PerformanceRepository (for DI/testing).
        """
        self._repo = performance_repo or PerformanceRepository()

    def get_weakness_profile(self, user_id: str) -> dict[str, Any]:
        """Get the weakness profile for a user.

        Returns weak vocabulary, grammar points, and exercise types
        based on past incorrect answers. Returns empty profile if
        no data is available.

        Args:
            user_id: The user's UUID.

        Returns:
            Dict with weak_vocab, weak_grammar, and weak_exercise_types lists.
        """
        return self._repo.get_weak_areas(user_id)

    def select_mixed_exercise_types(
        self,
        weakness_profile: dict[str, Any],
        available_types: list[str],
        count: int = 4,
    ) -> list[str]:
        """Select exercise types for mixed mode, biased toward weak areas.

        Args:
            weakness_profile: The user's weakness profile.
            available_types: Exercise types available for the chapter.
            count: Number of types to select.

        Returns:
            List of exercise type strings to include in the mixed quiz.
        """
        if not available_types:
            return []

        weak_types: list[str] = weakness_profile.get("weak_exercise_types", [])

        # Prioritize weak types that are available
        selected: list[str] = []
        for wt in weak_types:
            if wt in available_types and wt not in selected:
                selected.append(wt)
            if len(selected) >= count:
                break

        # Fill remaining with other available types
        for at in available_types:
            if at not in selected:
                selected.append(at)
            if len(selected) >= count:
                break

        return selected
