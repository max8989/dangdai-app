"""Seed dialogues table from textbook chunk files.

Parse dialogue-section chunks from book{1-4}_chunks.json, use an LLM
to extract structured dialogue lines from OCR'd content, and populate
the dialogues table in Supabase.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Batch size for upsert calls
BATCH_SIZE = 50

# Rate limit delay between LLM calls (seconds)
LLM_RATE_LIMIT_DELAY = 1.0

# Dialogue number detection patterns
_DIALOGUE_II_PATTERNS = [
    re.compile(r"Dialogue\s*II", re.IGNORECASE),
    re.compile(r"對話二"),
    re.compile(r"寺\s*話\s*二"),
]

_DIALOGUE_I_PATTERNS = [
    re.compile(r"Dialogue\s*I(?!I)", re.IGNORECASE),
    re.compile(r"對話一"),
    re.compile(r"寺\s*話\s*一"),
]

# Extraction prompt for LLM
EXTRACTION_PROMPT = """You are a Chinese language textbook expert. Extract ALL dialogues from this textbook chunk.

The chunk is from Book {book_id}, Lesson {lesson_id} of 當代中文課程 (A Course in Contemporary Chinese).

The content is OCR-scanned and may contain noise, garbled characters, and mixed formatting.
There may be one or two dialogues in this chunk (Dialogue I / 對話一 and Dialogue II / 對話二).

Return a JSON array where each dialogue has these fields:
- "title_traditional": (string) Chinese title (e.g., "對話一", "對話二")
- "title_english": (string) English title (e.g., "Dialogue I", "Dialogue II")
- "dialogue_number": (integer) 1 for Dialogue I, 2 for Dialogue II
- "lines": (array of objects) Each dialogue line with:
  - "speaker": (string) Speaker name in Chinese characters (e.g., "明華", "田中")
  - "traditional": (string) The dialogue line in traditional Chinese characters
  - "simplified": (string) The same line converted to simplified Chinese characters
  - "pinyin": (string) Pinyin romanization with proper tone marks (e.g., "Nǐ hǎo")
  - "english": (string) English translation

IMPORTANT RULES:
1. Each dialogue (I and II) must be a SEPARATE object in the array
2. Clean up OCR noise: fix garbled characters, missing tones, stray formatting artifacts
3. Convert traditional Chinese to simplified Chinese for the "simplified" field
4. Use proper pinyin with tone marks (ā, á, ǎ, à, etc.), not numbers
5. Extract speaker names from the content — do NOT hardcode them
6. Do NOT include vocabulary lists, grammar notes, or other non-dialogue content
7. If the content contains both Chinese text and English translation sections, use both to produce accurate output
8. Return ONLY the JSON array, no other text

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


def filter_dialogue_chunks(
    chunks: list[dict[str, Any]],
    *,
    book_id: int | None = None,
) -> list[dict[str, Any]]:
    """Filter chunks to dialogue and reading section chunks.

    Books 1 uses section='dialogue', while Books 2-4 use section='reading'
    for dialogue-like content. Both are included.

    Args:
        chunks: List of all chunk dictionaries.
        book_id: Optional book ID to filter by.

    Returns:
        List of dialogue/reading section chunks only.
    """
    dialogue_sections = {"dialogue", "reading"}
    result = []
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        if metadata.get("section") not in dialogue_sections:
            continue
        if book_id is not None and metadata.get("book") != book_id:
            continue
        result.append(chunk)
    return result


def detect_dialogue_number(content: str) -> int:
    """Detect dialogue number from content markers.

    Looks for "Dialogue I/II", "對話一/二", or OCR variants like "寺 話 一/二".

    Args:
        content: The chunk content text.

    Returns:
        1 for Dialogue I, 2 for Dialogue II. Defaults to 1 if no marker found.
    """
    # Check for Dialogue II first (since "Dialogue I" pattern could match "II")
    for pattern in _DIALOGUE_II_PATTERNS:
        if pattern.search(content):
            return 2

    for pattern in _DIALOGUE_I_PATTERNS:
        if pattern.search(content):
            return 1

    return 1


def validate_dialogue_line(line: Any) -> bool:
    """Validate a single dialogue line has all required fields.

    Args:
        line: Dialogue line dictionary to validate.

    Returns:
        True if the line is valid, False otherwise.
    """
    if not isinstance(line, dict):
        return False

    required_fields = ["speaker", "traditional", "simplified", "pinyin", "english"]
    for field in required_fields:
        value = line.get(field)
        if not value or not isinstance(value, str) or not value.strip():
            return False

    return True


def validate_dialogue(dialogue: dict[str, Any]) -> bool:
    """Validate a dialogue has required fields and valid lines.

    Args:
        dialogue: Dialogue dictionary to validate.

    Returns:
        True if the dialogue is valid, False otherwise.
    """
    # Check dialogue_number is 1 or 2
    dialogue_number = dialogue.get("dialogue_number")
    if dialogue_number not in (1, 2):
        return False

    # Check lines exist and are non-empty
    lines = dialogue.get("lines")
    if not lines or not isinstance(lines, list) or len(lines) == 0:
        return False

    # Validate each line
    for line in lines:
        if not validate_dialogue_line(line):
            return False

    # Warn if titles are missing (AC #4 expects them to be set)
    if not dialogue.get("title_traditional") or not dialogue.get("title_english"):
        logger.warning(
            "Dialogue %d missing title fields (title_traditional=%r, title_english=%r)",
            dialogue.get("dialogue_number", 0),
            dialogue.get("title_traditional"),
            dialogue.get("title_english"),
        )

    return True


def extract_dialogues_llm(
    chunk: dict[str, Any],
    *,
    llm: Any = None,
) -> list[dict[str, Any]]:
    """Extract dialogues from a chunk using LLM.

    Args:
        chunk: Dialogue chunk dictionary with content and metadata.
        llm: LangChain chat model instance. If None, creates one.

    Returns:
        List of extracted dialogue dictionaries.
    """
    if llm is None:
        from src.utils.llm_factory import get_llm

        llm = get_llm(temperature=0.0, max_tokens=4096)

    metadata = chunk["metadata"]
    content = chunk["content"]

    prompt = EXTRACTION_PROMPT.format(
        book_id=metadata["book"],
        lesson_id=metadata["lesson"],
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

        dialogues = json.loads(json_text)

        if not isinstance(dialogues, list):
            logger.warning(
                "LLM returned non-list for Book %d Lesson %d, wrapping in list",
                metadata["book"],
                metadata["lesson"],
            )
            dialogues = [dialogues]

        # Validate each dialogue and apply fallback for dialogue_number
        valid_dialogues = []
        for dialogue in dialogues:
            # Fallback: use detect_dialogue_number if LLM didn't set it
            if dialogue.get("dialogue_number") not in (1, 2):
                detected = detect_dialogue_number(content)
                dialogue["dialogue_number"] = detected
                logger.info(
                    "Used detect_dialogue_number fallback (%d) for Book %d Lesson %d",
                    detected,
                    metadata["book"],
                    metadata["lesson"],
                )

            if validate_dialogue(dialogue):
                valid_dialogues.append(dialogue)
            else:
                logger.warning(
                    "Invalid dialogue skipped for Book %d Lesson %d: %s",
                    metadata["book"],
                    metadata["lesson"],
                    dialogue.get("title_english", "<no title>"),
                )

        return valid_dialogues

    except json.JSONDecodeError:
        logger.exception(
            "Failed to parse LLM response as JSON for Book %d Lesson %d",
            metadata["book"],
            metadata["lesson"],
        )
        return []
    except Exception:
        logger.exception(
            "LLM extraction failed for Book %d Lesson %d",
            metadata["book"],
            metadata["lesson"],
        )
        return []


def seed_dialogues(
    rows: list[dict[str, Any]],
    *,
    batch_size: int = BATCH_SIZE,
) -> None:
    """Upsert dialogue rows into Supabase in batches.

    Args:
        rows: List of dialogue dictionaries to upsert.
        batch_size: Number of rows per upsert call.

    Raises:
        Exception: If a batch upsert fails.
    """
    if not rows:
        logger.info("No dialogues to seed.")
        return

    client = get_supabase_client()
    total = len(rows)

    for i in range(0, total, batch_size):
        batch = rows[i : i + batch_size]
        try:
            client.table("dialogues").upsert(
                batch,
                on_conflict="book_id,lesson_id,dialogue_number",
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

    logger.info("Seeding complete: %d total dialogues upserted.", total)


def process_chunks(
    chunks_dir: str,
    *,
    book_id: int | None = None,
    dry_run: bool = False,
) -> list[dict[str, Any]]:
    """Process chunk files and extract dialogues.

    Args:
        chunks_dir: Directory containing book{1-4}_chunks.json files.
        book_id: Optional single book to process.
        dry_run: If True, parse and validate without inserting.

    Returns:
        List of dialogue dictionaries ready for database insertion.
    """
    chunks_path = Path(chunks_dir)
    all_dialogues: list[dict[str, Any]] = []

    # Determine which books to process
    if book_id is not None:
        book_ids = [book_id]
    else:
        book_ids = [1, 2, 3, 4]

    # Create LLM instance lazily
    llm = None

    for bid in book_ids:
        chunk_file = chunks_path / f"book{bid}_chunks.json"
        if not chunk_file.exists():
            logger.warning("Chunk file not found: %s", chunk_file)
            continue

        logger.info("Loading chunks from %s...", chunk_file)
        chunks = load_chunks(str(chunk_file))
        dialogue_chunks = filter_dialogue_chunks(chunks, book_id=bid)
        logger.info(
            "Book %d: %d dialogue/reading chunks found (of %d total)",
            bid,
            len(dialogue_chunks),
            len(chunks),
        )

        # Sort chunks by lesson and page range for consistent ordering
        dialogue_chunks.sort(
            key=lambda c: (
                c["metadata"].get("lesson", 0) or 0,
                c["metadata"].get("page_range", "0"),
            )
        )

        # Group chunks by lesson (some lessons have multiple dialogue chunks)
        lesson_chunks: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for chunk in dialogue_chunks:
            lesson = chunk["metadata"].get("lesson")
            if lesson is not None:
                lesson_chunks[lesson].append(chunk)

        for lesson_id in sorted(lesson_chunks.keys()):
            chunks_for_lesson = lesson_chunks[lesson_id]

            for chunk in chunks_for_lesson:
                quality = chunk["metadata"].get("content_quality", 1.0)

                # Skip very low quality chunks
                if quality < 0.5:
                    logger.warning(
                        "Skipping low-quality chunk: Book %d, Lesson %d "
                        "(quality: %.2f, pages: %s)",
                        bid,
                        lesson_id,
                        quality,
                        chunk["metadata"].get("page_range", "?"),
                    )
                    continue

                logger.info(
                    "Extracting dialogues: Book %d, Lesson %d "
                    "(quality: %.2f, pages: %s)...",
                    bid,
                    lesson_id,
                    quality,
                    chunk["metadata"].get("page_range", "?"),
                )

                if not dry_run:
                    if llm is None:
                        from src.utils.llm_factory import get_llm

                        llm = get_llm(temperature=0.0, max_tokens=4096)

                    dialogues = extract_dialogues_llm(chunk, llm=llm)
                    for dialogue in dialogues:
                        dialogue["book_id"] = bid
                        dialogue["lesson_id"] = lesson_id
                    all_dialogues.extend(dialogues)

                    # Rate limiting between LLM calls
                    time.sleep(LLM_RATE_LIMIT_DELAY)
                else:
                    logger.info(
                        "  [DRY RUN] Would extract from chunk (pages %s, %d chars)",
                        chunk["metadata"].get("page_range", "?"),
                        len(chunk.get("content", "")),
                    )

    # Deduplicate: keep last extraction per (book_id, lesson_id, dialogue_number)
    seen: dict[tuple[int, int, int], int] = {}
    for idx, d in enumerate(all_dialogues):
        key = (d["book_id"], d["lesson_id"], d["dialogue_number"])
        seen[key] = idx
    if len(seen) < len(all_dialogues):
        deduped = [all_dialogues[i] for i in sorted(seen.values())]
        logger.warning(
            "Deduplicated %d → %d dialogues (removed %d duplicates)",
            len(all_dialogues),
            len(deduped),
            len(all_dialogues) - len(deduped),
        )
        all_dialogues = deduped

    return all_dialogues


def _print_summary(rows: list[dict[str, Any]]) -> None:
    """Print a summary of extracted dialogues.

    Args:
        rows: List of dialogue dictionaries.
    """
    book_lesson_counts: dict[int, dict[int, int]] = defaultdict(
        lambda: defaultdict(int)
    )
    total_lines = 0

    for row in rows:
        book_lesson_counts[row["book_id"]][row["lesson_id"]] += 1
        total_lines += len(row.get("lines", []))

    print("\n=== Dialogue Seeding Summary ===")  # noqa: T201
    print(f"Total dialogues: {len(rows)}")  # noqa: T201
    print(f"Total dialogue lines: {total_lines}")  # noqa: T201

    for bid in sorted(book_lesson_counts):
        lessons = book_lesson_counts[bid]
        total = sum(lessons.values())
        print(  # noqa: T201
            f"\n  Book {bid}: {total} dialogues across {len(lessons)} lessons"
        )
        for lid in sorted(lessons):
            print(f"    Lesson {lid:2d}: {lessons[lid]} dialogues")  # noqa: T201

    # Check for missing lessons
    expected_lessons = {
        1: list(range(1, 16)),
        2: list(range(1, 16)),
        3: list(range(1, 13)),
        4: list(range(1, 13)),
    }

    missing: list[tuple[int, int]] = []
    for bid in sorted(expected_lessons):
        if bid not in book_lesson_counts:
            for lid in expected_lessons[bid]:
                missing.append((bid, lid))
        else:
            for lid in expected_lessons[bid]:
                if lid not in book_lesson_counts[bid]:
                    missing.append((bid, lid))

    if missing:
        print(f"\n  Missing lessons ({len(missing)}):")  # noqa: T201
        for bid, lid in missing:
            print(f"    Book {bid} Lesson {lid}")  # noqa: T201

    print("================================\n")  # noqa: T201


def main() -> None:
    """Run the dialogue seeding script."""
    parser = argparse.ArgumentParser(
        description="Seed dialogues table from textbook chunk files"
    )
    parser.add_argument(
        "--chunks-dir",
        default="dangdai-rag/output_chunks/",
        help="Directory containing book{1-4}_chunks.json files "
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

    logger.info("Processing dialogue chunks from %s...", args.chunks_dir)

    rows = process_chunks(
        args.chunks_dir,
        book_id=args.book,
        dry_run=args.dry_run,
    )

    if rows:
        _print_summary(rows)

    if args.dry_run:
        logger.info("Dry run complete. No data inserted.")
        return

    if not rows:
        logger.warning("No dialogues extracted. Nothing to seed.")
        return

    logger.info("Seeding %d dialogues...", len(rows))
    seed_dialogues(rows)
    logger.info("Done!")


if __name__ == "__main__":
    # Allow running from project root: python -m src.scripts.seed_dialogues
    # or directly: python src/scripts/seed_dialogues.py
    sys.path.insert(0, ".")

    # Set default LLM provider for extraction if not set
    if not os.getenv("LLM_PROVIDER"):
        os.environ["LLM_PROVIDER"] = "openai"
    if not os.getenv("LLM_MODEL"):
        os.environ["LLM_MODEL"] = "gpt-4o-mini"

    main()
