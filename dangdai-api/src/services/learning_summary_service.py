"""Learning summary service.

Generate an AI summary of a user's recent exercise performance — strengths,
weaknesses, focus areas, and actionable practice recommendations — and persist
it to ``learning_summaries`` so the home screen can render it instantly on
subsequent visits.
"""

from __future__ import annotations

import json
import logging
import os
from collections import Counter
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError

from src.api.schemas import LearningSummaryPayload, LearningSummaryResponse
from src.repositories.performance_repo import PerformanceRepository
from src.utils.llm_factory import get_llm

logger = logging.getLogger(__name__)


_RECENT_LIMIT = 30

_SYSTEM_PROMPT = """You are a concise, encouraging Chinese language tutor for a
student learning from 當代中文課程 (A Course in Contemporary Chinese).

You will be given a JSON payload describing the student's last few quiz
exercises (chapter_id uses the convention book_id*100 + chapter_number, so 105
= Book 1 Chapter 5). Each exercise has an exercise_type, a correct boolean, and
optional vocabulary_item / grammar_pattern metadata.

Produce a structured JSON learning summary the home screen will display. The
summary must:

- Be specific. Cite real chapters, real grammar patterns, and real vocabulary
  the student has actually been quizzed on. Never invent topics not in the
  data.
- Be short. Each bullet ≤ 12 words. Headline ≤ 18 words. Plain English (no
  emoji, no markdown).
- Be encouraging but honest. If the student is consistently strong at
  something, say so. If they keep missing the same exercise type or pattern,
  say so plainly.
- End with up to 4 actionable recommendations. Each recommendation is a
  practice target with: a short label, an exercise_type the student should
  practice, the chapter_ids it should draw from, and a question_count.
  Recommendations should target the user's actual weak spots in the data.

Allowed exercise_type values:
vocabulary, grammar, fill_in_blank, matching, dialogue_completion,
sentence_construction, reading_comprehension, mixed.

Output ONLY a JSON object matching this exact shape — no prose, no markdown
fences, no explanations:

{
  "headline": "string",
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "focus_areas": ["string", ...],
  "recommendations": [
    {
      "label": "string",
      "exercise_type": "vocabulary|grammar|fill_in_blank|matching|dialogue_completion|sentence_construction|reading_comprehension|mixed",
      "chapter_ids": [int, ...],
      "question_count": int
    }
  ]
}
"""


def _strip_code_fence(text: str) -> str:
    """Strip a ```json ... ``` markdown fence if the LLM emitted one."""
    s = text.strip()
    if not s.startswith("```"):
        return s
    first_newline = s.find("\n")
    if first_newline == -1:
        return s
    s = s[first_newline + 1 :]
    if s.rstrip().endswith("```"):
        s = s.rstrip()[:-3].rstrip()
    return s


def _build_user_prompt(results: list[dict[str, Any]]) -> str:
    """Render the recent results into a compact prompt for the LLM."""
    by_type: Counter[str] = Counter()
    correct_by_type: Counter[str] = Counter()
    chapters: Counter[int] = Counter()
    for r in results:
        et = r.get("exercise_type", "unknown")
        by_type[et] += 1
        if r.get("correct"):
            correct_by_type[et] += 1
        ch = r.get("chapter_id")
        if isinstance(ch, int):
            chapters[ch] += 1

    summary_lines = [
        f"- {et}: {correct_by_type[et]}/{by_type[et]} correct"
        for et in by_type
    ]
    chapter_lines = [
        f"- chapter_id {ch}: {n} questions" for ch, n in chapters.most_common()
    ]

    return (
        f"Student has completed {len(results)} recent quiz questions.\n\n"
        "Per exercise type:\n" + "\n".join(summary_lines) + "\n\n"
        "Chapters touched (most → least):\n" + "\n".join(chapter_lines) + "\n\n"
        "Raw recent results (newest first):\n"
        + json.dumps(results, ensure_ascii=False, default=str, indent=2)
        + "\n\nReturn the JSON summary now."
    )


def _empty_summary(reason: str) -> LearningSummaryPayload:
    """Build a placeholder summary used when the user has no recent data."""
    return LearningSummaryPayload(
        headline=reason,
        strengths=[],
        weaknesses=[],
        focus_areas=[
            "Try a vocabulary quiz from Book 1 to start building a baseline.",
        ],
        recommendations=[],
    )


class LearningSummaryService:
    """Service that produces and persists per-user learning summaries."""

    def __init__(
        self, performance_repo: PerformanceRepository | None = None
    ) -> None:
        """Initialize LearningSummaryService.

        Args:
            performance_repo: Optional PerformanceRepository (for DI/testing).
        """
        self._repo = performance_repo or PerformanceRepository()

    def generate(self, user_id: str) -> LearningSummaryResponse:
        """Read recent question_results, ask the LLM for a summary, persist it.

        Args:
            user_id: Authenticated user's UUID.

        Returns:
            LearningSummaryResponse with the structured summary, exercise count,
            model name, and ISO timestamp.
        """
        results = self._repo.get_recent_results(user_id, limit=_RECENT_LIMIT)
        logger.info(
            "[learning_summary] user=%s recent_results=%d", user_id, len(results)
        )

        if not results:
            payload = _empty_summary(
                "No recent exercises yet — finish a quiz and come back to see "
                "your strengths and weaknesses."
            )
            row = self._repo.upsert_learning_summary(
                user_id=user_id,
                summary=payload.model_dump(),
                exercises_analyzed=0,
                model="none",
            )
            return LearningSummaryResponse(
                summary=payload,
                exercises_analyzed=0,
                model="none",
                generated_at=str(row.get("generated_at", "")),
            )

        llm = get_llm(temperature=0.3, max_tokens=1500)
        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=_build_user_prompt(results)),
        ]
        result = llm.invoke(messages)
        raw = result.content if isinstance(result.content, str) else str(result.content)
        text = _strip_code_fence(raw)

        try:
            payload = LearningSummaryPayload.model_validate_json(text)
        except ValidationError as exc:
            logger.warning(
                "[learning_summary] validation failed for user=%s; raw=%r err=%s",
                user_id,
                text[:500],
                exc,
            )
            payload = _empty_summary(
                "Couldn't analyze your recent exercises just now. Try regenerating."
            )

        model_name = (
            getattr(llm, "model_name", None)
            or getattr(llm, "model", None)
            or os.getenv("LLM_MODEL", "unknown")
        )
        row = self._repo.upsert_learning_summary(
            user_id=user_id,
            summary=payload.model_dump(),
            exercises_analyzed=len(results),
            model=str(model_name),
        )

        return LearningSummaryResponse(
            summary=payload,
            exercises_analyzed=len(results),
            model=str(model_name),
            generated_at=str(row.get("generated_at", "")),
        )
