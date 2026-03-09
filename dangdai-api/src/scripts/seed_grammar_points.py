"""Seed grammar_points table from textbook chunk files.

Parse grammar-section chunks from book{1-4}_chunks.json, use an LLM
to extract structured grammar points from OCR'd content, and populate
the grammar_points table in Supabase.
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

# Extraction prompt for LLM
EXTRACTION_PROMPT = """You are a Chinese language textbook expert. Extract ALL grammar points from this textbook chunk.

The chunk is from Book {book_id}, Lesson {lesson_id} of 當代中文課程 (A Course in Contemporary Chinese).

Return a JSON array where each grammar point has these fields:
- "title_english": (string, REQUIRED) English title of the grammar point (e.g., "A-not-A Questions", "The Particle 呢")
- "title_chinese": (string or null) Chinese title if present (e.g., "正反問句")
- "function_description": (string or null) What this grammar point does — look for text after "Function:" or "功能:"
- "structure_pattern": (string or null) The grammatical pattern/structure — look for text after "Structures:" or "結構:"
- "usage_notes": (string or null) Usage notes, constraints, or special cases — look for text after "Usage:" or "用法:"
- "examples": (array of objects) Example sentences, each with:
  - "traditional": Chinese text in traditional characters
  - "pinyin": Pinyin romanization
  - "english": English translation

IMPORTANT RULES:
1. Each numbered section (I., II., III., etc.) is typically ONE grammar point
2. Sub-sections (A., B., C.) under a numbered section are part of the SAME grammar point — combine them
3. Clean up OCR noise: fix garbled characters, missing tones, stray formatting artifacts
4. Extract ALL examples you can find for each grammar point
5. If a grammar point has sub-patterns (e.g., affirmative and negative forms), include them all in structure_pattern
6. Return ONLY the JSON array, no other text

Chunk content:
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


def filter_grammar_chunks(
    chunks: list[dict[str, Any]],
    *,
    book_id: int | None = None,
) -> list[dict[str, Any]]:
    """Filter chunks to only grammar-section chunks.

    Args:
        chunks: List of all chunk dictionaries.
        book_id: Optional book ID to filter by.

    Returns:
        List of grammar-section chunks only.
    """
    result = []
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        if metadata.get("section") != "grammar":
            continue
        if book_id is not None and metadata.get("book") != book_id:
            continue
        result.append(chunk)
    return result


def validate_grammar_point(point: dict[str, Any]) -> bool:
    """Validate a grammar point has required fields.

    Args:
        point: Grammar point dictionary to validate.

    Returns:
        True if the grammar point is valid, False otherwise.
    """
    title = point.get("title_english")
    if not title or not isinstance(title, str) or not title.strip():
        return False

    examples = point.get("examples")
    if examples is not None and not isinstance(examples, list):
        return False

    return True


def extract_grammar_points_llm(
    chunk: dict[str, Any],
    *,
    llm: Any = None,
) -> list[dict[str, Any]]:
    """Extract grammar points from a chunk using LLM.

    Args:
        chunk: Grammar chunk dictionary with content and metadata.
        llm: LangChain chat model instance. If None, creates one.

    Returns:
        List of extracted grammar point dictionaries.
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
            # Remove markdown code block markers
            lines = json_text.split("\n")
            # Remove first line (```json or ```) and last line (```)
            lines = [line for line in lines if not line.strip().startswith("```")]
            json_text = "\n".join(lines)

        points = json.loads(json_text)

        if not isinstance(points, list):
            logger.warning(
                "LLM returned non-list for Book %d Lesson %d, wrapping in list",
                metadata["book"],
                metadata["lesson"],
            )
            points = [points]

        # Validate each point
        valid_points = []
        for point in points:
            if validate_grammar_point(point):
                # Ensure examples defaults to empty list
                if "examples" not in point or point["examples"] is None:
                    point["examples"] = []
                valid_points.append(point)
            else:
                logger.warning(
                    "Invalid grammar point skipped for Book %d Lesson %d: %s",
                    metadata["book"],
                    metadata["lesson"],
                    point.get("title_english", "<no title>"),
                )

        return valid_points

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


def assign_grammar_order(
    points: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Assign grammar_order and sort_order to grammar points.

    Grammar order is sequential per (book_id, lesson_id) group,
    starting at 1 for each lesson.

    Args:
        points: List of grammar point dictionaries with book_id and lesson_id.

    Returns:
        Same list with grammar_order and sort_order assigned.
    """
    if not points:
        return []

    counters: dict[tuple[int, int], int] = defaultdict(int)

    for point in points:
        key = (point["book_id"], point["lesson_id"])
        counters[key] += 1
        point["grammar_order"] = counters[key]
        point["sort_order"] = counters[key]

    return points


def seed_grammar_points(
    rows: list[dict[str, Any]],
    *,
    batch_size: int = BATCH_SIZE,
) -> None:
    """Upsert grammar point rows into Supabase in batches.

    Args:
        rows: List of grammar point dictionaries to upsert.
        batch_size: Number of rows per upsert call.

    Raises:
        Exception: If a batch upsert fails.
    """
    if not rows:
        logger.info("No grammar points to seed.")
        return

    client = get_supabase_client()
    total = len(rows)

    for i in range(0, total, batch_size):
        batch = rows[i : i + batch_size]
        try:
            client.table("grammar_points").upsert(
                batch,
                on_conflict="book_id,lesson_id,grammar_order",
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

    logger.info("Seeding complete: %d total grammar points upserted.", total)


def process_chunks(
    chunks_dir: str,
    *,
    book_id: int | None = None,
    dry_run: bool = False,
    use_pdf: bool = False,
) -> list[dict[str, Any]]:
    """Process chunk files and extract grammar points.

    Args:
        chunks_dir: Directory containing book{1-4}_chunks.json files.
        book_id: Optional single book to process.
        dry_run: If True, parse and validate without inserting.
        use_pdf: If True, supplement with PDF extraction for low-quality chunks.

    Returns:
        List of grammar point dictionaries ready for database insertion.
    """
    from src.utils.llm_factory import get_llm

    chunks_path = Path(chunks_dir)
    all_points: list[dict[str, Any]] = []

    # Determine which books to process
    if book_id is not None:
        book_ids = [book_id]
    else:
        book_ids = [1, 2, 3, 4]

    # Create LLM instance once for all extractions
    llm = get_llm(temperature=0.0, max_tokens=4096)

    for bid in book_ids:
        chunk_file = chunks_path / f"book{bid}_chunks.json"
        if not chunk_file.exists():
            logger.warning("Chunk file not found: %s", chunk_file)
            continue

        logger.info("Loading chunks from %s...", chunk_file)
        chunks = load_chunks(str(chunk_file))
        grammar_chunks = filter_grammar_chunks(chunks, book_id=bid)
        logger.info(
            "Book %d: %d grammar chunks found (of %d total)",
            bid,
            len(grammar_chunks),
            len(chunks),
        )

        # Sort chunks by lesson and page range for consistent ordering
        grammar_chunks.sort(
            key=lambda c: (
                c["metadata"].get("lesson", 0) or 0,
                c["metadata"].get("page_range", "0"),
            )
        )

        # Group chunks by lesson (some lessons have multiple grammar chunks)
        lesson_chunks: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for chunk in grammar_chunks:
            lesson = chunk["metadata"].get("lesson")
            if lesson is not None:
                lesson_chunks[lesson].append(chunk)

        for lesson_id in sorted(lesson_chunks.keys()):
            chunks_for_lesson = lesson_chunks[lesson_id]
            lesson_points: list[dict[str, Any]] = []

            for chunk in chunks_for_lesson:
                quality = chunk["metadata"].get("content_quality", 1.0)

                if use_pdf and quality < 0.85:
                    logger.warning(
                        "Book %d Lesson %d: Low quality (%.2f), "
                        "PDF fallback requested but not implemented",
                        bid,
                        lesson_id,
                        quality,
                    )

                logger.info(
                    "Extracting grammar points: Book %d, Lesson %d "
                    "(quality: %.2f, pages: %s)...",
                    bid,
                    lesson_id,
                    quality,
                    chunk["metadata"].get("page_range", "?"),
                )

                if not dry_run:
                    points = extract_grammar_points_llm(chunk, llm=llm)
                    for point in points:
                        point["book_id"] = bid
                        point["lesson_id"] = lesson_id
                    lesson_points.extend(points)

                    # Rate limiting between LLM calls
                    time.sleep(LLM_RATE_LIMIT_DELAY)
                else:
                    logger.info(
                        "  [DRY RUN] Would extract from chunk (pages %s, %d chars)",
                        chunk["metadata"].get("page_range", "?"),
                        len(chunk.get("content", "")),
                    )

            if lesson_points:
                all_points.extend(lesson_points)
                logger.info(
                    "Book %d Lesson %d: %d grammar points extracted",
                    bid,
                    lesson_id,
                    len(lesson_points),
                )

    # Assign grammar_order and sort_order
    if all_points:
        all_points = assign_grammar_order(all_points)

    return all_points


def _print_summary(rows: list[dict[str, Any]]) -> None:
    """Print a summary of extracted grammar points.

    Args:
        rows: List of grammar point dictionaries.
    """
    book_lesson_counts: dict[int, dict[int, int]] = defaultdict(
        lambda: defaultdict(int)
    )

    for row in rows:
        book_lesson_counts[row["book_id"]][row["lesson_id"]] += 1

    print("\n=== Grammar Points Seeding Summary ===")  # noqa: T201
    print(f"Total grammar points: {len(rows)}")  # noqa: T201

    for bid in sorted(book_lesson_counts):
        lessons = book_lesson_counts[bid]
        total = sum(lessons.values())
        print(f"\n  Book {bid}: {total} points across {len(lessons)} lessons")  # noqa: T201
        for lid in sorted(lessons):
            print(f"    Lesson {lid:2d}: {lessons[lid]} points")  # noqa: T201

    # Quality warnings
    low_count_lessons = []
    for bid in sorted(book_lesson_counts):
        for lid in sorted(book_lesson_counts[bid]):
            count = book_lesson_counts[bid][lid]
            if count < 2:
                low_count_lessons.append((bid, lid, count))

    if low_count_lessons:
        print("\n  ⚠ Low grammar point count (< 2):")  # noqa: T201
        for bid, lid, count in low_count_lessons:
            print(f"    Book {bid} Lesson {lid}: {count} points")  # noqa: T201

    print("======================================\n")  # noqa: T201


def main() -> None:
    """Run the grammar points seeding script."""
    parser = argparse.ArgumentParser(
        description="Seed grammar_points table from textbook chunk files"
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
    parser.add_argument(
        "--use-pdf",
        action="store_true",
        help="Supplement with PDF extraction for low-quality chunks",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Processing grammar chunks from %s...", args.chunks_dir)

    rows = process_chunks(
        args.chunks_dir,
        book_id=args.book,
        dry_run=args.dry_run,
        use_pdf=args.use_pdf,
    )

    if rows:
        _print_summary(rows)

    if args.dry_run:
        logger.info("Dry run complete. No data inserted.")
        return

    if not rows:
        logger.warning("No grammar points extracted. Nothing to seed.")
        return

    logger.info("Seeding %d grammar points...", len(rows))
    seed_grammar_points(rows)
    logger.info("Done!")


if __name__ == "__main__":
    # Allow running from project root: python -m src.scripts.seed_grammar_points
    # or directly: python src/scripts/seed_grammar_points.py
    sys.path.insert(0, ".")

    # Set default LLM provider for extraction if not set
    if not os.getenv("LLM_PROVIDER"):
        os.environ["LLM_PROVIDER"] = "openai"
    if not os.getenv("LLM_MODEL"):
        os.environ["LLM_MODEL"] = "gpt-4o-mini"

    main()
