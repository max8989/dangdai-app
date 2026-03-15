# Story 5.1: Chapter Test (Multi-Type Assessment)

Status: ready-for-dev

## Story

As a user,
I want to take a comprehensive chapter test combining multiple exercise types with adaptive targeting of my weak areas,
So that I can assess my overall mastery of the chapter across different skills.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** I tap "Take Chapter Test"
   **Then** a quiz is generated with ~20 questions spanning multiple exercise types (vocabulary, grammar, fill-in-the-blank, matching, dialogue completion)
   **And** the quiz includes cumulative review questions from previous chapters (FR28)
   **And** the quiz uses adaptive generation to include extra questions on my documented weak areas (FR29)
   **And** the same quiz UI and feedback patterns are used, with type-specific interactions per question

2. **Given** the chapter test is in progress
   **When** I view the progress bar
   **Then** I see "Chapter Test" label and current question count (e.g., "5/20")

3. **Given** the chapter test completes
   **When** I view the completion screen
   **Then** I see results using the existing CompletionScreen with exercise type breakdown
   **And** `exercise_type_progress` is updated for each exercise type that appeared in the test
   **And** the "Continue" button returns me to the Exercise Type Selection screen

4. **Given** the backend receives a chapter_test generation request
   **When** the quiz is generated
   **Then** the backend generates ~20 questions: ~15 from current chapter + ~5 cumulative review from previous chapters
   **And** each question carries its own `exercise_type` field for per-question type switching in `play.tsx`
   **And** the response format is backward-compatible with the existing mobile quiz infrastructure

5. **Given** the user has weakness profile data
   **When** a chapter test is generated
   **Then** 30-50% of questions target documented weak areas (vocabulary items, grammar patterns, or exercise types)

## Tasks / Subtasks

- [ ] Task 1: Add `CHAPTER_TEST` exercise type to backend (AC: #4)
  - [ ] 1.1 Add `CHAPTER_TEST = "chapter_test"` to `ExerciseType` enum in `src/api/schemas.py`
  - [ ] 1.2 Add `question_count: int | None = None` field to `QuizGenerateRequest` (default None = use existing logic; chapter_test sends 20)
  - [ ] 1.3 Add `include_cumulative: bool = False` field to `QuizGenerateRequest` (chapter_test sends True)
  - [ ] 1.4 Update `QuizGenerationState` in `src/agent/state.py` with `question_count` and `include_cumulative` fields
  - [ ] 1.5 Pass new fields from route handler through `quiz_service.py` into graph input

- [ ] Task 2: Implement cumulative review content retrieval (AC: #1, #4)
  - [ ] 2.1 Add `get_vocabulary_cumulative(book_id, up_to_lesson_id)` to `ContentRepository` if not already present (check: it exists per Story 4.14 notes as `get_vocabulary_for_cumulative`)
  - [ ] 2.2 Add `get_grammar_points_cumulative(book_id, up_to_lesson_id)` to `ContentRepository` — same pattern as vocabulary cumulative
  - [ ] 2.3 Update `retrieve_structured_content` node: when `include_cumulative=True`, fetch cumulative content for previous chapters in addition to current chapter
  - [ ] 2.4 Format cumulative content as a separate section in the LLM prompt (clearly labeled "CUMULATIVE REVIEW CONTENT — from previous chapters")

- [ ] Task 3: Update quiz generation for chapter test mode (AC: #1, #4, #5)
  - [ ] 3.1 In `generate_quiz` node: when `exercise_type == "chapter_test"`, set question_count to `state.get("question_count", 20)`
  - [ ] 3.2 For chapter_test mode, instruct LLM to generate questions across 5 exercise types: vocabulary, grammar, fill_in_blank, matching, dialogue_completion (no sentence_construction or reading_comprehension to keep test focused)
  - [ ] 3.3 Instruct LLM to allocate ~15 questions from current chapter and ~5 from cumulative review content
  - [ ] 3.4 Each generated question MUST have `exercise_type` field set to the specific type (vocabulary, grammar, fill_in_blank, matching, dialogue_completion)
  - [ ] 3.5 Integrate weakness biasing: 30-50% of questions target weak areas from `weakness_profile`
  - [ ] 3.6 Update `QUIZ_GENERATION_PROMPT` or add a `CHAPTER_TEST_PROMPT` variant in `src/agent/prompts.py`

- [ ] Task 4: Update validation for chapter test (AC: #4)
  - [ ] 4.1 In `validate_structure` node: when exercise_type is chapter_test, validate each question has a valid `exercise_type` sub-field
  - [ ] 4.2 Ensure grammar coverage validation still applies (all current-chapter grammar points must be covered)
  - [ ] 4.3 Validate question_count is approximately 20 (allow 18-22 range)
  - [ ] 4.4 Validate mix of exercise types (at least 3 different types present)

- [ ] Task 5: Add "Chapter Test" button to Exercise Type Selection screen (AC: #1, #2)
  - [ ] 5.1 In `exercises.tsx`, add a prominent "Take Chapter Test" button above the AI exercise type grid
  - [ ] 5.2 Style: full-width, primary theme, with icon (e.g., `ClipboardCheck` from lucide-react-native) and subtitle "~20 questions across multiple types"
  - [ ] 5.3 `onPress` navigates to `/quiz/loading` with params: `{ chapterId, bookId, exerciseType: 'chapter_test' }`
  - [ ] 5.4 Add `accessibilityRole="button"` and `accessibilityLabel="Take Chapter Test"` (Epic 3 retro A2)

- [ ] Task 6: Update mobile types, loading screen, and quiz play for chapter test (AC: #2)
  - [ ] 6.1 Add `'chapter_test'` to the `ExerciseType` string union in `types/quiz.ts` and to `EXERCISE_TYPE_LABELS` map with label "Chapter Test"
  - [ ] 6.2 In `loading.tsx` / `useQuizGeneration` hook, when exerciseType is `chapter_test`, append `question_count: 20` and `include_cumulative: true` to the POST body sent to `/api/quizzes/generate`
  - [ ] 6.3 In `loading.tsx`, when exerciseType is `chapter_test`, show "Generating your Chapter Test for Chapter X..."
  - [ ] 6.4 In `play.tsx`, when exerciseType is `chapter_test`, show "Chapter Test" in the header instead of exercise type label
  - [ ] 6.5 The per-question exercise type switching in `play.tsx` already handles multi-type quizzes — verify it works for chapter_test payload (each question has its own `exercise_type`)
  - [ ] 6.6 Verify pause/resume works correctly with `chapter_test` exerciseType in `useQuizStore` (per-question type switching must survive persist/restore cycle)

- [ ] Task 7: Update CompletionScreen for multi-type chapter test (AC: #3)
  - [ ] 7.1 In `CompletionScreen`, when exerciseType is `chapter_test`: update `exercise_type_progress` for EACH exercise type that appeared in the test (not just one type)
  - [ ] 7.2 The existing `useUpdateExerciseTypeProgress` mutation handles one type at a time — create a loop or batch update for chapter_test results
  - [ ] 7.3 Group quiz answers by exercise_type, compute score per type, upsert each type's progress
  - [ ] 7.4 Show "Chapter Test Complete!" as the title instead of "Exercise Complete!"

- [ ] Task 8: Write tests (AC: all)
  - [ ] 8.1 Backend: test `CHAPTER_TEST` enum value accepted in API
  - [ ] 8.2 Backend: test `retrieve_structured_content` with `include_cumulative=True` fetches cumulative content
  - [ ] 8.3 Backend: test `generate_quiz` produces ~20 multi-type questions for chapter_test
  - [ ] 8.4 Backend: test `validate_structure` validates chapter_test constraints (multi-type, count, coverage)
  - [ ] 8.5 Backend: test backward compatibility — existing exercise types unchanged
  - [ ] 8.6 Mobile: test "Take Chapter Test" button renders on exercises.tsx
  - [ ] 8.7 Mobile: test navigation to loading screen with `exerciseType: 'chapter_test'`
  - [ ] 8.8 Mobile: test CompletionScreen updates multiple exercise_type_progress entries for chapter_test (mock quiz with 3+ exercise types, verify updateProgress called once per type)
  - [ ] 8.9 Mobile: test play.tsx header shows "Chapter Test" label
  - [ ] 8.10 Backend: test first-chapter edge case (lesson_id=1) — cumulative retrieval returns empty, all questions from current chapter
  - [ ] 8.11 Mobile: test pause/resume with chapter_test exerciseType (verify quiz store persist/restore preserves per-question type switching)
  - [ ] 8.12 Run `ruff check` + `mypy --strict` on backend, `npx tsc` on mobile

## Dev Notes

### Current State of Code

| File | State | Action |
|------|-------|--------|
| `dangdai-api/src/api/schemas.py` | Has 8 ExerciseType values (no chapter_test) | **Modify**: Add `CHAPTER_TEST` |
| `dangdai-api/src/agent/state.py` | Has structured_content, grammar_points_list | **Modify**: Add question_count, include_cumulative |
| `dangdai-api/src/agent/nodes.py` | 987 lines, retrieve_structured_content + generate_quiz | **Modify**: Add cumulative retrieval + chapter_test generation logic |
| `dangdai-api/src/agent/prompts.py` | Has QUIZ_GENERATION_PROMPT | **Modify**: Add CHAPTER_TEST_PROMPT variant |
| `dangdai-api/src/repositories/content_repo.py` | Has get_vocabulary_for_cumulative | **Modify**: Add get_grammar_points_cumulative |
| `dangdai-api/src/services/quiz_service.py` | Orchestrates graph with 120s timeout | **Modify**: Pass question_count + include_cumulative |
| `dangdai-mobile/types/quiz.ts` | ExerciseType union + EXERCISE_TYPE_LABELS | **Modify**: Add `chapter_test` to union and labels |
| `dangdai-mobile/lib/api.ts` (or useQuizGeneration hook) | API client constructing POST body | **Modify**: Add question_count + include_cumulative for chapter_test |
| `dangdai-mobile/app/chapter/[chapterId]/exercises.tsx` | 323 lines, 8-card grid + premade section | **Modify**: Add Chapter Test button |
| `dangdai-mobile/app/quiz/loading.tsx` | 386 lines, handles exerciseType param | **Minor modify**: Add chapter_test label |
| `dangdai-mobile/app/quiz/play.tsx` | 1387 lines, per-question type switching | **Minor modify**: Chapter Test header label |
| `dangdai-mobile/components/quiz/CompletionScreen.tsx` | 434 lines, upserts one exercise_type_progress | **Modify**: Multi-type upsert for chapter_test |
| `dangdai-mobile/hooks/useExerciseTypeProgress.ts` | 173 lines, single-type upsert mutation | **Reuse**: Call multiple times for chapter_test |
| `dangdai-mobile/lib/queryKeys.ts` | 67 lines | No change needed (exercise type progress key already exists) |
| `dangdai-mobile/stores/useQuizStore.ts` | 515 lines, Zustand + persist | No change needed (exerciseType field already stores string) |

### Previous Story Intelligence (from Story 4.14)

Story 4.14 was the most recent completed story. Key patterns established:

1. **Pipeline flow:** `retrieve_structured_content` → `query_weakness` → `generate_quiz` → `validate_structure` → `evaluate_content`. Story 5.1 modifies the first and third nodes.
2. **Content repository pattern:** `ContentRepository` class in `src/repositories/content_repo.py` with async methods returning `list[dict]`. Already has `get_vocabulary_for_cumulative()` — follow this exact pattern for grammar cumulative.
3. **State extensions:** Add new optional fields to `QuizGenerationState(TypedDict, total=False)` — same pattern as `structured_content` and `grammar_points_list` additions in 4.14.
4. **Prompt engineering:** Structured content is formatted into the prompt via `_format_structured_vocabulary()`, `_format_structured_grammar_points()`, `_format_structured_dialogues()` helpers. Use the same helpers, labeling cumulative content separately.
5. **Grammar coverage validation:** `validate_structure` already checks grammar coverage. Chapter test should maintain this — all current-chapter grammar points must be covered.
6. **Test count:** Story 4.14 added 43 new tests across 3 files. Follow same test-per-file pattern.
7. **Agent model:** Story 4.14 used Claude Opus 4 (claude-opus-4-6).

### Git Intelligence (last 5 commits)

1. `12a095d` — story 4-14 dev & review (2026-03-14): Full structured content migration, 436 tests pass
2. `3a9d3fa` — epic-auto-runner: 4 stories, 0 failures, epic-3 retro done (2026-03-09)
3. `7c6e4b6` — automate epic-1: integration tests for request cancellation (2026-03-09)
4. `d7e8b52` — automate epic-3: E2E tests for book selection and browse navigation (2026-03-09)
5. `3dabd1f` — automate epic-4: E2E tests for quiz pause/resume (2026-03-09)

**Pattern:** Recent commits follow `feat(scope): description` or `story X-Y dev & review` format. Tests are a focus.

### Architecture Compliance

**Technical Stack (no changes):**
- Backend: Python 3.11+, FastAPI, LangGraph, Supabase (postgREST)
- Mobile: React Native / Expo, TypeScript strict mode, Tamagui, TanStack Query v5, Zustand v5
- Database: Supabase PostgreSQL with RLS

**API Contract Extension:**
- `POST /api/quizzes/generate` — add optional `question_count` (int) and `include_cumulative` (bool) fields to request body
- Response format UNCHANGED — same `{ questions: [...], exercise_type, chapter_id, book_id }` payload
- Each question in chapter_test response carries `exercise_type` field (already true for mixed mode)

**Database:**
- No schema changes required — `exercise_type_progress` and `chapter_progress` tables already exist
- `exercise_type_progress` upsert: ON CONFLICT `(user_id, chapter_id, exercise_type)` — existing constraint handles multi-type updates

### Exercise Type Switching in play.tsx (Already Works)

The quiz play screen already renders per-question based on `currentQuestion.exercise_type`:
```
matching → MatchingExercise
sentence_construction → SentenceBuilder
reading_comprehension → ReadingPassageCard
dialogue_completion → DialogueCard
fill_in_blank → FillInBlankSentence + WordBankSelector
text_input → TextInputAnswer
default → AnswerOptionGrid (vocabulary/grammar multiple choice)
```

**Chapter tests use this exact mechanism.** The backend generates questions with mixed `exercise_type` values. The mobile play screen switches UI per question automatically. No structural changes to play.tsx rendering logic needed — only header label updates.

### Seeding Script Patterns (required for any Python seeding/LLM extraction story)

Not directly applicable to Story 5.1 (no seeding), but the backend follows the same patterns:

1. **Quality threshold** — Skip chunks where `content_quality < 0.5`
2. **Deduplication before upsert**
3. **Lazy LLM instantiation**
4. **JSON parsing with fallback**
5. **Schema validation of LLM output**
6. **Rate limiting**
7. **DB UNIQUE constraint verification**

[Source: epic-11-retro-2026-03-09.md#3.1, 3.2, 3.7, 4.3]

### Mobile Hook Patterns (required for any TanStack Query hook story)

1. **queryKeys factory** — All new hooks MUST add their key to `lib/queryKeys.ts`. Never use inline arrays like `['vocabulary', bookId]` directly.
2. **staleTime for static content** — Hooks querying static textbook content (vocabulary, grammar, dialogues, premade exercises) MUST use `staleTime: 1000 * 60 * 30` (30 minutes). Dynamic content (quiz results, progress) uses shorter or no staleTime.

[Source: epic-11-retro-2026-03-09.md#3.3, 3.4]

### Mobile Component Patterns (required for any pressable component story)

1. **Accessibility** — Every pressable Card MUST have `accessibilityRole` and `accessibilityLabel`. Reference existing pattern: `ChapterListItem`, `BookCard`.
2. **Co-located component tests** — Each component file must have a co-located `*.test.tsx` file. Do not rely solely on screen-level tests.

[Source: epic-11-retro-2026-03-09.md#3.5, 3.8]

### Project Structure Notes

**Backend files to modify/create:**
```
dangdai-api/src/
├── api/
│   └── schemas.py                    # Add CHAPTER_TEST enum, request fields
├── agent/
│   ├── state.py                      # Add question_count, include_cumulative
│   ├── nodes.py                      # Cumulative retrieval, chapter_test generation
│   ├── prompts.py                    # CHAPTER_TEST_PROMPT variant
│   └── graph.py                      # No change (topology unchanged)
├── repositories/
│   └── content_repo.py               # Add get_grammar_points_cumulative
├── services/
│   └── quiz_service.py               # Pass new fields to graph input
└── tests/
    ├── test_quiz_generation.py        # Chapter test generation tests
    └── test_content_repo.py           # Cumulative retrieval tests
```

**Mobile files to modify:**
```
dangdai-mobile/
├── app/
│   ├── chapter/[chapterId]/
│   │   └── exercises.tsx              # Add Chapter Test button
│   └── quiz/
│       ├── loading.tsx                # Chapter Test loading label
│       └── play.tsx                   # Chapter Test header label
├── components/quiz/
│   └── CompletionScreen.tsx           # Multi-type progress update
└── tests (co-located)
    ├── exercises.test.tsx             # Chapter Test button test
    ├── CompletionScreen.test.tsx      # Multi-type upsert test
    └── play.test.tsx                  # Chapter Test header test
```

### Edge Cases to Handle

1. **First chapter in a book (e.g., Book 1 Lesson 1):** No previous chapters exist for cumulative review. When `lesson_id == 1` (or the first lesson for the book), the backend should skip cumulative content retrieval and generate all ~20 questions from the current chapter only. The `get_vocabulary_cumulative` and `get_grammar_points_cumulative` methods should return empty lists gracefully when `up_to_lesson_id < 1`.

2. **Empty weakness profile (new user):** When the user has no `question_results` yet, the weakness biasing (30-50% targeting) is not applicable. The backend's `query_weakness` node already handles this — returns empty profile, generation uses random selection. No special handling needed for chapter_test.

3. **Fewer than 18 questions generated:** The LLM may generate fewer than the requested ~20 questions. If `validate_structure` detects <18 questions, it should trigger a retry (same as existing retry logic with max 2 retries). If still insufficient after retries, accept what was generated (degraded but functional).

4. **Chapter with limited content (e.g., introductory chapters):** Some chapters may have few vocabulary items or grammar points. The backend should adjust question distribution proportionally — if only 8 vocabulary items exist, don't request 10 vocabulary questions.

5. **Timeout risk for ~20 questions:** Generating ~20 questions (vs usual ~12) may take longer. The existing 120s timeout in `quiz_service.py` should be sufficient, but add a test verifying the timeout is adequate for chapter_test generation. If needed, increase to 180s for chapter_test only.

6. **FR30 (mastery status display):** FR30 is deferred to Stories 5.2 and 5.3. This story implements the chapter test generation and completion flow, but does NOT calculate or display mastery status. The CompletionScreen shows per-type progress bars (existing behavior) but no "Chapter Mastered!" celebration.

### Anti-Patterns to Avoid

- **DO NOT** create a new quiz play screen for chapter tests — reuse `play.tsx` (it already handles per-question type switching)
- **DO NOT** change the quiz response format — chapter_test questions use the same `QuizQuestion` schema, each with its own `exercise_type`
- **DO NOT** fetch all historical chapters for cumulative review — only fetch from the same book, up to the previous lesson (`lesson_id - 1`)
- **DO NOT** skip grammar coverage validation for chapter tests — all current-chapter grammar points must still be covered (FR58)
- **DO NOT** include sentence_construction or reading_comprehension in chapter tests — these are more complex types better suited to standalone exercises; chapter tests use the 5 core types (vocabulary, grammar, fill_in_blank, matching, dialogue_completion)
- **DO NOT** use inline query key arrays — always use `queryKeys` factory
- **DO NOT** skip accessibility attributes on the Chapter Test button
- **DO NOT** call hooks conditionally — Rules of Hooks (Epic 3 retro A9)
- **DO NOT** use hardcoded hex colors — use Tamagui theme tokens only

### Epic 4 Retro Action Items to Address in This Story

| # | Action Item | How Addressed |
|---|------------|---------------|
| A3 | Fix pre-existing `useChapters.test.ts` failure | Check if still failing; fix if trivial (chapter title mismatch) |
| A6 | Add concurrent state access tests for Zustand stores | Add test verifying quiz store handles chapter_test exerciseType |
| A8 | Add accessibility attributes consistently to quiz components | Chapter Test button includes accessibilityRole + accessibilityLabel |

### Dependencies

- **Depends on:** Epic 4 complete (all exercise types implemented in play.tsx) ✅
- **Depends on:** Story 4.14 complete (structured content retrieval) ✅
- **Depends on:** Stories 11.1-11.3 complete (structured content tables populated) ✅
- **Depends on:** `exercise_type_progress` table functional ✅
- **Blocks:** Story 5.2 (Chapter Mastery Calculation) — needs chapter_test to generate multi-type results
- **Blocks:** Story 5.3 (Chapter Mastery Celebration) — needs mastery data from 5.2

### References

- [Source: epics.md#Story-5.1] — Story requirements and acceptance criteria
- [Source: epics.md#Epic-5] — Epic goal: chapter assessment spanning multiple exercise types
- [Source: architecture.md#Quiz-Generation-Flow] — Pipeline topology
- [Source: architecture.md#Data-Architecture] — exercise_type_progress, chapter_progress schemas
- [Source: prd.md#FR27-FR30] — Chapter assessment requirements
- [Source: prd.md#NFR10] — Crash-safe quiz progress saving
- [Source: epic-4-retro-2026-03-14.md] — Exercise type integration patterns, action items
- [Source: epic-3-retro-2026-03-09.md] — Navigation flow, accessibility requirements
- [Source: 4-14-migrate-quiz-generation-to-structured-content.md] — Structured content pipeline, content repo patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
