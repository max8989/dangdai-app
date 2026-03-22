"""Seed premade_exercises table with all 8 exercise types for every lesson.

Generates exercises using:
- Tier 1 (algorithmic, no LLM): vocabulary, matching, fill_in_blank
- Tier 2 (LLM pipeline): grammar, sentence_construction, dialogue_completion, reading_comprehension
- Mixed: blend of multiple-choice questions from multiple types

Idempotent — skips existing rows via upsert on (book_id, lesson_id, exercise_type).

Usage:
    python -m src.scripts.seed_all_premade_exercises
    python -m src.scripts.seed_all_premade_exercises --book-id 1
    python -m src.scripts.seed_all_premade_exercises --book-id 1 --lesson-range 1-5
    python -m src.scripts.seed_all_premade_exercises --exercise-types vocabulary,grammar
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from typing import Any

from src.agent.generators import (
    FillInBlankGenerator,
    MatchingGenerator,
    VocabularyGenerator,
)
from src.agent.graph import graph
from src.repositories.content_repo import ContentRepository
from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# All 8 exercise types supported by the premade system
ALL_EXERCISE_TYPES = [
    "vocabulary",
    "grammar",
    "fill_in_blank",
    "matching",
    "dialogue_completion",
    "sentence_construction",
    "reading_comprehension",
    "mixed",
]

TIER_1_TYPES = frozenset({"vocabulary", "matching", "fill_in_blank"})
TIER_2_TYPES = frozenset(
    {"grammar", "sentence_construction", "dialogue_completion", "reading_comprehension"}
)

# Default: Book 1 has 15 lessons
DEFAULT_BOOK_ID = 1
DEFAULT_MAX_LESSON = 15

# Batch upsert size
BATCH_SIZE = 50

# Delay between LLM calls to avoid rate limits
LLM_RATE_LIMIT_DELAY = 2.0


def generate_tier1_exercises(
    exercise_type: str,
    book_id: int,
    lesson_id: int,
    content_repo: ContentRepository,
) -> dict[str, Any] | None:
    """Generate Tier 1 exercises using algorithmic generators (no LLM).

    Returns the content JSONB dict, or None on failure.
    """
    vocabulary = content_repo.get_vocabulary(book_id, lesson_id)
    if not vocabulary:
        logger.warning(
            "No vocabulary for book=%d lesson=%d, skipping %s",
            book_id, lesson_id, exercise_type,
        )
        return None

    empty_weakness = {"weak_vocab": [], "weak_grammar": []}

    if exercise_type == "vocabulary":
        gen = VocabularyGenerator()
        questions = gen.generate(
            vocabulary=vocabulary,
            weakness_profile=empty_weakness,
            book_id=book_id,
            lesson_id=lesson_id,
        )
        return {"questions": questions} if questions else None

    if exercise_type == "matching":
        gen_m = MatchingGenerator()
        questions = gen_m.generate(
            vocabulary=vocabulary,
            weakness_profile=empty_weakness,
            book_id=book_id,
            lesson_id=lesson_id,
        )
        if not questions:
            return None
        # MatchingGenerator returns dicts with left_items/right_items arrays
        # Convert to pairs format expected by adaptMatching
        all_pairs = []
        for q in questions:
            left_items = q.get("left_items", [])
            right_items = q.get("right_items", [])
            correct_pairs = q.get("correct_pairs", [])
            for left_idx, right_idx in correct_pairs:
                if left_idx < len(left_items) and right_idx < len(right_items):
                    all_pairs.append({
                        "left": left_items[left_idx],
                        "right": right_items[right_idx],
                    })
        return {"pairs": all_pairs} if all_pairs else None

    if exercise_type == "fill_in_blank":
        grammar_points = content_repo.get_grammar_points(book_id, lesson_id)
        gen_fib = FillInBlankGenerator()
        questions = gen_fib.generate(
            grammar_points=grammar_points or [],
            vocabulary=vocabulary,
            weakness_profile=empty_weakness,
            book_id=book_id,
            lesson_id=lesson_id,
        )
        if not questions:
            return None
        # Convert to content JSONB format expected by adaptFillInBlank
        sentences = []
        for q in questions:
            sentences.append({
                "text_with_blanks": q.get("sentence_with_blanks", q.get("question_text", "")),
                "word_bank": q.get("word_bank", q.get("options", [])),
                "correct_answers": [q.get("correct_answer", "")],
                "explanation": q.get("explanation", ""),
            })
        return {"sentences": sentences} if sentences else None

    return None


def generate_tier2_exercises(
    exercise_type: str,
    book_id: int,
    lesson_id: int,
) -> dict[str, Any] | None:
    """Generate Tier 2 exercises using the LangGraph pipeline (LLM-based).

    Returns the content JSONB dict, or None on failure.
    """
    chapter_id = book_id * 100 + lesson_id
    graph_input = {
        "chapter_id": chapter_id,
        "book_id": book_id,
        "exercise_type": exercise_type,
        "user_id": "batch-seeder",
    }

    try:
        result = graph.invoke(graph_input)
        quiz_payload = result.get("quiz_payload", {})
        questions = quiz_payload.get("questions", [])

        if not questions:
            logger.warning(
                "No questions generated for %s book=%d lesson=%d",
                exercise_type, book_id, lesson_id,
            )
            return None

        # Return content in the format expected by the premade adapter
        return {"questions": questions}

    except Exception:
        logger.exception(
            "Failed to generate %s for book=%d lesson=%d",
            exercise_type, book_id, lesson_id,
        )
        return None


def generate_mixed_exercises(
    book_id: int,
    lesson_id: int,
    content_repo: ContentRepository,
) -> dict[str, Any] | None:
    """Generate mixed exercises — blend of vocabulary and grammar questions.

    Uses Tier 1 vocabulary generator for half, and LLM grammar for the other half.
    """
    # Get vocabulary questions (Tier 1 — fast)
    vocab_content = generate_tier1_exercises("vocabulary", book_id, lesson_id, content_repo)
    vocab_questions = (vocab_content or {}).get("questions", [])

    # Get grammar questions (Tier 2 — LLM)
    grammar_content = generate_tier2_exercises("grammar", book_id, lesson_id)
    grammar_questions = (grammar_content or {}).get("questions", [])

    # Blend: take up to 6 vocab + 6 grammar
    mixed_questions = vocab_questions[:6] + grammar_questions[:6]

    if not mixed_questions:
        logger.warning("No questions for mixed type, book=%d lesson=%d", book_id, lesson_id)
        return None

    # Re-index question_ids (copy dicts to avoid mutating originals)
    mixed_questions = [{**q, "question_id": i + 1} for i, q in enumerate(mixed_questions)]

    return {"questions": mixed_questions}


def _exercise_title(exercise_type: str) -> str:
    """Generate a human-readable title for an exercise type."""
    titles = {
        "vocabulary": "Vocabulary Practice",
        "grammar": "Grammar Practice",
        "fill_in_blank": "Fill in the Blank",
        "matching": "Matching",
        "dialogue_completion": "Dialogue Completion",
        "sentence_construction": "Sentence Construction",
        "reading_comprehension": "Reading Comprehension",
        "mixed": "Mixed Practice",
    }
    return titles.get(exercise_type, exercise_type.replace("_", " ").title())


def _exercise_instructions(exercise_type: str) -> str:
    """Generate default instructions for an exercise type."""
    instructions = {
        "vocabulary": "Choose the correct meaning for each word.",
        "grammar": "Choose the correct answer for each grammar question.",
        "fill_in_blank": "Fill in the blanks with the correct words.",
        "matching": "Match the items on the left with their correct pairs.",
        "dialogue_completion": "Complete the dialogue by choosing the correct response.",
        "sentence_construction": "Arrange the words to form a correct sentence.",
        "reading_comprehension": "Read the passage and answer the questions.",
        "mixed": "Answer the following mixed practice questions.",
    }
    return instructions.get(exercise_type, "Complete the exercise.")


def seed_exercises(
    book_id: int,
    lesson_range: range,
    exercise_types: list[str],
) -> None:
    """Seed premade_exercises for the given book, lessons, and exercise types."""
    client = get_supabase_client()
    content_repo = ContentRepository()

    rows_to_upsert: list[dict[str, Any]] = []
    total_generated = 0
    total_skipped = 0

    for lesson_id in lesson_range:
        # Check which types already exist for this lesson
        existing = (
            client.table("premade_exercises")
            .select("exercise_type")
            .eq("book_id", book_id)
            .eq("lesson_id", lesson_id)
            .execute()
        )
        existing_types = {row["exercise_type"] for row in (existing.data or [])}

        for exercise_type in exercise_types:
            if exercise_type in existing_types:
                logger.info(
                    "Skipping %s for book=%d lesson=%d (already exists)",
                    exercise_type, book_id, lesson_id,
                )
                total_skipped += 1
                continue

            logger.info(
                "Generating %s for book=%d lesson=%d...",
                exercise_type, book_id, lesson_id,
            )

            # Generate content based on tier
            content: dict[str, Any] | None = None

            if exercise_type in TIER_1_TYPES:
                content = generate_tier1_exercises(
                    exercise_type, book_id, lesson_id, content_repo
                )
            elif exercise_type in TIER_2_TYPES:
                content = generate_tier2_exercises(exercise_type, book_id, lesson_id)
                time.sleep(LLM_RATE_LIMIT_DELAY)
            elif exercise_type == "mixed":
                content = generate_mixed_exercises(book_id, lesson_id, content_repo)
                time.sleep(LLM_RATE_LIMIT_DELAY)

            if content is None:
                logger.warning(
                    "Failed to generate %s for book=%d lesson=%d",
                    exercise_type, book_id, lesson_id,
                )
                continue

            row = {
                "book_id": book_id,
                "lesson_id": lesson_id,
                "exercise_type": exercise_type,
                "title": _exercise_title(exercise_type),
                "instructions": _exercise_instructions(exercise_type),
                "content": content,
                "difficulty": "medium",
                "exercise_order": ALL_EXERCISE_TYPES.index(exercise_type) + 1,
            }
            rows_to_upsert.append(row)
            total_generated += 1

    # Batch upsert
    if rows_to_upsert:
        for i in range(0, len(rows_to_upsert), BATCH_SIZE):
            batch = rows_to_upsert[i : i + BATCH_SIZE]
            client.table("premade_exercises").upsert(
                batch,
                on_conflict="book_id,lesson_id,exercise_type",
            ).execute()
            logger.info("Upserted batch of %d rows", len(batch))

    logger.info(
        "Seeding complete: %d generated, %d skipped (already existed)",
        total_generated, total_skipped,
    )


def parse_lesson_range(value: str) -> range:
    """Parse a lesson range string like '1-5' or '3' into a range."""
    if "-" in value:
        start, end = value.split("-", 1)
        return range(int(start), int(end) + 1)
    return range(int(value), int(value) + 1)


def main() -> None:
    """CLI entrypoint for seeding all premade exercises."""
    parser = argparse.ArgumentParser(
        description="Seed premade_exercises table with all 8 exercise types"
    )
    parser.add_argument(
        "--book-id",
        type=int,
        default=DEFAULT_BOOK_ID,
        help=f"Book ID to seed (default: {DEFAULT_BOOK_ID})",
    )
    parser.add_argument(
        "--lesson-range",
        type=str,
        default=None,
        help="Lesson range, e.g. '1-5' or '3' (default: all lessons for the book)",
    )
    parser.add_argument(
        "--exercise-types",
        type=str,
        default=None,
        help="Comma-separated exercise types to seed (default: all 8 types)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    # Parse lesson range
    if args.lesson_range:
        lessons = parse_lesson_range(args.lesson_range)
    else:
        lessons = range(1, DEFAULT_MAX_LESSON + 1)

    # Parse exercise types
    if args.exercise_types:
        types = [t.strip() for t in args.exercise_types.split(",")]
        invalid = [t for t in types if t not in ALL_EXERCISE_TYPES]
        if invalid:
            logger.error("Invalid exercise types: %s", invalid)
            logger.error("Valid types: %s", ALL_EXERCISE_TYPES)
            sys.exit(1)
    else:
        types = ALL_EXERCISE_TYPES

    logger.info(
        "Seeding book=%d, lessons=%s, types=%s",
        args.book_id, list(lessons), types,
    )

    seed_exercises(args.book_id, lessons, types)


if __name__ == "__main__":
    main()
