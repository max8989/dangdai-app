# Story 11.1: Vocabulary Seeding from Flash-card.tsv

Status: ready-for-dev

## Story

As a developer,
I want to parse Flash-card.tsv and populate the `vocabulary` table for Books 1-4,
So that quiz generation has accurate vocabulary data for all chapters.

## Acceptance Criteria

1. **Given** the `vocabulary` table exists (created by Story 1.10)
   **When** I run the vocabulary seeding script with `dangdai-rag/Flash-card.tsv` as input
   **Then** all vocabulary items for Books 1-4 are inserted (~3,000+ items across 4,127 TSV lines)

2. **Given** a header line like `//當代中文/Book 1/L01-I` or `//當代中文/Book 3/L07-II`
   **When** the parser encounters it
   **Then** it sets `book_id`, `lesson_id`, and `vocab_section` ('I' or 'II') for all subsequent data lines until the next header

3. **Given** a data line like `好	hǎo	(Vs) fine, well`
   **When** the parser processes it
   **Then** it extracts `traditional='好'`, `pinyin='hǎo'`, `part_of_speech='Vs'`, `english='fine, well'`

4. **Given** an entry without a POS tag in the english field (e.g., `陳月美	Chén Yuèměi	a woman from Vietnam`)
   **When** the parser processes it
   **Then** `is_name` is set to `true` and `part_of_speech` is `null`

5. **Given** `sort_order` is assigned per item
   **When** the seeding completes
   **Then** `sort_order` preserves the original ordering within each (book_id, lesson_id, vocab_section) group, starting from 1

6. **Given** the seeding script is run multiple times
   **When** duplicate entries are encountered
   **Then** no duplicates are created (idempotent via upsert on the UNIQUE constraint)

7. **Given** seeding completes successfully
   **When** I run `SELECT book_id, COUNT(*) FROM vocabulary GROUP BY book_id ORDER BY book_id`
   **Then** the counts match expected values (~568 Book 1, ~658 Book 2, ~850 Book 3, ~997 Book 4)

## Tasks / Subtasks

- [ ] Task 1: Create TSV parser module (AC: #2, #3, #4, #5)
  - [ ] 1.1 Create `dangdai-api/src/scripts/seed_vocabulary.py` with a `parse_flashcard_tsv(file_path: str) -> list[dict]` function
  - [ ] 1.2 Parse header lines with regex `r"^//當代中文/Book (\d+)/L(\d+)-(I{1,2})"` to extract book_id, lesson_id, vocab_section
  - [ ] 1.3 Parse data lines: split by tab into `[traditional, pinyin, english]`
  - [ ] 1.4 Extract POS from english field using regex `r"^\(([^)]+)\)\s*(.+)"` — set `part_of_speech` and strip POS from english text
  - [ ] 1.5 Detect proper names: entries with no POS tag whose english text does not start with `(` → set `is_name=True`
  - [ ] 1.6 Assign `sort_order` as sequential counter per (book_id, lesson_id, vocab_section), resetting to 1 on each new section
  - [ ] 1.7 Handle edge cases: multi-POS entries like `(N/V)`, variant characters like `臺灣/台灣`, alternate pinyin like `zhè / zhèi`

- [ ] Task 2: Create Supabase upsert logic (AC: #1, #6)
  - [ ] 2.1 Use `get_supabase_client()` from `src.utils.supabase` (service key bypasses RLS)
  - [ ] 2.2 Batch upsert rows using `.upsert()` with `on_conflict='book_id,lesson_id,vocab_section,sort_order'` matching the UNIQUE constraint added in Story 1.10 code review
  - [ ] 2.3 Use batch size of 500 rows per upsert call to avoid payload limits
  - [ ] 2.4 Log progress: header transitions, batch counts, total inserted

- [ ] Task 3: Create CLI entry point (AC: #1)
  - [ ] 3.1 Add `if __name__ == "__main__":` block accepting optional `--file` argument (default: `dangdai-rag/Flash-card.tsv`)
  - [ ] 3.2 Add `--dry-run` flag that parses and validates without inserting
  - [ ] 3.3 Print summary on completion: total items per book, any warnings

- [ ] Task 4: Write unit tests (AC: #2, #3, #4, #5, #6)
  - [ ] 4.1 Create `dangdai-api/tests/unit_tests/test_seed_vocabulary.py`
  - [ ] 4.2 Test header parsing: all header variants (Book 1-4, L01-L15, I and II)
  - [ ] 4.3 Test data line parsing: standard POS, multi-POS (`N/V`), no POS (names), phrases without POS
  - [ ] 4.4 Test sort_order reset on new section
  - [ ] 4.5 Test edge cases: variant characters, alternate pinyin, entries with apostrophes in english
  - [ ] 4.6 Test full parse of a representative TSV excerpt (10-20 lines covering headers + data)

- [ ] Task 5: Run seeding and verify (AC: #7)
  - [ ] 5.1 Run the script against the real `dangdai-rag/Flash-card.tsv`
  - [ ] 5.2 Verify counts: `SELECT book_id, COUNT(*) FROM vocabulary GROUP BY book_id ORDER BY book_id`
  - [ ] 5.3 Spot-check data: verify first and last entries for each book
  - [ ] 5.4 Verify idempotency: run again and confirm no duplicates or errors
  - [ ] 5.5 Run `make test` to ensure no regressions

## Dev Notes

### TSV File Format

The source file `dangdai-rag/Flash-card.tsv` has 4,127 lines with two line types:

**Header lines** — mark the start of a vocab section:
```
//當代中文/Book 1/L01-I\t\t
//當代中文/Book 3/L07-II\t\t
```
- Regex: `r"^//當代中文/Book (\d+)/L(\d+)-(I{1,2})"`
- 256 total headers across Books 1-4
- Books 1-2: lessons L01-L15; Books 3-4: lessons L01-L12
- Each lesson has two sections: I and II

**Data lines** — tab-separated vocabulary entries:
```
traditional\tpinyin\tenglish
```

### POS Tag Extraction Rules

The `english` column may start with a parenthesized POS tag:

| Pattern | Example | part_of_speech | english (cleaned) |
|---------|---------|----------------|--------------------|
| `(N) teacher` | `老師` | `N` | `teacher` |
| `(V) to come` | `來` | `V` | `to come` |
| `(Vs) pretty` | `漂亮` | `Vs` | `pretty` |
| `(N/V) combination; to combine` | `組合` | `N/V` | `combination; to combine` |
| `(V-sep) to take a photo` | `照相` | `V-sep` | `to take a photo` |
| `(Vs-pred) many` | `多` | `Vs-pred` | `many` |
| `a woman from Vietnam` | `陳月美` | `null` | `a woman from Vietnam` |
| `Taiwan` | `臺灣/台灣` | `null` | `Taiwan` |

**POS tags found in the file:** N, V, Vi, Vs, Vst, Vaux, V-sep, Vs-pred, Vp, Vpt, Adv, Det, Ptc, M, Conj, Prep, Ph, Id, RE, N/V, V/N, Vs/N, and others.

**Name detection heuristic:** If no POS tag is present AND the entry appears in section context where names typically appear (first few entries of a lesson's section I), set `is_name=True`. A simpler approach: if no POS tag and the pinyin contains capital letters (indicating a proper noun), mark as `is_name=True`. Entries like `臺灣/台灣 → Taiwan` or `日本 → Japan` are place names, also `is_name=True`. Entries like `請問 → May I ask you...` or `對不起 → I'm sorry` are phrases without POS, NOT names — set `is_name=False`.

**Recommended name detection:** If no POS tag:
- If pinyin has capitalized syllables beyond the first character position (e.g., `Chén Yuèměi`, `Táiwān`, `Rìběn`) → `is_name=True`
- If english field starts with lowercase or is a common phrase → `is_name=False`
- This handles names (`陳月美`), place names (`臺灣/台灣`, `日本`), and properly excludes phrases (`請問`, `對不起`, `不客氣`)

### Vocabulary Table Schema (from Story 1.10)

```sql
CREATE TABLE public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    vocab_section TEXT NOT NULL CHECK (vocab_section IN ('I', 'II')),
    traditional TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    english TEXT NOT NULL,
    part_of_speech TEXT,            -- nullable
    is_name BOOLEAN DEFAULT FALSE NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Uniqueness constraint** (added in Story 1.10 code review):
```sql
UNIQUE (book_id, lesson_id, vocab_section, sort_order)
```

**RLS:** Read-only for authenticated users. Seeding uses the service key client which bypasses RLS.

**Indexes:** `idx_vocabulary_book_lesson(book_id, lesson_id)`, `idx_vocabulary_traditional(traditional)`

### Supabase Client Pattern

```python
from src.utils.supabase import get_supabase_client

client = get_supabase_client()  # Uses SUPABASE_SERVICE_KEY — bypasses RLS
response = client.table("vocabulary").upsert(
    rows,
    on_conflict="book_id,lesson_id,vocab_section,sort_order"
).execute()
```

The client is a singleton via `@lru_cache(maxsize=1)` in `src/utils/supabase.py`. It requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables (loaded from `.env` via `dotenv`).

### File Location and Naming

- **Script:** `dangdai-api/src/scripts/seed_vocabulary.py` — new directory `scripts/` under `src/`
- **Tests:** `dangdai-api/tests/unit_tests/test_seed_vocabulary.py`
- Follow Python naming conventions: `snake_case` functions, `PascalCase` classes, Google-style docstrings

Create `dangdai-api/src/scripts/__init__.py` (empty) so the module is importable.

### Testing Pattern

Unit tests use `pytest` with mocking. For the parser tests, no mocking needed — test pure functions with string input. For the upsert tests, mock `get_supabase_client`.

```python
# Example test structure
def test_parse_header_line():
    """Parse header line extracts book, lesson, section."""
    ...

def test_parse_data_line_with_pos():
    """Parse data line with POS tag extracts part_of_speech."""
    ...

def test_parse_data_line_name():
    """Parse data line without POS tag for proper noun sets is_name."""
    ...
```

Run tests: `cd dangdai-api && python -m pytest tests/unit_tests/test_seed_vocabulary.py -v`

### Linting Requirements

The script must pass:
- `ruff check src/scripts/` — no lint errors
- `ruff format --check src/scripts/` — properly formatted
- `mypy --strict src/scripts/` — strict type checking

### Anti-Patterns to Avoid

- **DO NOT** create a separate database migration — the `vocabulary` table already exists from Story 1.10
- **DO NOT** insert row by row — use batch upsert (500 rows per batch)
- **DO NOT** use the anon key — use the service key client for seeding (bypasses RLS)
- **DO NOT** hardcode the file path — accept it as a CLI argument with a sensible default
- **DO NOT** ignore entries with variant characters (e.g., `臺灣/台灣`) — store them as-is in the `traditional` column
- **DO NOT** create a FastAPI endpoint for seeding — this is a standalone CLI script
- **DO NOT** add `seed_vocabulary.py` imports to any existing module — it runs standalone

### Expected Counts Per Book (Approximate)

| Book | Lessons | Header Lines | Data Lines | Vocab Items |
|------|---------|-------------|------------|-------------|
| 1    | 15      | 30          | ~568       | ~568        |
| 2    | 15      | 30          | ~658       | ~658        |
| 3    | 12      | 24          | ~850       | ~850        |
| 4    | 12      | 24+         | ~997       | ~997        |

Total: ~3,073 vocabulary items across 4 books.

### Project Structure Notes

- New directory: `dangdai-api/src/scripts/` — for seeding and data pipeline scripts (used by Epic 11 stories)
- New file: `dangdai-api/src/scripts/__init__.py` — empty init file
- New file: `dangdai-api/src/scripts/seed_vocabulary.py` — the seeding script
- New file: `dangdai-api/tests/unit_tests/test_seed_vocabulary.py` — unit tests
- No changes to existing files required
- Script location aligns with the repository pattern: `src/` for source, `tests/` for tests

### References

- [Source: epics.md#Story-11.1] — Story requirements and acceptance criteria
- [Source: 1-10-create-structured-content-tables.md] — Vocabulary table schema, uniqueness constraints, RLS policies
- [Source: architecture.md#Data-Architecture] — Structured content table design
- [Source: dangdai-rag/Flash-card.tsv] — Source vocabulary data (4,127 lines, Books 1-4)
- [Source: dangdai-api/src/utils/supabase.py] — Supabase service key client singleton
- [Source: dangdai-api/src/utils/config.py] — Settings with SUPABASE_URL, SUPABASE_SERVICE_KEY

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
