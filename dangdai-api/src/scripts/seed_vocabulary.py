"""Seed vocabulary table from Flash-card.tsv.

Parse the Flash-card.tsv file and populate the vocabulary table
in Supabase for all books found in the TSV.
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
from collections import defaultdict
from typing import Any

from src.utils.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Regex for header lines: //當代中文/Book {book}/L{lesson}-{section}
HEADER_PATTERN = re.compile(r"^//當代中文/Book (\d+)/L(\d+)-(I{1,2})")

# Regex for POS tag at start of english field: (POS) rest of text
POS_PATTERN = re.compile(r"^\(([^)]+)\)\s*(.+)")

# Batch size for upsert calls
BATCH_SIZE = 500


def parse_header_line(line: str) -> tuple[int, int, str] | None:
    """Parse a header line to extract book_id, lesson_id, and vocab_section.

    Args:
        line: A line from the TSV file.

    Returns:
        Tuple of (book_id, lesson_id, vocab_section) or None if not a header.
    """
    match = HEADER_PATTERN.match(line.strip())
    if not match:
        return None
    book_id = int(match.group(1))
    lesson_id = int(match.group(2))
    vocab_section = match.group(3)
    return (book_id, lesson_id, vocab_section)


def _is_proper_name(pinyin: str, english: str) -> bool:
    """Detect whether an entry without POS is a proper name.

    Heuristic: if pinyin contains capitalized syllables, it's a proper name.
    Entries with all-lowercase pinyin and lowercase/phrase-like english are not
    names. Language names (e.g., "French language") are excluded even if their
    pinyin is capitalized.

    Args:
        pinyin: The pinyin field from the TSV.
        english: The english field from the TSV.

    Returns:
        True if the entry is a proper name, False otherwise.
    """
    # Language names like 法文 (Fǎwén) have capitalized pinyin but are not names
    if english.lower().endswith(" language"):
        return False

    # Check if pinyin has any uppercase letter (proper nouns have capitalized pinyin)
    if any(c.isupper() for c in pinyin):
        return True
    return False


def parse_data_line(line: str) -> dict[str, Any] | None:
    """Parse a data line to extract vocabulary fields.

    Args:
        line: A tab-separated data line from the TSV file.

    Returns:
        Dictionary with vocabulary fields or None if not a valid data line.
    """
    if not line or not line.strip():
        return None

    # Skip header lines
    if line.startswith("//"):
        return None

    parts = line.strip().split("\t")
    if len(parts) < 3:
        return None

    traditional = parts[0].strip()
    pinyin = parts[1].strip()
    english_raw = parts[2].strip()

    # Try to extract POS tag
    pos_match = POS_PATTERN.match(english_raw)
    if pos_match:
        part_of_speech: str | None = pos_match.group(1)
        english = pos_match.group(2)
        is_name = False
    else:
        part_of_speech = None
        english = english_raw
        is_name = _is_proper_name(pinyin, english)

    return {
        "traditional": traditional,
        "pinyin": pinyin,
        "english": english,
        "part_of_speech": part_of_speech,
        "is_name": is_name,
    }


def parse_flashcard_tsv(file_path: str) -> list[dict[str, Any]]:
    """Parse the Flash-card.tsv file into vocabulary records.

    Args:
        file_path: Path to the Flash-card.tsv file.

    Returns:
        List of vocabulary dictionaries ready for database insertion.
    """
    rows: list[dict[str, Any]] = []
    current_book_id: int | None = None
    current_lesson_id: int | None = None
    current_section: str | None = None
    sort_order = 0

    with open(file_path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n\r")

            # Try to parse as header
            header = parse_header_line(line)
            if header is not None:
                current_book_id, current_lesson_id, current_section = header
                sort_order = 0
                logger.info(
                    "Section: Book %d, Lesson %d, Section %s",
                    current_book_id,
                    current_lesson_id,
                    current_section,
                )
                continue

            # Skip lines before first header
            if current_book_id is None:
                continue

            # Try to parse as data line
            data = parse_data_line(line)
            if data is None:
                continue

            sort_order += 1
            data["book_id"] = current_book_id
            data["lesson_id"] = current_lesson_id
            data["vocab_section"] = current_section
            data["sort_order"] = sort_order
            rows.append(data)

    return rows


def _deduplicate_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Remove duplicate rows by unique constraint key.

    When the TSV contains the same character twice in the same section
    (e.g., 工作 appearing as both verb and noun), keep the last occurrence.
    After deduplication, sort_order is renumbered per section group to
    eliminate gaps.

    Args:
        rows: List of vocabulary dictionaries.

    Returns:
        Deduplicated list preserving insertion order of last occurrences.
    """
    seen: dict[tuple[int, int, str, str], int] = {}
    result: list[dict[str, Any]] = []

    for row in rows:
        key = (
            row["book_id"],
            row["lesson_id"],
            row["vocab_section"],
            row["traditional"],
        )
        if key in seen:
            # Replace the earlier occurrence
            idx = seen[key]
            result[idx] = row
            logger.warning(
                "Duplicate entry: Book %d, L%02d-%s, %s — keeping later occurrence",
                key[0],
                key[1],
                key[2],
                key[3],
            )
        else:
            seen[key] = len(result)
            result.append(row)

    # Renumber sort_order per (book_id, lesson_id, vocab_section) group
    # to eliminate gaps left by deduplication
    group_counters: dict[tuple[int, int, str], int] = defaultdict(int)
    for row in result:
        group_key = (row["book_id"], row["lesson_id"], row["vocab_section"])
        group_counters[group_key] += 1
        row["sort_order"] = group_counters[group_key]

    return result


def seed_vocabulary(
    rows: list[dict[str, Any]],
    *,
    batch_size: int = BATCH_SIZE,
) -> None:
    """Upsert vocabulary rows into Supabase in batches.

    Deduplicates rows by unique constraint before upserting to avoid
    PostgreSQL errors when the same character appears twice in a section.

    Args:
        rows: List of vocabulary dictionaries to upsert.
        batch_size: Number of rows per upsert call.

    Raises:
        Exception: If a batch upsert fails.
    """
    if not rows:
        logger.info("No rows to seed.")
        return

    deduped = _deduplicate_rows(rows)
    if len(deduped) < len(rows):
        logger.info(
            "Deduplicated %d → %d rows (%d duplicates removed).",
            len(rows),
            len(deduped),
            len(rows) - len(deduped),
        )

    client = get_supabase_client()
    total = len(deduped)

    for i in range(0, total, batch_size):
        batch = deduped[i : i + batch_size]
        try:
            client.table("vocabulary").upsert(
                batch,
                on_conflict="book_id,lesson_id,vocab_section,traditional",
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

    logger.info("Seeding complete: %d total rows upserted.", total)


def _print_summary(rows: list[dict[str, Any]]) -> None:
    """Print a summary of parsed vocabulary items.

    Args:
        rows: List of parsed vocabulary dictionaries.
    """
    book_counts: dict[int, int] = {}

    for row in rows:
        book_id = row["book_id"]
        book_counts[book_id] = book_counts.get(book_id, 0) + 1

    print("\n=== Vocabulary Seeding Summary ===")  # noqa: T201
    print(f"Total items: {len(rows)}")  # noqa: T201
    for book_id in sorted(book_counts):
        print(f"  Book {book_id}: {book_counts[book_id]} items")  # noqa: T201

    name_count = sum(1 for r in rows if r["is_name"])
    pos_count = sum(1 for r in rows if r["part_of_speech"] is not None)
    no_pos_no_name = sum(
        1 for r in rows if r["part_of_speech"] is None and not r["is_name"]
    )
    print(f"  With POS tag: {pos_count}")  # noqa: T201
    print(f"  Names: {name_count}")  # noqa: T201
    print(f"  Phrases (no POS, not name): {no_pos_no_name}")  # noqa: T201

    print("=================================\n")  # noqa: T201


def main() -> None:
    """Run the vocabulary seeding script."""
    parser = argparse.ArgumentParser(
        description="Seed vocabulary table from Flash-card.tsv"
    )
    parser.add_argument(
        "--file",
        default="dangdai-rag/Flash-card.tsv",
        help="Path to Flash-card.tsv (default: dangdai-rag/Flash-card.tsv)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate without inserting into database",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Parsing %s...", args.file)
    rows = parse_flashcard_tsv(args.file)

    _print_summary(rows)

    if args.dry_run:
        logger.info("Dry run complete. No data inserted.")
        return

    logger.info("Seeding %d vocabulary items...", len(rows))
    seed_vocabulary(rows)
    logger.info("Done!")


if __name__ == "__main__":
    # Allow running from project root: python -m src.scripts.seed_vocabulary
    # or directly: python src/scripts/seed_vocabulary.py
    sys.path.insert(0, ".")
    main()
