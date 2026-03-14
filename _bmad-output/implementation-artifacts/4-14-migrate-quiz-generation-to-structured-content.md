# Story 4.14: Migrate Quiz Generation to Structured Content

Status: done

## Story

As a developer,
I want to replace the RAG-only `retrieve_content` node with a `retrieve_structured_content` node that queries vocabulary, grammar_points, and dialogues tables as the primary source for quiz generation,
So that generated quizzes are guaranteed to use accurate curriculum data with complete grammar coverage per chapter.

## Acceptance Criteria

1. **Given** the Python backend is running and structured content tables are populated (Stories 11.1-11.3)
   **When** a POST request is made to `/api/quizzes/generate`
   **Then** the `retrieve_structured_content` node queries the `vocabulary`, `grammar_points`, and `dialogues` tables for the specified chapter

2. **Given** structured content is retrieved
   **When** the `generate_quiz` node generates questions
   **Then** ALL grammar points for the chapter are represented in generated questions (FR58)
   **And** the quiz uses vocabulary from the structured `vocabulary` table (not hallucinated)

3. **Given** the `validate_structure` node validates the quiz
   **When** grammar coverage is checked
   **Then** the node verifies every grammar_point for the chapter has at least one question targeting it
   **And** missing grammar coverage triggers regeneration with specific feedback

4. **Given** the structured content retrieval is complete
   **When** the quiz is returned to the mobile app
   **Then** the response format is unchanged (backward-compatible with mobile app)
   **And** quiz generation never returns empty results because structured content is guaranteed to exist

5. **Given** the existing RAG retrieval
   **When** the new structured content retrieval is active
   **Then** RAG retrieval (dangdai_chunks) is kept as optional supplementary context only
   **And** structured content is the PRIMARY source for all exercise type generation

6. **Given** the structured content approach is deployed
   **When** I compare quiz quality to the RAG-only approach
   **Then** curriculum alignment improves to ~100% (all vocab/grammar from actual textbook tables)
   **And** no hallucinated vocabulary or grammar patterns appear in generated questions

## Tasks / Subtasks

- [x] Task 1: Create content repository (AC: #1)
  - [x] 1.1 Create `src/repositories/content_repo.py` with Supabase client
  - [x] 1.2 Implement `get_vocabulary(book_id, lesson_id)` → list of vocab items
  - [x] 1.3 Implement `get_grammar_points(book_id, lesson_id)` → list of grammar points
  - [x] 1.4 Implement `get_dialogues(book_id, lesson_id)` → list of dialogues
  - [x] 1.5 Implement `get_vocabulary_for_cumulative(book_id, up_to_lesson_id)` for review questions
  - [x] 1.6 Add proper error handling and logging

- [x] Task 2: Create content service (AC: #1, #5)
  - [x] 2.1 Create `src/services/content_service.py` for content retrieval orchestration
  - [x] 2.2 Implement `retrieve_chapter_content(book_id, lesson_id, exercise_type)` that fetches relevant content
  - [x] 2.3 For vocabulary/grammar types → vocabulary + grammar_points
  - [x] 2.4 For dialogue/reading types → dialogues + vocabulary + grammar_points
  - [x] 2.5 For matching types → vocabulary (primary), grammar_points (secondary)
  - [x] 2.6 Optionally include RAG chunks as supplementary context

- [x] Task 3: Implement retrieve_structured_content node (AC: #1, #4, #5)
  - [x] 3.1 Add `retrieve_structured_content` async node in `src/agent/nodes.py`
  - [x] 3.2 Replace `retrieve_content` (RAG-only) in graph topology
  - [x] 3.3 Format structured content as context for LLM prompt
  - [x] 3.4 Include all grammar points explicitly in prompt (for coverage enforcement)
  - [x] 3.5 Add cancellation check before database queries

- [x] Task 4: Update generate_quiz prompt for structured content (AC: #2)
  - [x] 4.1 Update `QUIZ_GENERATION_PROMPT` in `src/agent/prompts.py`
  - [x] 4.2 Include structured vocabulary list with traditional, pinyin, english
  - [x] 4.3 Include grammar points list with titles, patterns, examples
  - [x] 4.4 Include dialogue content when relevant to exercise type
  - [x] 4.5 Add explicit instruction: "MUST generate at least one question per grammar point"

- [x] Task 5: Update validate_structure for grammar coverage (AC: #3)
  - [x] 5.1 Add grammar_points list to `QuizGenerationState`
  - [x] 5.2 In `validate_structure` node, check that each grammar_point has at least one question
  - [x] 5.3 If coverage is incomplete, add specific feedback listing missing grammar points
  - [x] 5.4 Trigger retry with feedback if coverage < 100%

- [x] Task 6: Update graph state and topology (AC: all)
  - [x] 6.1 Add `structured_content` field to `QuizGenerationState` (vocabulary, grammar_points, dialogues)
  - [x] 6.2 Add `grammar_points_list` field for coverage validation
  - [x] 6.3 Update graph edges: `retrieve_structured_content` → `query_weakness` → `generate_quiz` → ...
  - [x] 6.4 Keep existing evaluate_content node (works with any content source)

- [x] Task 7: Write tests (AC: all)
  - [x] 7.1 Unit test `content_repo.py` with mocked Supabase responses
  - [x] 7.2 Unit test `content_service.py` with mocked repository
  - [x] 7.3 Unit test `retrieve_structured_content` node
  - [x] 7.4 Test grammar coverage validation in `validate_structure`
  - [x] 7.5 Test backward compatibility of quiz response format
  - [x] 7.6 Run ruff + mypy

## Dev Notes

### Current Pipeline State

The quiz generation pipeline currently uses RAG-only retrieval:

```
START → retrieve_content → query_weakness → generate_quiz → validate_structure → evaluate_content → END
```

**Current `retrieve_content` node** queries `dangdai_chunks` via pgvector semantic search. This approach has issues:
- RAG chunks don't guarantee complete vocabulary/grammar coverage
- Semantic search may miss relevant content or include irrelevant chunks
- No structured data — LLM receives raw text chunks
- Grammar points may be hallucinated or from wrong chapters

### New Pipeline

```
START → retrieve_structured_content → query_weakness → generate_quiz → validate_structure → evaluate_content → END
                                                                              ↑                    |
                                                                              └── (retry with grammar coverage feedback)
```

**`retrieve_structured_content` replaces `retrieve_content`** with direct Supabase table queries:
- `vocabulary` table → exact vocab items for the chapter
- `grammar_points` table → exact grammar rules for the chapter
- `dialogues` table → exact dialogue content for the chapter
- (Optional) `dangdai_chunks` → supplementary culture/pronunciation context

### Content Repository Implementation

```python
# src/repositories/content_repo.py
"""Repository for structured content table queries."""

from src.utils.supabase_client import get_supabase_client

class ContentRepository:
    """Queries structured content tables for curriculum data."""

    def __init__(self) -> None:
        self._client = get_supabase_client()

    async def get_vocabulary(self, book_id: int, lesson_id: int) -> list[dict]:
        """Get all vocabulary items for a chapter."""
        result = self._client.table("vocabulary") \
            .select("traditional, pinyin, english, part_of_speech, vocab_section, is_name") \
            .eq("book_id", book_id) \
            .eq("lesson_id", lesson_id) \
            .order("sort_order") \
            .execute()
        return result.data or []

    async def get_grammar_points(self, book_id: int, lesson_id: int) -> list[dict]:
        """Get all grammar points for a chapter."""
        result = self._client.table("grammar_points") \
            .select("title_english, title_chinese, function_description, structure_pattern, usage_notes, examples") \
            .eq("book_id", book_id) \
            .eq("lesson_id", lesson_id) \
            .order("sort_order") \
            .execute()
        return result.data or []

    async def get_dialogues(self, book_id: int, lesson_id: int) -> list[dict]:
        """Get all dialogues for a chapter."""
        result = self._client.table("dialogues") \
            .select("dialogue_number, title_traditional, title_english, lines") \
            .eq("book_id", book_id) \
            .eq("lesson_id", lesson_id) \
            .order("dialogue_number") \
            .execute()
        return result.data or []
```

### Grammar Coverage Validation

**In `validate_structure` node:**

```python
# After existing structural validation...

# Check grammar coverage
grammar_points = state.get("grammar_points_list", [])
if grammar_points:
    covered_grammar = set()
    for question in valid_questions:
        if question.get("grammar_pattern"):
            covered_grammar.add(question["grammar_pattern"])

    missing = [gp["title_english"] for gp in grammar_points if gp["title_english"] not in covered_grammar]
    if missing:
        feedback = f"Missing grammar coverage for: {', '.join(missing)}. Generate questions covering these patterns."
        # Trigger retry with specific grammar feedback
```

### State Updates

```python
# src/agent/state.py — additions
class QuizGenerationState(TypedDict, total=False):
    # ... existing fields ...
    structured_content: dict          # NEW: { vocabulary: [...], grammar_points: [...], dialogues: [...] }
    grammar_points_list: list[dict]   # NEW: list of grammar points for coverage validation
```

### Prompt Updates

The `QUIZ_GENERATION_PROMPT` should be updated to receive structured content:

```
You are generating a {exercise_type} quiz for Chapter {lesson_id} of Book {book_id}.

## Chapter Vocabulary (from textbook):
{formatted_vocabulary_list}

## Chapter Grammar Points (MUST cover ALL):
{formatted_grammar_points}

## Chapter Dialogues:
{formatted_dialogues}

## Requirements:
- Generate {num_questions} questions
- MUST generate at least one question per grammar point listed above
- Use ONLY vocabulary from the provided list (do not invent new words)
- Use Traditional Chinese characters only
...
```

### Backward Compatibility

The quiz response payload to the mobile app must NOT change:
- Same JSON structure: `{ questions: [...], exercise_type, chapter_id, book_id }`
- Same question fields: `question_text, options, correct_answer, explanation, source_citation`
- Same validation endpoint behavior
- No mobile app changes required

### Error Handling

- If structured content tables are empty for a chapter → log error, fall back to RAG-only retrieval
- If Supabase query fails → retry once, then fall back to RAG-only retrieval
- Never return an empty quiz — guaranteed content from structured tables prevents this

### Performance Considerations

- Supabase queries are fast (~50-100ms for structured data vs ~200-500ms for pgvector)
- Overall pipeline should be faster with structured content (less token-heavy context for LLM)
- Grammar coverage validation adds ~10ms (rule-based check)

### Files to Create/Modify

**New files:**
```
dangdai-api/src/
├── repositories/
│   └── content_repo.py     # Structured content table queries
└── services/
    └── content_service.py   # Content retrieval orchestration
```

**Modified files:**
```
dangdai-api/src/
├── agent/
│   ├── state.py            # Add structured_content and grammar_points_list
│   ├── prompts.py          # Update QUIZ_GENERATION_PROMPT for structured content
│   ├── nodes.py            # Replace retrieve_content with retrieve_structured_content
│   │                       # Update validate_structure for grammar coverage
│   └── graph.py            # Update topology: retrieve_structured_content replaces retrieve_content
└── tests/
    ├── test_content_repo.py    # NEW: content repository tests
    └── test_quiz_generation.py # Update existing tests for new node
```

### Existing Code Patterns to Follow

**From `repositories/performance_repo.py`:**
- Same Supabase client initialization pattern
- Same async query pattern with `.execute()`
- Same error handling approach

**From `agent/nodes.py`:**
- Same async node function signature
- Same state access pattern
- Same cancellation check pattern (if request exists)
- Same logging pattern

### Anti-Patterns to Avoid

- **DO NOT** remove RAG retrieval entirely — keep as supplementary option
- **DO NOT** change the quiz response format — backward compatibility is critical
- **DO NOT** skip grammar coverage validation — this is a core requirement (FR58)
- **DO NOT** include ALL vocabulary from previous chapters by default — only for cumulative review mode
- **DO NOT** pass raw Supabase response objects to LLM — format as clean text/JSON context
- **DO NOT** ignore cancellation checks — add `request.is_disconnected()` before Supabase queries

### Prerequisites — MUST be completed before dev starts

> **BLOCKER (Action Item A10 — Epic 11 Retro):** The `grammar_points`, `dialogues`, and
> `premade_exercises` tables currently have **0 rows**. Story 4.14 cannot be meaningfully
> developed or tested until these tables are populated. Complete the following before
> picking up this story:
>
> - [ ] Run `seed_grammar_points.py` with a real LLM API key against chunk files
> - [ ] Run `seed_dialogues.py` with a real LLM API key against chunk files
> - [ ] Run `seed_premade_exercises.py` with a real LLM API key against chunk files
> - [ ] Verify `grammar_points` coverage: all 54 lessons have at least one grammar point
> - [ ] Verify `dialogues` coverage: all 54 lessons have at least one dialogue
> - [ ] Confirm `vocabulary` table has 3,997 rows (already seeded in Story 11.1)
>
> [Source: epic-11-retro-2026-03-09.md#A10, #6.1, #7.1]

### Dependencies

- **Depends on:** Story 1.10 (structured content tables must exist), Stories 11.1-11.3 (tables must be populated with data)
- **Depends on:** Story 4.13 (evaluator-optimizer pipeline must be in place)
- **Blocks:** None (enhances existing quiz generation)

### References

- [Source: architecture.md#Data-Architecture] — Structured content table schemas
- [Source: architecture.md#Quiz-Generation-Flow] — Updated generation flow with structured content
- [Source: epics.md#Story-4.14] — Story requirements and implementation notes
- [Source: prd.md#FR11-FR14] — Structured content quiz generation requirements
- [Source: prd.md#FR58] — Grammar coverage enforcement
- [Source: 4-13-evaluator-optimizer-quiz-validation.md] — Current pipeline state and patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- All 436 unit tests pass (0 regressions) — `uv run pytest tests/ --ignore=tests/integration_tests`
- Ruff lint passes clean on all changed files
- Pre-existing LSP warnings in `nodes.py` (TypedDict `total=False` pattern) — not introduced by this story

### Completion Notes List

- **Task 1:** Created `content_repo.py` with 4 methods: `get_vocabulary`, `get_grammar_points`, `get_dialogues`, `get_vocabulary_for_cumulative`. Follows existing `ChapterRepository`/`PerformanceRepository` patterns. All methods have try/except with graceful degradation to empty list.
- **Task 2:** Created `content_service.py` with `ContentService` class orchestrating content retrieval. Exercise-type-aware: dialogue/reading types fetch dialogues, others fetch vocab+grammar only. RAG service is optional supplementary context via DI.
- **Task 3:** Added `retrieve_structured_content` async node replacing `retrieve_content` in the graph. Falls back to RAG-only if structured tables are empty (error handling per story spec). Cancellation check included before DB queries.
- **Task 4:** Updated `QUIZ_GENERATION_PROMPT` with `{structured_vocabulary}`, `{structured_grammar_points}`, `{structured_dialogues}` placeholders. Added explicit instruction for grammar coverage and grammar_pattern field. Added 3 formatting helpers: `_format_structured_vocabulary`, `_format_structured_grammar_points`, `_format_structured_dialogues`.
- **Task 5:** Added grammar coverage validation to `validate_structure` node. Checks each grammar point's `title_english` against questions' `grammar_pattern` field. Missing coverage triggers retry with specific feedback listing uncovered grammar points.
- **Task 6:** Added `structured_content` and `grammar_points_list` fields to `QuizGenerationState`. Updated graph topology: `retrieve_structured_content` replaces `retrieve_content` as first node. All other nodes unchanged. Backward-compatible quiz_payload format preserved.
- **Task 7:** 43 new tests across 3 files (12 content_repo + 11 content_service + 20 quiz_generation). Full 436-test regression suite passes.
- **Design Decision:** `retrieve_content` function retained in `nodes.py` but removed from graph topology. This preserves backward compatibility for any external callers while the graph uses the new `retrieve_structured_content` node.

### Change Log

- 2026-03-14: Migrated quiz generation pipeline from RAG-only to structured content (vocabulary, grammar_points, dialogues tables). Added grammar coverage validation (FR58). All 436 tests pass.
- 2026-03-14: [AI-Review] Added retry-once on transient failure to content_repo.py (H1). Wrapped sync content retrieval in asyncio.to_thread() to avoid blocking event loop (M2). Updated stale nodes.py module docstring (M4). Updated File List to include undocumented seed script changes (M1).

### File List

**New files:**
- `dangdai-api/src/repositories/content_repo.py` — Structured content table queries (vocabulary, grammar_points, dialogues)
- `dangdai-api/src/services/content_service.py` — Content retrieval orchestration service
- `dangdai-api/tests/test_content_repo.py` — Unit tests for content repository (12 tests)
- `dangdai-api/tests/test_content_service.py` — Unit tests for content service (11 tests)

**Modified files:**
- `dangdai-api/src/agent/state.py` — Added `structured_content` and `grammar_points_list` fields
- `dangdai-api/src/agent/nodes.py` — Added `retrieve_structured_content` node, grammar coverage validation in `validate_structure`, 3 structured content formatting helpers, updated `generate_quiz` to use structured content in prompt, wrapped sync content retrieval in `asyncio.to_thread()`
- `dangdai-api/src/agent/graph.py` — Updated topology: `retrieve_structured_content` replaces `retrieve_content`
- `dangdai-api/src/agent/prompts.py` — Updated `QUIZ_GENERATION_PROMPT` with structured content placeholders and grammar coverage instruction
- `dangdai-api/tests/test_quiz_generation.py` — Added 20 new tests: structured content node, grammar coverage validation, formatting helpers, graph topology, backward compatibility, state fields
- `dangdai-api/src/scripts/seed_grammar_points.py` — Added low-quality chunk skip (<0.5), deduplication by (book_id, lesson_id, title_english), `type: ignore` for json.load
- `dangdai-api/src/scripts/seed_dialogues.py` — Added `type: ignore` for json.load return
- `dangdai-api/src/scripts/seed_premade_exercises.py` — Added `type: ignore` for json.load return
