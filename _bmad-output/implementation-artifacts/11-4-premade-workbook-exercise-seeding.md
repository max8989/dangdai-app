# Story 11.4: Premade Workbook Exercise Seeding

Status: ready-for-dev

## Story

As a developer,
I want to restructure workbook chunks into proper exercise format and populate the `premade_exercises` table for Books 1-4,
So that users can complete workbook exercises directly without LLM generation.

## Acceptance Criteria

1. **Given** the `premade_exercises` table exists (Story 1.10)
   **When** I run the exercise restructuring script with `dangdai-rag/output_chunks/workbook{1-4}_chunks.json` as input
   **Then** workbook chunks are restructured into exercise format with `content` JSONB

2. **Given** the `content` JSONB is set
   **When** I check it by exercise type
   **Then** it matches the type-specific schemas:
   - Fill-in-the-blank: `{ sentences: [{ text_with_blanks, word_bank, correct_answers }] }`
   - Matching / Dialogue completion: `{ pairs: [{ prompt, response }] }`
   - Sentence construction: `{ sentences: [{ scrambled_words, correct_order }] }`
   - Reading comprehension: `{ passage, questions: [{ question, options, correct_answer }] }`
   - Listening (converted to reading): `{ sentences: [{ pinyin, expected_chinese }] }`
   - Composition: `{ prompt, word_count, suggested_vocabulary }` `

3. **Given** `exercise_type` is set
   **When** I check the values
   **Then** they match the CHECK constraint: `listening`, `reading`, `fill_in_blank`, `dialogue_completion`, `sentence_construction`, `matching`, `character_writing`, `composition`, `pronunciation`

4. **Given** `exercise_order` is assigned
   **When** I check ordering
   **Then** it preserves the original order within each lesson

5. **Given** exercises that are too ambiguous or require audio
   **When** they are processed
   **Then** they are flagged for manual review (logged as warnings, still inserted with a flag)

6. **Given** the script is run multiple times
   **When** duplicate entries are encountered
   **Then** no duplicates are created (idempotent)

7. **Given** seeding completes
   **When** I run `SELECT book_id, lesson_id, exercise_type, COUNT(*) FROM premade_exercises GROUP BY book_id, lesson_id, exercise_type`
   **Then** coverage is shown across all books and lessons

## Tasks / Subtasks

- [ ] Task 1: Create workbook chunk parser (AC: #1, #3)
  - [ ] 1.1 Create `dangdai-api/src/scripts/seed_premade_exercises.py`
  - [ ] 1.2 Load `workbook{1-4}_chunks.json` and group by book/lesson
  - [ ] 1.3 Map chunk `metadata.exercise_type` to premade_exercises `exercise_type` — the chunk metadata already classifies exercises
  - [ ] 1.4 Filter out non-exercise chunks (`lesson_intro`, `null` section)

- [ ] Task 2: Implement LLM-assisted content restructuring (AC: #2)
  - [ ] 2.1 For each exercise chunk, use LLM to restructure OCR'd content into the appropriate JSONB schema
  - [ ] 2.2 Create type-specific prompts for each exercise type (fill_in_blank, matching, etc.)
  - [ ] 2.3 Validate LLM output against the expected JSONB schema for the exercise type
  - [ ] 2.4 Handle `listening` type: convert to reading format since app has no audio (`{ sentences: [{ pinyin, expected_chinese }] }`)
  - [ ] 2.5 Set `title` from chunk content or metadata, `instructions` from exercise header text

- [ ] Task 3: Flag ambiguous exercises (AC: #5)
  - [ ] 3.1 Log warnings for exercises where LLM extraction confidence is low
  - [ ] 3.2 Set `difficulty` to `null` for flagged exercises (signals manual review needed)
  - [ ] 3.3 Still insert flagged exercises — they can be reviewed and corrected later
  - [ ] 3.4 Set `source_page_range` from chunk `metadata.page_range`

- [ ] Task 4: Create Supabase upsert logic (AC: #4, #6)
  - [ ] 4.1 Use `get_supabase_client()` (service key)
  - [ ] 4.2 Upsert on UNIQUE constraint `(book_id, lesson_id, exercise_type, exercise_order)`
  - [ ] 4.3 Assign `exercise_order` sequentially per (book_id, lesson_id) across all exercise types
  - [ ] 4.4 Batch upsert in groups of 100

- [ ] Task 5: Create CLI entry point (AC: #1)
  - [ ] 5.1 `if __name__ == "__main__":` with `--chunks-dir`, `--book`, `--dry-run` flags
  - [ ] 5.2 Print summary: exercises per book per lesson per type, flagged count

- [ ] Task 6: Write unit tests (AC: #2, #3)
  - [ ] 6.1 Create `dangdai-api/tests/unit_tests/test_seed_premade_exercises.py`
  - [ ] 6.2 Test exercise type mapping from chunk metadata
  - [ ] 6.3 Test JSONB schema validation for each exercise type
  - [ ] 6.4 Test non-exercise chunk filtering
  - [ ] 6.5 Test exercise_order assignment

- [ ] Task 7: Run seeding and verify (AC: #7)
  - [ ] 7.1 Run against real workbook chunk files
  - [ ] 7.2 Verify coverage query
  - [ ] 7.3 Spot-check content JSONB for sample exercises
  - [ ] 7.4 Verify idempotency
  - [ ] 7.5 Run `make test`

## Dev Notes

### Source Data: Workbook Chunks

`dangdai-rag/output_chunks/workbook{1-4}_chunks.json` — JSON arrays of chunk objects.

**Workbook 1 chunk distribution (133 total):**
- `lesson_intro`: 13 (skip — not exercises)
- `pronunciation`: 13
- `listening`: 32
- `dialogue_completion`: 22
- `reading`: 10
- `sentence_construction`: 12
- `fill_in_blank`: 14
- `character_writing`: 8
- `composition`: 7
- `vocabulary`: 1

The chunk `metadata.exercise_type` field maps directly to the `premade_exercises.exercise_type` column. Filter out `lesson_intro` and `null` chunks.

**Chunk metadata format:**
```json
{
  "book": 1,
  "lesson": 1,
  "lesson_title": "歡迎你來臺灣！",
  "section": "fill_in_blank",
  "exercise_type": "fill_in_blank",
  "material_type": "lesson",
  "script": "traditional",
  "content_type": "workbook",
  "page_range": "5-6",
  "difficulty": "beginner",
  "content_quality": 0.92
}
```

### Premade Exercises Table Schema (from Story 1.10)

```sql
CREATE TABLE public.premade_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN (
        'listening', 'reading', 'fill_in_blank', 'dialogue_completion',
        'sentence_construction', 'matching', 'character_writing',
        'composition', 'pronunciation'
    )),
    exercise_order INTEGER NOT NULL,
    title TEXT,
    instructions TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_page_range TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**UNIQUE constraint:** `UNIQUE (book_id, lesson_id, exercise_type, exercise_order)`

### Content JSONB Schemas (by exercise type)

```typescript
// Fill-in-the-blank
{ sentences: [{ text_with_blanks: string, word_bank: string[], correct_answers: string[] }] }

// Matching / Dialogue Completion
{ pairs: [{ prompt: string, response: string }] }

// Sentence Construction
{ sentences: [{ scrambled_words: string[], correct_order: string }] }

// Reading Comprehension
{ passage: string, questions: [{ question: string, options: string[], correct_answer: string }] }

// Listening (converted to reading — no audio)
{ sentences: [{ pinyin: string, expected_chinese: string }] }

// Composition
{ prompt: string, word_count: number, suggested_vocabulary: string[] }

// Pronunciation
{ sentences: [{ pinyin: string, expected_chinese: string }] }

// Character Writing
{ characters: [{ character: string, pinyin: string, stroke_order_hint: string }] }
```

### Expected Counts

| Book | Total Chunks | Exercise Chunks (excl. intro) | Expected Exercises |
|------|-------------|-------------------------------|-------------------|
| 1    | 133         | ~120                          | ~120 |
| 2    | 122         | ~109                          | ~109 |
| 3    | 69          | ~57                           | ~57 |
| 4    | 51          | ~39                           | ~39 |

### File Location

- **Script:** `dangdai-api/src/scripts/seed_premade_exercises.py`
- **Tests:** `dangdai-api/tests/unit_tests/test_seed_premade_exercises.py`

### Dependencies

- **Depends on:** Story 1.10 (premade_exercises table), Story 11.1 (creates `src/scripts/` directory)
- **Blocks:** Story 3.5 (premade exercise section), Story 11.8 (premade exercise completion flow)

### Anti-Patterns to Avoid

- **DO NOT** skip exercises with OCR noise — use LLM to clean and restructure
- **DO NOT** create custom exercise type values not in the CHECK constraint
- **DO NOT** store raw chunk content as exercise content — restructure into proper JSONB schema
- **DO NOT** process `lesson_intro` chunks as exercises
- **DO NOT** assume chunk `section` and `exercise_type` always match — use `exercise_type` for the table field

### References

- [Source: epics.md#Story-11.4] — Story requirements
- [Source: 1-10-create-structured-content-tables.md] — Premade exercises table schema and JSONB schemas
- [Source: architecture.md#Data-Architecture] — Premade exercises content schemas and seeding source
- [Source: dangdai-rag/output_chunks/workbook1_chunks.json] — Sample workbook chunk format

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
