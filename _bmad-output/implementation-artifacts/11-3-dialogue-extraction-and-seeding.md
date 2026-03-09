# Story 11.3: Dialogue Extraction and Seeding

Status: ready-for-dev

## Story

As a developer,
I want to extract dialogues from textbook chunks and/or PDFs and populate the `dialogues` table for Books 1-4,
So that reading comprehension and dialogue completion exercises have accurate dialogue content.

## Acceptance Criteria

1. **Given** the `dialogues` table exists (Story 1.10)
   **When** I run the dialogue extraction script
   **Then** dialogues are extracted for all 54 lessons

2. **Given** each lesson has Dialogue I and Dialogue II
   **When** extraction completes
   **Then** each lesson has typically 2 dialogues (`dialogue_number` = 1 and 2)

3. **Given** a dialogue is extracted
   **When** I check its `lines` JSONB
   **Then** each line has: `{ speaker, traditional, simplified, pinyin, english }`

4. **Given** a dialogue is extracted
   **When** I check its metadata
   **Then** `title_traditional` and `title_english` are set

5. **Given** the script is run multiple times
   **When** duplicate entries are encountered
   **Then** no duplicates are created (idempotent via upsert on UNIQUE constraint)

6. **Given** seeding completes
   **When** I run `SELECT book_id, lesson_id, COUNT(*) FROM dialogues GROUP BY book_id, lesson_id ORDER BY book_id, lesson_id`
   **Then** all 54 lessons have dialogue coverage

## Tasks / Subtasks

- [ ] Task 1: Create dialogue chunk parser (AC: #1, #2)
  - [ ] 1.1 Create `dangdai-api/src/scripts/seed_dialogues.py`
  - [ ] 1.2 Load `book{1-4}_chunks.json` and filter chunks where `metadata.section == 'dialogue'`
  - [ ] 1.3 Note: Book 1 has only 12 dialogue chunks (not all lessons have dedicated dialogue sections in chunks). Use learning_objectives and vocabulary chunks as supplementary sources, or PDF extraction for missing lessons.

- [ ] Task 2: Implement LLM-assisted extraction (AC: #3, #4)
  - [ ] 2.1 Use LLM to parse dialogue chunk content into structured `lines` JSONB format
  - [ ] 2.2 Prompt must produce: `{ speaker, traditional, simplified, pinyin, english }` per line
  - [ ] 2.3 The LLM should convert traditional to simplified characters (the chunks only have traditional)
  - [ ] 2.4 Set `title_traditional` and `title_english` from chunk topic/content headers
  - [ ] 2.5 Determine `dialogue_number` (1 or 2) from content markers ("Dialogue I", "Dialogue II", "對話一", "對話二")

- [ ] Task 3: PDF fallback extraction (AC: #1)
  - [ ] 3.1 For lessons missing dialogue chunks, extract from PDFs at `/home/maxime/Documents/NTNU Book/`
  - [ ] 3.2 Use PDF parsing (PyMuPDF/pymupdf4llm) to extract dialogue pages
  - [ ] 3.3 Use LLM to structure extracted PDF text into dialogue lines format

- [ ] Task 4: Create Supabase upsert logic (AC: #5)
  - [ ] 4.1 Use `get_supabase_client()` (service key bypasses RLS)
  - [ ] 4.2 Upsert on UNIQUE constraint `(book_id, lesson_id, dialogue_number)`
  - [ ] 4.3 Log progress per book/lesson

- [ ] Task 5: Create CLI entry point (AC: #1)
  - [ ] 5.1 Add `if __name__ == "__main__":` with `--chunks-dir`, `--pdf-dir`, `--book`, `--dry-run` flags
  - [ ] 5.2 Print summary: dialogues per book, lines per dialogue, missing lessons

- [ ] Task 6: Write unit tests (AC: #3, #4)
  - [ ] 6.1 Create `dangdai-api/tests/unit_tests/test_seed_dialogues.py`
  - [ ] 6.2 Test dialogue line extraction from sample chunk content
  - [ ] 6.3 Test dialogue_number detection from content markers
  - [ ] 6.4 Test title extraction
  - [ ] 6.5 Test lines JSONB schema validation

- [ ] Task 7: Run seeding and verify (AC: #6)
  - [ ] 7.1 Run against real data
  - [ ] 7.2 Verify all 54 lessons have dialogues
  - [ ] 7.3 Spot-check: Book 1 Lesson 1 dialogue lines match known content
  - [ ] 7.4 Verify idempotency
  - [ ] 7.5 Run `make test`

## Dev Notes

### Source Data

**Chunk files:** `dangdai-rag/output_chunks/book{1-4}_chunks.json`

Dialogue chunks have `metadata.section == 'dialogue'`. Book 1 has 12 dialogue-section chunks. The content is OCR'd and contains mixed traditional Chinese, pinyin, and English with formatting noise.

**Sample dialogue chunk content:**
```
寺話二 Dialogue II
明華：田中，歡迎！歡迎！請進。
      Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.
田中：謝謝。
      Xièxie.
明華：田中，這是我媽媽。
      Tiánzhōng, zhè shì wǒ māma.
```

### Dialogues Table Schema (from Story 1.10)

```sql
CREATE TABLE public.dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    dialogue_number INTEGER NOT NULL CHECK (dialogue_number IN (1, 2)),
    title_traditional TEXT,
    title_english TEXT,
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**UNIQUE constraint:** `UNIQUE (book_id, lesson_id, dialogue_number)`

**Lines JSONB format:**
```json
[
  {"speaker": "明華", "traditional": "田中，歡迎！歡迎！請進。", "simplified": "田中，欢迎！欢迎！请进。", "pinyin": "Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.", "english": "Tanaka, welcome! Welcome! Please come in."},
  {"speaker": "田中", "traditional": "謝謝。", "simplified": "谢谢。", "pinyin": "Xièxie.", "english": "Thank you."}
]
```

### LLM Extraction Prompt Strategy

```python
EXTRACTION_PROMPT = """
Extract dialogues from this textbook page content. Return JSON:
{
  "title_traditional": "對話一",
  "title_english": "Dialogue I",
  "lines": [
    {
      "speaker": "speaker name in Chinese",
      "traditional": "traditional Chinese text",
      "simplified": "simplified Chinese text",
      "pinyin": "pinyin with tone marks",
      "english": "English translation"
    }
  ]
}

Content:
{content}
"""
```

### Expected Counts

| Book | Lessons | Expected Dialogues |
|------|---------|-------------------|
| 1    | 15      | ~30 (2 per lesson) |
| 2    | 15      | ~30 |
| 3    | 12      | ~24 |
| 4    | 12      | ~24 |

Total: ~108 dialogues

### File Location

- **Script:** `dangdai-api/src/scripts/seed_dialogues.py`
- **Tests:** `dangdai-api/tests/unit_tests/test_seed_dialogues.py`

### Dependencies

- **Depends on:** Story 1.10 (dialogues table), Story 11.1 (creates `src/scripts/` directory)
- **Blocks:** Story 11.7 (dialogue browse screen), Story 4.14 (quiz gen needs dialogue data)

### Anti-Patterns to Avoid

- **DO NOT** skip simplified Chinese — the LLM must convert traditional to simplified for each line
- **DO NOT** store raw OCR text — only structured, cleaned dialogue lines
- **DO NOT** assume all lessons have dialogue chunks — some may need PDF extraction
- **DO NOT** hardcode speaker names — extract from content dynamically
- **DO NOT** merge Dialogue I and II into a single record — each is a separate row

### References

- [Source: epics.md#Story-11.3] — Story requirements
- [Source: 1-10-create-structured-content-tables.md] — Dialogues table schema and JSONB format
- [Source: architecture.md#Data-Architecture] — Dialogue schema and seeding sources
- [Source: dangdai-rag/output_chunks/book1_chunks.json] — Sample dialogue chunk format

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
