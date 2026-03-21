# Story 12.2: Python-Side Premade Exercise Coverage Tests

Status: ready-for-dev

## Story

As a developer,
I want Python tests that validate premade exercise content schemas and generator output against real Book 1 data,
So that I can ensure all pre-generated exercises have valid content JSONB and generators produce correct output.

## Acceptance Criteria

1. **Given** real Book 1 content from `dangdai-rag/output_chunks/book1_chunks.json`
   **When** the test loads vocabulary and grammar sections for each of the 15 lessons
   **Then** VocabularyGenerator produces valid questions with correct structure
   **And** MatchingGenerator produces valid questions with correct structure
   **And** FillInBlankGenerator produces valid questions with correct structure
   **And** each generator handles edge cases (empty vocab, missing grammar points)

2. **Given** premade exercise content JSONB from the database (or fixture data)
   **When** the test validates each exercise type's content schema
   **Then** fill_in_blank content has `sentences` array with `text_with_blanks`, `word_bank`, `correct_answers`
   **And** matching content has `pairs` array with `left`, `right` fields
   **And** dialogue_completion content has `lines` array, `options`, `correct_answer`
   **And** sentence_construction content has `sentences` array with `scrambled_words`, `correct_order`
   **And** reading/reading_comprehension content has `passage`, `questions` array with `question`, `options`, `correct_answer`

3. **Given** content JSONB is validated against schemas
   **When** the premadeExerciseAdapter equivalent logic transforms it
   **Then** valid QuizQuestion-compatible dicts are produced for each exercise type
   **And** no exercise type returns an empty result for valid content

## Tasks / Subtasks

- [ ] Task 1: Complete the premade exercises coverage test file (AC: #1, #2, #3)
  - [ ] 1.1 Open existing `dangdai-api/tests/test_premade_exercises_coverage.py` (already scaffolded, ~694 lines)
  - [ ] 1.2 Review existing test structure — it has Tier 1 generator tests and schema validation tests
  - [ ] 1.3 Ensure fixture loads `dangdai-rag/output_chunks/book1_chunks.json` correctly
  - [ ] 1.4 Verify all 15 lessons are parameterized for each generator test class

- [ ] Task 2: Validate Tier 1 generator output with real Book 1 content (AC: #1)
  - [ ] 2.1 `TestVocabularyGeneratorBook1`: for each lesson, generate vocabulary questions and assert:
    - Returns non-empty list
    - Each question has `question_id`, `question_text`, `options` (4 items), `correct_answer`, `explanation`, `source_citation`
    - `question_type` is `multiple_choice`
    - Options include the correct answer
    - No duplicate questions
  - [ ] 2.2 `TestMatchingGeneratorBook1`: for each lesson, generate matching questions and assert:
    - Returns non-empty list
    - Each question has `pairs` with `left` and `right` fields
    - `correct_answer` is valid JSON encoding of correct pairs
    - No duplicate pairs within a question
  - [ ] 2.3 `TestFillInBlankGeneratorBook1`: for each lesson, generate fill-in-blank questions and assert:
    - Returns non-empty list (may return empty if lesson has no grammar points — handle gracefully)
    - Each question has `text_with_blanks` containing `___`, `word_bank`, `correct_answers`
    - Word bank includes the correct answer
    - At least min(4, total_grammar_points) grammar points covered

- [ ] Task 3: Validate content JSONB schemas for all 6 exercise types (AC: #2)
  - [ ] 3.1 Create fixture data for each exercise type with realistic content JSONB
  - [ ] 3.2 `TestFillInBlankSchema`: validate `sentences` array structure
  - [ ] 3.3 `TestMatchingSchema`: validate `pairs` array structure
  - [ ] 3.4 `TestDialogueCompletionSchema`: validate `lines`, `options`, `correct_answer`
  - [ ] 3.5 `TestSentenceConstructionSchema`: validate `sentences` with `scrambled_words`, `correct_order`
  - [ ] 3.6 `TestReadingComprehensionSchema`: validate `passage`, `questions` array
  - [ ] 3.7 Test invalid/malformed JSONB is rejected with clear error messages

- [ ] Task 4: Validate adapter transformation produces valid QuizQuestion output (AC: #3)
  - [ ] 4.1 Create Python equivalents of the TypeScript `premadeExerciseAdapter` transformations
  - [ ] 4.2 For each exercise type: transform valid content JSONB → QuizQuestion-compatible dict
  - [ ] 4.3 Assert transformed output has required fields: `question_id`, `question_text`, `options`/interaction data, `correct_answer`
  - [ ] 4.4 Assert no exercise type returns empty list for valid input content

- [ ] Task 5: Test edge cases and error handling (AC: #1)
  - [ ] 5.1 Empty vocabulary list → VocabularyGenerator returns empty or handles gracefully
  - [ ] 5.2 No grammar points → FillInBlankGenerator returns empty or handles gracefully
  - [ ] 5.3 Single vocabulary item → VocabularyGenerator still produces valid question (fewer distractors)
  - [ ] 5.4 Malformed content JSONB → schema validation fails with descriptive error
  - [ ] 5.5 Missing required fields in content → clear assertion error

- [ ] Task 6: Add pytest markers and organize test structure (AC: all)
  - [ ] 6.1 Use `@pytest.mark.unit` for schema validation and adapter tests
  - [ ] 6.2 Use `@pytest.mark.integration` for tests that need database access (if any)
  - [ ] 6.3 Target ~45-60 test cases total covering all types × lessons + edge cases
  - [ ] 6.4 Run `ruff` and `mypy` on test file

## Dev Notes

### Existing Test File Analysis

The file `dangdai-api/tests/test_premade_exercises_coverage.py` already exists with ~694 lines. It contains:

1. **Tier 1 Generator Tests** — tests real Book 1 content (15 lessons):
   - `TestVocabularyGeneratorBook1` — generates vocabulary questions
   - `TestMatchingGeneratorBook1` — generates matching pairs
   - `TestFillInBlankGeneratorBook1` — generates fill-in-blank from grammar + vocab

2. **Content JSONB Schema Validation** — validates 6 exercise types:
   - `fill_in_blank`, `matching`, `dialogue_completion`, `sentence_construction`, `reading`/`reading_comprehension`

3. **Adapter Tests** — Python equivalents of TypeScript adapter logic

**This story should review, complete, and harden the existing implementation.** Read the file fully before making changes.

### RAG Content Source

Fixture data: `dangdai-rag/output_chunks/book1_chunks.json`

Loading pattern:
```python
import json
from pathlib import Path

RAG_CHUNKS_PATH = Path(__file__).parent.parent.parent / "dangdai-rag" / "output_chunks" / "book1_chunks.json"

@pytest.fixture(scope="module")
def book1_chunks():
    with open(RAG_CHUNKS_PATH) as f:
        return json.load(f)

@pytest.fixture
def lesson_vocabulary(book1_chunks, lesson_number):
    """Extract vocabulary for a specific lesson from RAG chunks."""
    # Filter chunks for the lesson, extract vocabulary section
    ...
```

### Generator Imports

```python
from src.agent.generators import VocabularyGenerator, MatchingGenerator, FillInBlankGenerator
```

Generators are in `dangdai-api/src/agent/generators.py` (created in Story 4.15).

### Content JSONB Schemas (from architecture.md + epics.md)

**fill_in_blank:**
```json
{
  "sentences": [
    {
      "text_with_blanks": "他___了飯",
      "word_bank": ["吃", "喝", "看", "說"],
      "correct_answers": ["吃"]
    }
  ]
}
```

**matching:**
```json
{
  "pairs": [
    { "left": "學", "right": "to study" },
    { "left": "吃", "right": "to eat" }
  ]
}
```

**dialogue_completion:**
```json
{
  "lines": [
    { "speaker": "A", "text": "你好嗎？" },
    { "speaker": "B", "text": "___" }
  ],
  "options": ["我很好", "再見", "謝謝", "不客氣"],
  "correct_answer": "我很好"
}
```

**sentence_construction:**
```json
{
  "sentences": [
    {
      "scrambled_words": ["吃", "他", "飯", "了"],
      "correct_order": ["他", "吃", "了", "飯"]
    }
  ]
}
```

**reading_comprehension:**
```json
{
  "passage": "今天天氣很好...",
  "questions": [
    {
      "question": "What is the weather like?",
      "options": ["Good", "Bad", "Cold", "Hot"],
      "correct_answer": "Good"
    }
  ]
}
```

### Existing Test Patterns (from dangdai-api/tests/)

From Story 4.15's test files:
- `test_generators.py`: 35 tests for generators — uses direct function calls with fixture data
- `test_deterministic_checks.py`: 61 tests for validation checks
- Pattern: `@pytest.mark.asyncio` for async tests, `@pytest.mark.unit` / `@pytest.mark.integration` markers
- Assertion style: explicit assertions with descriptive messages

### Anti-Patterns to Avoid

- **DO NOT** mock the RAG chunks — load real `book1_chunks.json` for generator tests
- **DO NOT** require a running database — schema validation uses fixture data, not DB queries
- **DO NOT** duplicate generator unit tests from `test_generators.py` — this file tests with real Book 1 data, not synthetic fixtures
- **DO NOT** skip lessons that have fewer vocabulary items — test edge cases where lessons have sparse content
- **DO NOT** use `jsonschema` library unless already in dependencies — prefer manual assertions for clarity

### Dependencies

- **Depends on:** Story 4.15 (generators exist in `generators.py`), `dangdai-rag/output_chunks/book1_chunks.json` (RAG chunks must exist)
- **Blocks:** None
- **Note:** This test file is independent of Story 4.16 — it validates generators and schemas, not the frontend

### Previous Story Intelligence (from Story 4.15)

- Generators are in `dangdai-api/src/agent/generators.py`
- `VocabularyGenerator` has 3 subtypes: `char_to_meaning`, `pinyin_to_char`, `meaning_to_char`
- `MatchingGenerator` uses JSON-encoded `correct_answer` (fixed in code review)
- `FillInBlankGenerator` requires min(4, total_grammar_points) coverage
- All generators accept `weakness_profile` param — pass empty dict `{}` for coverage tests
- 540 tests passing as of Story 4.15 — run full suite to verify no regressions

### References

- [Source: epics.md#Story-12.2] — Story requirements
- [Source: architecture.md#Exercise-Quality-Test-Strategy] — Layer 2 test strategy
- [Source: dangdai-api/tests/test_premade_exercises_coverage.py] — Existing scaffolded test file
- [Source: dangdai-api/src/agent/generators.py] — Tier 1 algorithmic generators
- [Source: 4-15-hybrid-quiz-generation-3-tier.md] — Generator design and test patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
