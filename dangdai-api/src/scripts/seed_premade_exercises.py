"""Seed premade_exercises table from workbook chunk files.

Parse exercise-section chunks from workbook{1-4}_chunks.json, use an LLM
to restructure OCR'd content into typed JSONB schemas, and populate
the premade_exercises table in Supabase.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Batch size for upsert calls
BATCH_SIZE = 100

# Rate limit delay between LLM calls (seconds)
LLM_RATE_LIMIT_DELAY = 1.0

# Exercise types allowed by the CHECK constraint
VALID_EXERCISE_TYPES = frozenset(
    {
        "listening",
        "reading",
        "fill_in_blank",
        "dialogue_completion",
        "sentence_construction",
        "matching",
        "character_writing",
        "composition",
        "pronunciation",
    }
)

# Exercise types to skip (not real exercises)
SKIP_EXERCISE_TYPES = frozenset({"lesson_intro", "vocabulary"})

# Difficulty mapping from chunk metadata to premade_exercises CHECK constraint
_DIFFICULTY_MAP: dict[str, str] = {
    "beginner": "easy",
    "intermediate": "medium",
    "advanced": "hard",
    "easy": "easy",
    "medium": "medium",
    "hard": "hard",
}

# Type-specific extraction prompts
_EXERCISE_PROMPTS: dict[str, str] = {
    "fill_in_blank": """Extract a fill-in-the-blank exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Fill in the Blank")
- "instructions": (string) Instructions for the student
- "content": (object) with key "sentences" — an array of objects, each with:
  - "text_with_blanks": (string) Sentence with ___ for blanks
  - "word_bank": (array of strings) Available words to choose from
  - "correct_answers": (array of strings) Correct answers for each blank
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "matching": """Extract a matching exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Match the Sentences")
- "instructions": (string) Instructions for the student
- "content": (object) with key "pairs" — an array of objects, each with:
  - "prompt": (string) Left-side item to match
  - "response": (string) Right-side matching item
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "dialogue_completion": """Extract a dialogue completion exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Complete the Dialogue")
- "instructions": (string) Instructions for the student
- "content": (object) with key "pairs" — an array of objects, each with:
  - "prompt": (string) The given dialogue line or cue
  - "response": (string) The expected response
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "sentence_construction": """Extract a sentence construction exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Rearrange the Words")
- "instructions": (string) Instructions for the student
- "content": (object) with key "sentences" — an array of objects, each with:
  - "scrambled_words": (array of strings) Words in scrambled order
  - "correct_order": (string) The correct sentence
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "reading": """Extract a reading comprehension exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Reading Comprehension")
- "instructions": (string) Instructions for the student
- "content": (object) with:
  - "passage": (string) The reading passage
  - "questions": (array of objects) Each with:
    - "question": (string) The question
    - "options": (array of strings) Answer choices
    - "correct_answer": (string) The correct answer
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "listening": """This is a listening exercise converted to reading format (no audio available).
Extract the content as a reading exercise with pinyin-to-Chinese matching.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Listen and Respond")
- "instructions": (string) Instructions adapted for reading (e.g., "Match the pinyin to the Chinese characters")
- "content": (object) with key "sentences" — an array of objects, each with:
  - "pinyin": (string) Pinyin romanization
  - "expected_chinese": (string) Corresponding Chinese characters
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "composition": """Extract a composition exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Write a Paragraph")
- "instructions": (string) Instructions for the student
- "content": (object) with:
  - "prompt": (string) The writing prompt
  - "word_count": (integer) Target word count (extract from content or use 50 as default)
  - "suggested_vocabulary": (array of strings) Suggested vocabulary words
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "pronunciation": """Extract a pronunciation exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Pronunciation Practice")
- "instructions": (string) Instructions for the student
- "content": (object) with key "sentences" — an array of objects, each with:
  - "pinyin": (string) Pinyin romanization
  - "expected_chinese": (string) Corresponding Chinese characters
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
    "character_writing": """Extract a character writing exercise from this workbook content.

Return a JSON object with:
- "title": (string) Exercise title (e.g., "Character Writing Practice")
- "instructions": (string) Instructions for the student
- "content": (object) with key "characters" — an array of objects, each with:
  - "character": (string) The Chinese character to practice
  - "pinyin": (string) Pinyin romanization
  - "stroke_order_hint": (string) Hint about stroke order or character components
- "low_confidence": (boolean) true if OCR quality is too poor to extract reliably

Return ONLY the JSON object, no other text.""",
}

# Base prompt prefix for all exercise types
_BASE_PROMPT_PREFIX = """You are a Chinese language textbook expert. Extract the exercise from this workbook chunk.

The chunk is from Book {book_id}, Lesson {lesson_id} of 當代中文課程 (A Course in Contemporary Chinese) Workbook.
Exercise type: {exercise_type}

The content is OCR-scanned and may contain noise, garbled characters, and mixed formatting.
Clean up OCR noise: fix garbled characters, stray formatting artifacts.

{type_specific_prompt}

Content:
{content}"""


def load_chunks(file_path: str) -> list[dict[str, Any]]:
    """Load chunks from a JSON file.

    Args:
        file_path: Path to the chunks JSON file.

    Returns:
        List of chunk dictionaries.

    Raises:
        FileNotFoundError: If the file does not exist.
        json.JSONDecodeError: If the file contains invalid JSON.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Chunk file not found: {file_path}")

    with open(path, encoding="utf-8") as f:
        return json.load(f)


def filter_exercise_chunks(
    chunks: list[dict[str, Any]],
    *,
    book_id: int | None = None,
) -> list[dict[str, Any]]:
    """Filter chunks to exercise-only chunks, excluding lesson_intro and null types.

    Args:
        chunks: List of all chunk dictionaries.
        book_id: Optional book ID to filter by.

    Returns:
        List of exercise chunks only (excluding lesson_intro and null exercise_type).
    """
    result = []
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        exercise_type = metadata.get("exercise_type")
        lesson = metadata.get("lesson")

        # Skip null exercise types
        if exercise_type is None:
            continue

        # Skip lesson_intro and other non-exercise types
        if exercise_type in SKIP_EXERCISE_TYPES:
            continue

        # Skip chunks without a lesson number
        if lesson is None:
            continue

        # Filter by book_id if specified
        if book_id is not None and metadata.get("book") != book_id:
            continue

        result.append(chunk)
    return result


def map_difficulty(difficulty: str | None) -> str | None:
    """Map chunk difficulty to premade_exercises difficulty CHECK constraint values.

    Args:
        difficulty: Difficulty string from chunk metadata.

    Returns:
        Mapped difficulty string ('easy', 'medium', 'hard') or None if unmappable.
    """
    if difficulty is None:
        return None
    return _DIFFICULTY_MAP.get(difficulty)


def validate_exercise_content(exercise_type: str, content: dict[str, Any]) -> bool:
    """Validate exercise content JSONB against the expected schema for the exercise type.

    Args:
        exercise_type: The exercise type string.
        content: The content dictionary to validate.

    Returns:
        True if the content matches the expected schema, False otherwise.
    """
    if not content:
        return False

    if exercise_type not in VALID_EXERCISE_TYPES:
        return False

    if exercise_type in ("fill_in_blank", "sentence_construction"):
        sentences = content.get("sentences")
        if not isinstance(sentences, list) or len(sentences) == 0:
            return False
        return True

    if exercise_type in ("matching", "dialogue_completion"):
        pairs = content.get("pairs")
        if not isinstance(pairs, list) or len(pairs) == 0:
            return False
        return True

    if exercise_type == "reading":
        passage = content.get("passage")
        questions = content.get("questions")
        if not passage or not isinstance(questions, list):
            return False
        return True

    if exercise_type in ("listening", "pronunciation"):
        sentences = content.get("sentences")
        if not isinstance(sentences, list) or len(sentences) == 0:
            return False
        return True

    if exercise_type == "composition":
        prompt = content.get("prompt")
        if not prompt:
            return False
        return True

    if exercise_type == "character_writing":
        characters = content.get("characters")
        if not isinstance(characters, list) or len(characters) == 0:
            return False
        return True

    return False


def assign_exercise_order(
    exercises: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Assign exercise_order sequentially per (book_id, lesson_id).

    Exercise order is sequential across all exercise types within a lesson,
    preserving the original order of exercises as they appear in the list.

    Args:
        exercises: List of exercise dictionaries with book_id and lesson_id.

    Returns:
        Same list with exercise_order assigned (in-place modification).
    """
    if not exercises:
        return []

    counters: dict[tuple[int, int], int] = defaultdict(int)

    for exercise in exercises:
        key = (exercise["book_id"], exercise["lesson_id"])
        counters[key] += 1
        exercise["exercise_order"] = counters[key]

    return exercises


def extract_exercise_llm(
    chunk: dict[str, Any],
    *,
    llm: Any = None,
) -> dict[str, Any] | None:
    """Extract and restructure exercise content from a chunk using LLM.

    Args:
        chunk: Exercise chunk dictionary with content and metadata.
        llm: LangChain chat model instance. If None, creates one.

    Returns:
        Extracted exercise dictionary with title, instructions, content, and
        low_confidence flag. Returns None if extraction fails or content is invalid.
    """
    if llm is None:
        from src.utils.llm_factory import get_llm

        llm = get_llm(temperature=0.0, max_tokens=4096)

    metadata = chunk["metadata"]
    content = chunk["content"]
    exercise_type = metadata.get("exercise_type", "")

    # Get type-specific prompt
    type_specific_prompt = _EXERCISE_PROMPTS.get(exercise_type, "")
    if not type_specific_prompt:
        logger.warning(
            "No prompt template for exercise type '%s' in Book %d Lesson %d",
            exercise_type,
            metadata.get("book", 0),
            metadata.get("lesson", 0),
        )
        return None

    prompt = _BASE_PROMPT_PREFIX.format(
        book_id=metadata.get("book", "?"),
        lesson_id=metadata.get("lesson", "?"),
        exercise_type=exercise_type,
        type_specific_prompt=type_specific_prompt,
        content=content,
    )

    try:
        response = llm.invoke(prompt)
        response_text = (
            response.content if hasattr(response, "content") else str(response)
        )

        # Extract JSON from response (handle markdown code blocks)
        json_text = response_text.strip()
        if json_text.startswith("```"):
            lines = json_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            json_text = "\n".join(lines)

        extracted = json.loads(json_text)

        if not isinstance(extracted, dict):
            logger.warning(
                "LLM returned non-dict for Book %d Lesson %d exercise_type=%s",
                metadata.get("book", 0),
                metadata.get("lesson", 0),
                exercise_type,
            )
            return None

        # Validate content schema
        exercise_content = extracted.get("content", {})
        if not validate_exercise_content(exercise_type, exercise_content):
            logger.warning(
                "Invalid content schema for Book %d Lesson %d exercise_type=%s",
                metadata.get("book", 0),
                metadata.get("lesson", 0),
                exercise_type,
            )
            return None

        return extracted

    except json.JSONDecodeError:
        logger.exception(
            "Failed to parse LLM response as JSON for Book %d Lesson %d exercise_type=%s",
            metadata.get("book", 0),
            metadata.get("lesson", 0),
            exercise_type,
        )
        return None
    except Exception:
        logger.exception(
            "LLM extraction failed for Book %d Lesson %d exercise_type=%s",
            metadata.get("book", 0),
            metadata.get("lesson", 0),
            exercise_type,
        )
        return None


def seed_premade_exercises(
    rows: list[dict[str, Any]],
    *,
    batch_size: int = BATCH_SIZE,
) -> None:
    """Upsert premade exercise rows into Supabase in batches.

    Args:
        rows: List of premade exercise dictionaries to upsert.
        batch_size: Number of rows per upsert call.

    Raises:
        Exception: If a batch upsert fails.
    """
    if not rows:
        logger.info("No exercises to seed.")
        return

    client = get_supabase_client()
    total = len(rows)

    for i in range(0, total, batch_size):
        batch = rows[i : i + batch_size]
        try:
            client.table("premade_exercises").upsert(
                batch,
                on_conflict="book_id,lesson_id,exercise_type,exercise_order",
            ).execute()
        except Exception:
            logger.exception(
                "Failed to upsert batch %d-%d of %d",
                i + 1,
                min(i + batch_size, total),
                total,
            )
            raise
        logger.info(
            "Upserted batch %d-%d of %d",
            i + 1,
            min(i + batch_size, total),
            total,
        )

    logger.info("Seeding complete: %d total exercises upserted.", total)


def process_chunks(
    chunks_dir: str,
    *,
    book_id: int | None = None,
    dry_run: bool = False,
) -> list[dict[str, Any]]:
    """Process workbook chunk files and extract premade exercises.

    Args:
        chunks_dir: Directory containing workbook{1-4}_chunks.json files.
        book_id: Optional single book to process.
        dry_run: If True, parse and validate without inserting.

    Returns:
        List of premade exercise dictionaries ready for database insertion.
    """
    chunks_path = Path(chunks_dir)
    all_exercises: list[dict[str, Any]] = []

    # Determine which books to process
    if book_id is not None:
        book_ids = [book_id]
    else:
        book_ids = [1, 2, 3, 4]

    # Create LLM instance lazily (only when needed for extraction)
    llm = None

    for bid in book_ids:
        chunk_file = chunks_path / f"workbook{bid}_chunks.json"
        if not chunk_file.exists():
            logger.warning("Chunk file not found: %s", chunk_file)
            continue

        logger.info("Loading chunks from %s...", chunk_file)
        chunks = load_chunks(str(chunk_file))
        exercise_chunks = filter_exercise_chunks(chunks, book_id=bid)
        logger.info(
            "Book %d: %d exercise chunks found (of %d total)",
            bid,
            len(exercise_chunks),
            len(chunks),
        )

        # Sort chunks by lesson and page range for consistent ordering.
        # Parse the first page number from page_range (e.g., "10-11" → 10) so
        # that numeric ordering is used instead of lexicographic string ordering.
        def _page_sort_key(chunk: dict[str, Any]) -> tuple[int, int]:
            lesson = chunk["metadata"].get("lesson", 0) or 0
            page_range = chunk["metadata"].get("page_range", "0") or "0"
            try:
                first_page = int(page_range.split("-")[0])
            except (ValueError, AttributeError):
                first_page = 0
            return (lesson, first_page)

        exercise_chunks.sort(key=_page_sort_key)

        # Group chunks by lesson
        lesson_chunks: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for chunk in exercise_chunks:
            lesson = chunk["metadata"].get("lesson")
            if lesson is not None:
                lesson_chunks[lesson].append(chunk)

        book_exercises: list[dict[str, Any]] = []

        for lesson_id in sorted(lesson_chunks.keys()):
            chunks_for_lesson = lesson_chunks[lesson_id]

            for chunk in chunks_for_lesson:
                metadata = chunk["metadata"]
                exercise_type = metadata.get("exercise_type", "")
                quality = metadata.get("content_quality", 1.0)

                # Skip very low quality chunks — OCR noise too severe for reliable extraction
                if quality < 0.5:
                    logger.warning(
                        "Skipping low-quality chunk: Book %d, Lesson %d, type=%s "
                        "(quality: %.2f, pages: %s)",
                        bid,
                        lesson_id,
                        exercise_type,
                        quality,
                        metadata.get("page_range", "?"),
                    )
                    continue

                # Skip exercise types not in the valid set (defensive guard)
                if exercise_type not in VALID_EXERCISE_TYPES:
                    logger.warning(
                        "Skipping unknown exercise type '%s': Book %d, Lesson %d "
                        "(pages: %s)",
                        exercise_type,
                        bid,
                        lesson_id,
                        metadata.get("page_range", "?"),
                    )
                    continue

                logger.info(
                    "Extracting exercise: Book %d, Lesson %d, type=%s "
                    "(quality: %.2f, pages: %s)...",
                    bid,
                    lesson_id,
                    exercise_type,
                    quality,
                    metadata.get("page_range", "?"),
                )

                if not dry_run:
                    if llm is None:
                        from src.utils.llm_factory import get_llm

                        llm = get_llm(temperature=0.0, max_tokens=4096)

                    extracted = extract_exercise_llm(chunk, llm=llm)

                    if extracted is None:
                        logger.warning(
                            "Skipping Book %d Lesson %d type=%s — extraction failed",
                            bid,
                            lesson_id,
                            exercise_type,
                        )
                        # Rate limiting even on failure
                        time.sleep(LLM_RATE_LIMIT_DELAY)
                        continue

                    low_confidence = extracted.get("low_confidence", False)
                    if low_confidence:
                        logger.warning(
                            "Low confidence extraction: Book %d Lesson %d type=%s "
                            "(pages: %s) — inserting with null difficulty for review",
                            bid,
                            lesson_id,
                            exercise_type,
                            metadata.get("page_range", "?"),
                        )

                    # Map difficulty — set to None for low confidence exercises
                    if low_confidence:
                        difficulty = None
                    else:
                        difficulty = map_difficulty(metadata.get("difficulty"))

                    exercise_row: dict[str, Any] = {
                        "book_id": bid,
                        "lesson_id": lesson_id,
                        "exercise_type": exercise_type,
                        "title": extracted.get("title"),
                        "instructions": extracted.get("instructions"),
                        "content": extracted.get("content", {}),
                        "difficulty": difficulty,
                        "source_page_range": metadata.get("page_range"),
                    }
                    book_exercises.append(exercise_row)

                    # Rate limiting between LLM calls
                    time.sleep(LLM_RATE_LIMIT_DELAY)
                else:
                    logger.info(
                        "  [DRY RUN] Would extract from chunk "
                        "(type=%s, pages %s, %d chars)",
                        exercise_type,
                        metadata.get("page_range", "?"),
                        len(chunk.get("content", "")),
                    )

        if book_exercises:
            all_exercises.extend(book_exercises)
            logger.info(
                "Book %d: %d exercises extracted",
                bid,
                len(book_exercises),
            )

    # Deduplicate: keep last extraction per (book_id, lesson_id, exercise_type).
    # Multiple chunks of the same type in the same lesson (e.g., split OCR pages)
    # should produce a single exercise row — the last chunk's extraction wins.
    seen: dict[tuple[int, int, str], int] = {}
    for idx, ex in enumerate(all_exercises):
        key = (ex["book_id"], ex["lesson_id"], ex["exercise_type"])
        seen[key] = idx
    if len(seen) < len(all_exercises):
        deduped = [all_exercises[i] for i in sorted(seen.values())]
        logger.warning(
            "Deduplicated %d → %d exercises (removed %d duplicates)",
            len(all_exercises),
            len(deduped),
            len(all_exercises) - len(deduped),
        )
        all_exercises = deduped

    # Assign exercise_order sequentially per (book_id, lesson_id)
    if all_exercises:
        all_exercises = assign_exercise_order(all_exercises)

    return all_exercises


def _print_summary(
    rows: list[dict[str, Any]],
    *,
    flagged_count: int = 0,
) -> None:
    """Print a summary of extracted premade exercises.

    Args:
        rows: List of premade exercise dictionaries.
        flagged_count: Number of low-confidence exercises flagged for review.
    """
    book_lesson_type_counts: dict[int, dict[int, dict[str, int]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(int))
    )

    for row in rows:
        book_lesson_type_counts[row["book_id"]][row["lesson_id"]][
            row["exercise_type"]
        ] += 1

    print("\n=== Premade Exercises Seeding Summary ===")  # noqa: T201
    print(f"Total exercises: {len(rows)}")  # noqa: T201
    if flagged_count:
        print(f"Flagged for review (low confidence): {flagged_count}")  # noqa: T201

    for bid in sorted(book_lesson_type_counts):
        lessons = book_lesson_type_counts[bid]
        total = sum(sum(types.values()) for types in lessons.values())
        print(f"\n  Book {bid}: {total} exercises across {len(lessons)} lessons")  # noqa: T201
        for lid in sorted(lessons):
            types = lessons[lid]
            type_summary = ", ".join(f"{t}: {c}" for t, c in sorted(types.items()))
            print(f"    Lesson {lid:2d}: {sum(types.values())} ({type_summary})")  # noqa: T201

    print("=========================================\n")  # noqa: T201


def main() -> None:
    """Run the premade exercises seeding script."""
    parser = argparse.ArgumentParser(
        description="Seed premade_exercises table from workbook chunk files"
    )
    parser.add_argument(
        "--chunks-dir",
        default="dangdai-rag/output_chunks/",
        help="Directory containing workbook{1-4}_chunks.json files "
        "(default: dangdai-rag/output_chunks/)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate without inserting into database",
    )
    parser.add_argument(
        "--book",
        type=int,
        choices=[1, 2, 3, 4],
        help="Process a single book (useful for debugging)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Processing workbook chunks from %s...", args.chunks_dir)

    rows = process_chunks(
        args.chunks_dir,
        book_id=args.book,
        dry_run=args.dry_run,
    )

    if rows:
        flagged = sum(1 for r in rows if r.get("difficulty") is None)
        _print_summary(rows, flagged_count=flagged)

    if args.dry_run:
        logger.info("Dry run complete. No data inserted.")
        return

    if not rows:
        logger.warning("No exercises extracted. Nothing to seed.")
        return

    logger.info("Seeding %d premade exercises...", len(rows))
    seed_premade_exercises(rows)
    logger.info("Done!")


if __name__ == "__main__":
    # Allow running from project root: python -m src.scripts.seed_premade_exercises
    # or directly: python src/scripts/seed_premade_exercises.py
    sys.path.insert(0, ".")

    # Set default LLM provider for extraction if not set
    if not os.getenv("LLM_PROVIDER"):
        os.environ["LLM_PROVIDER"] = "openai"
    if not os.getenv("LLM_MODEL"):
        os.environ["LLM_MODEL"] = "gpt-4o-mini"

    main()
