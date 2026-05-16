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
import re
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
= Book 1 Chapter 5, 211 = Book 2 Chapter 11). Each exercise has an
exercise_type, a correct boolean, and optional vocabulary_item /
grammar_pattern metadata.

Produce a structured JSON learning summary the home screen will display. The
summary must:

- LEAD WITH THE SKILL OR TOPIC, NOT THE CHAPTER. Strengths, weaknesses, focus
  areas, and recommendation labels must describe WHAT the student is good at
  or struggling with — specific vocabulary words (e.g. "把", "比較"), grammar
  patterns (e.g. "把 sentences", "從…到… time expressions"), or exercise
  skills (e.g. "reading comprehension", "sentence construction", "filling in
  blanks"). The chapter is supporting context, not the headline. Prefer
  "Sentence construction with 把" over "Sentence construction in Book 3
  Chapter 1". Mention the chapter only if it adds useful context, and append
  it at the end (e.g. "把 sentences (Book 3 Chapter 1)").
- Use vocabulary_item and grammar_pattern fields from the data whenever they
  are present. When they are null (common for reading_comprehension and
  matching), name the underlying skill instead — never just cite the
  chapter.
- Be specific. Cite real grammar patterns and real vocabulary the student has
  actually been quizzed on. Never invent topics that are not in the data.
- ALWAYS refer to chapters in user-visible strings as "Book X Chapter Y" —
  NEVER use the raw composite chapter_id (e.g. "211"). Translate every
  chapter_id before mentioning it.
- ALWAYS humanize exercise_type strings in user-visible text: vocabulary,
  grammar, "fill-in-the-blank", matching, "dialogue completion", "sentence
  construction", "reading comprehension", "mixed practice". Never write the
  raw snake_case form (e.g. "fill_in_blank") in any bullet, headline, or
  label.
- Be short. Each bullet ≤ 12 words. Headline ≤ 18 words. Plain English (no
  emoji, no markdown).
- Be encouraging but honest. If the student is consistently strong at
  something, say so. If they keep missing the same exercise type or pattern,
  say so plainly.
- End with up to 4 actionable recommendations. Each recommendation is a
  practice target with: a short label, an exercise_type the student should
  practice, the chapter_ids it should draw from, and a question_count.
  Recommendations should target the user's actual weak spots in the data.
  Labels are user-visible and must describe the practice itself — e.g.
  "Drill 把 sentence construction", "Reading comprehension practice",
  "Review 比較 vocabulary". The label must NOT be just a chapter reference.

Allowed exercise_type values:
vocabulary, grammar, fill_in_blank, matching, dialogue_completion,
sentence_construction, reading_comprehension, mixed.

Output ONLY a JSON object matching this exact shape — no prose, no markdown
fences, no explanations. ``question_count`` must be between 5 and 15
inclusive. ``chapter_ids`` must contain at least one valid composite id
(book*100 + chapter) drawn from the data above.

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
      "question_count": int  // 5..15
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


_CHAPTER_ID_RE = re.compile(
    r"\bchapter\s*(?:#|id\s*)?(\d{3,4})\b",
    re.IGNORECASE,
)

_EXERCISE_TYPE_LABELS: dict[str, str] = {
    "fill_in_blank": "fill-in-the-blank",
    "dialogue_completion": "dialogue completion",
    "sentence_construction": "sentence construction",
    "reading_comprehension": "reading comprehension",
}


def _humanize_chapter_ids(value: str) -> str:
    """Rewrite raw composite chapter IDs (e.g. "Chapter 211") to "Book 2 Chapter 11".

    Defensive post-processing in case the LLM ignores the prompt instruction.
    """

    def _sub(match: re.Match[str]) -> str:
        cid = int(match.group(1))
        if cid < 100:
            return match.group(0)
        book = cid // 100
        chapter = cid % 100
        if chapter == 0:
            return match.group(0)
        return f"Book {book} Chapter {chapter}"

    return _CHAPTER_ID_RE.sub(_sub, value)


def _humanize_exercise_types(value: str) -> str:
    """Replace raw snake_case exercise-type strings with human-readable forms."""
    out = value
    for raw, human in _EXERCISE_TYPE_LABELS.items():
        out = re.sub(rf"\b{raw}\b", human, out, flags=re.IGNORECASE)
    return out


def _humanize_string(value: str) -> str:
    """Compose all defensive humanizers for user-visible strings."""
    return _humanize_exercise_types(_humanize_chapter_ids(value))


def _humanize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Walk the LLM payload and humanize every user-facing string field."""
    for key in ("headline",):
        v = payload.get(key)
        if isinstance(v, str):
            payload[key] = _humanize_string(v)
    for key in ("strengths", "weaknesses", "focus_areas"):
        items = payload.get(key)
        if isinstance(items, list):
            payload[key] = [
                _humanize_string(it) if isinstance(it, str) else it
                for it in items
            ]
    recs = payload.get("recommendations")
    if isinstance(recs, list):
        for rec in recs:
            if isinstance(rec, dict):
                label = rec.get("label")
                if isinstance(label, str):
                    rec["label"] = _humanize_string(label)
    return payload


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
            raw_obj = json.loads(text)
        except json.JSONDecodeError as exc:
            logger.warning(
                "[learning_summary] JSON parse failed for user=%s; raw=%r err=%s",
                user_id,
                text[:500],
                exc,
            )
            raw_obj = None

        if isinstance(raw_obj, dict):
            recs = raw_obj.get("recommendations")
            if isinstance(recs, list):
                for rec in recs:
                    if not isinstance(rec, dict):
                        continue
                    qc = rec.get("question_count")
                    if isinstance(qc, int):
                        rec["question_count"] = max(5, min(20, qc))
            raw_obj = _humanize_payload(raw_obj)

        try:
            payload = (
                LearningSummaryPayload.model_validate(raw_obj)
                if isinstance(raw_obj, dict)
                else LearningSummaryPayload.model_validate_json(text)
            )
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
