# Story 4.14: Migrate Quiz Generation to Structured Content

Status: ready-for-dev

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

- [ ] Task 1: Create content repository (AC: #1)
  - [ ] 1.1 Create `src/repositories/content_repo.py` with Supabase client
  - [ ] 1.2 Implement `get_vocabulary(book_id, lesson_id)` → list of vocab items
  - [ ] 1.3 Implement `get_grammar_points(book_id, lesson_id)` → list of grammar points
  - [ ] 1.4 Implement `get_dialogues(book_id, lesson_id)` → list of dialogues
  - [ ] 1.5 Implement `get_vocabulary_for_cumulative(book_id, up_to_lesson_id)` for review questions
  - [ ] 1.6 Add proper error handling and logging

- [ ] Task 2: Create content service (AC: #1, #5)
  - [ ] 2.1 Create `src/services/content_service.py` for content retrieval orchestration
  - [ ] 2.2 Implement `retrieve_chapter_content(book_id, lesson_id, exercise_type)` that fetches relevant content
  - [ ] 2.3 For vocabulary/grammar types → vocabulary + grammar_points
  - [ ] 2.4 For dialogue/reading types → dialogues + vocabulary + grammar_points
  - [ ] 2.5 For matching types → vocabulary (primary), grammar_points (secondary)
  - [ ] 2.6 Optionally include RAG chunks as supplementary context

- [ ] Task 3: Implement retrieve_structured_content node (AC: #1, #4, #5)
  - [ ] 3.1 Add `retrieve_structured_content` async node in `src/agent/nodes.py`
  - [ ] 3.2 Replace `retrieve_content` (RAG-only) in graph topology
  - [ ] 3.3 Format structured content as context for LLM prompt
  - [ ] 3.4 Include all grammar points explicitly in prompt (for coverage enforcement)
  - [ ] 3.5 Add cancellation check before database queries

- [ ] Task 4: Update generate_quiz prompt for structured content (AC: #2)
  - [ ] 4.1 Update `QUIZ_GENERATION_PROMPT` in `src/agent/prompts.py`
  - [ ] 4.2 Include structured vocabulary list with traditional, pinyin, english
  - [ ] 4.3 Include grammar points list with titles, patterns, examples
  - [ ] 4.4 Include dialogue content when relevant to exercise type
  - [ ] 4.5 Add explicit instruction: "MUST generate at least one question per grammar point"

- [ ] Task 5: Update validate_structure for grammar coverage (AC: #3)
  - [ ] 5.1 Add grammar_points list to `QuizGenerationState`
  - [ ] 5.2 In `validate_structure` node, check that each grammar_point has at least one question
  - [ ] 5.3 If coverage is incomplete, add specific feedback listing missing grammar points
  - [ ] 5.4 Trigger retry with feedback if coverage < 100%

- [ ] Task 6: Update graph state and topology (AC: all)
  - [ ] 6.1 Add `structured_content` field to `QuizGenerationState` (vocabulary, grammar_points, dialogues)
  - [ ] 6.2 Add `grammar_points_list` field for coverage validation
  - [ ] 6.3 Update graph edges: `retrieve_structured_content` → `query_weakness` → `generate_quiz` → ...
  - [ ] 6.4 Keep existing evaluate_content node (works with any content source)

- [ ] Task 7: Write tests (AC: all)
  - [ ] 7.1 Unit test `content_repo.py` with mocked Supabase responses
  - [ ] 7.2 Unit test `content_service.py` with mocked repository
  - [ ] 7.3 Unit test `retrieve_structured_content` node
  - [ ] 7.4 Test grammar coverage validation in `validate_structure`
  - [ ] 7.5 Test backward compatibility of quiz response format
  - [ ] 7.6 Run ruff + mypy

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
