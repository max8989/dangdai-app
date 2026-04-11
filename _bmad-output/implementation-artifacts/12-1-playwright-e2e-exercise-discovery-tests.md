# Story 12.1: Playwright E2E Exercise Discovery Tests

Status: review

## Story

As a developer,
I want an automated Playwright test suite that tests all 8 exercise types across all 15 Book 1 lessons like a real user,
So that broken exercise modules are discovered automatically and I have a clear matrix of what works and what doesn't.

## Acceptance Criteria

1. **Given** the test suite runs with valid Supabase credentials in `.env.local`
   **When** the test iterates all 8 exercise types × 15 lessons (120 combinations)
   **Then** for each combination:
     1. Navigate to the exercise selection screen for the chapter
     2. Check if premade exercises exist for that exercise type
     3. Open the premade exercise
     4. Verify the exercise renders correctly (question card visible, content populated)
     5. Attempt to interact (select answer, submit)
     6. Verify feedback is displayed (correct/incorrect overlay)

2. **Given** a premade exercise does not exist for a type/lesson combination
   **When** the test checks for it
   **Then** the test is marked as `skipped` (not failed) with a message indicating missing content

3. **Given** a premade exercise exists but fails to render or interact correctly
   **When** the test runs
   **Then** the test fails with a descriptive error message including exercise type, lesson number, and failure point

4. **Given** all 120 combinations have been tested
   **When** the test suite completes
   **Then** a summary report shows pass/fail/skip per exercise type × lesson in the Playwright HTML report

## Tasks / Subtasks

- [x] Task 1: Complete the exercise discovery test file (AC: #1, #2, #3, #4)
  - [x] 1.1 Open existing `dangdai-mobile/tests/exercise-discovery.test.ts` (already scaffolded)
  - [x] 1.2 Ensure test uses `mergedTest` from `./support/merged-fixtures` for auth + network
  - [x] 1.3 Define constants: 8 exercise types array, 15 lessons, chapter ID formula (`bookId * 100 + lessonNumber`)
  - [x] 1.4 Create `test.describe` per exercise type with parameterized lessons (1-15)
  - [x] 1.5 Each test: navigate to `/chapter/{chapterId}/exercises`, wait for exercise selection screen
  - [x] 1.6 Check if premade exercise exists for the type — if not, `test.skip('No premade exercise for type X, lesson Y')`
  - [x] 1.7 Click the premade exercise card (`premade-exercise-card-{exerciseId}`)
  - [x] 1.8 Wait for premade exercise screen to load (`premade-exercise-screen` testID)
  - [x] 1.9 Verify question card is visible and content is populated (not empty)

- [x] Task 2: Implement exercise type-specific interaction validation (AC: #1 steps 5-6)
  - [x] 2.1 For multiple_choice types (vocabulary, grammar): click first answer option, verify feedback overlay
  - [x] 2.2 For fill_in_blank: click a word bank item, verify it fills the blank
  - [x] 2.3 For matching: click a left item then a right item, verify pair highlight
  - [x] 2.4 For sentence_construction: click word tiles in order, verify sentence builds
  - [x] 2.5 For reading_comprehension: verify passage visible, click answer for first question
  - [x] 2.6 For dialogue_completion: verify dialogue lines visible, select an option
  - [x] 2.7 For mixed: detect the current question type and apply appropriate interaction
  - [x] 2.8 After interaction, verify feedback overlay appears (correct/incorrect)

- [x] Task 3: Implement premade exercise availability check via Supabase REST (AC: #2)
  - [x] 3.1 Before each test, fetch premade exercises from Supabase REST API:
        `GET /rest/v1/premade_exercises?book_id=eq.1&lesson_id=eq.{lesson}&exercise_type=eq.{type}&select=id`
  - [x] 3.2 Use the `authToken` from auth fixture for Bearer header
  - [x] 3.3 If no rows returned, call `test.skip()` with descriptive message
  - [x] 3.4 Store the exercise ID for navigation in the test

- [x] Task 4: Configure test timeouts and reporting (AC: #3, #4)
  - [x] 4.1 Set per-test timeout to 30s (premade exercises are instant but rendering needs time)
  - [x] 4.2 Configure Playwright HTML reporter for matrix visualization
  - [x] 4.3 Add descriptive test names: `[${exerciseType}] Lesson ${lesson} - exercise renders and interacts`
  - [x] 4.4 On failure, capture screenshot and include exercise type + lesson in error message

- [x] Task 5: Write supporting utilities if needed (AC: all)
  - [x] 5.1 Create helper function `getExerciseInteraction(exerciseType)` that returns the right interaction steps per type
  - [x] 5.2 Create helper `waitForExerciseScreen(page)` that waits for premade screen with proper assertions
  - [x] 5.3 Ensure test does not depend on specific answer correctness — just that interaction works

## Dev Notes

### Existing Test Infrastructure

The Playwright E2E test infrastructure was recently added (`cf4ab96`). Key files:

```
dangdai-mobile/tests/
├── exercise-discovery.test.ts          # THIS STORY — already scaffolded (313 lines)
├── support/
│   ├── merged-fixtures.ts              # Merges auth + network fixtures
│   └── fixtures/
│       ├── auth-fixture.ts             # Supabase session injection via REST API
│       └── network-fixture.ts          # Network request interception
```

### Existing exercise-discovery.test.ts Analysis

The file already exists with ~313 lines. It:
- Uses `mergedTest` (auth + network fixtures)
- Fetches exercises from Supabase REST API using `authToken` + `request` fixture
- Has chapter ID convention: `bookId * 100 + lessonNumber`
- Navigation: `/chapter/{chapterId}/exercises` → premade card click → `/quiz/premade`
- Has exercise type-specific validation (render checks + interaction attempts)
- Uses test IDs: `premade-exercises-section`, `premade-exercise-card-{exerciseId}`, `premade-exercise-screen`

**This story should review, complete, and harden the existing implementation.** Read the file fully before making changes.

### Exercise Type Selection Screen Test IDs

From `app/chapter/[chapterId]/exercises.tsx`:
- `premade-exercises-section` — the premade exercises area
- `premade-exercise-card-{exerciseId}` — individual premade exercise card
- `premade-exercise-screen` — the premade exercise play screen

### Exercise Component Test IDs

From various quiz components:
- `quiz-question-card` — question card wrapper
- `answer-option-{index}` — multiple choice option
- `word-bank-item-{index}` — word bank items for fill-in-blank
- `matching-left-{index}`, `matching-right-{index}` — matching exercise items
- `sentence-word-{index}` — sentence construction word tiles
- `reading-passage` — reading comprehension passage
- `dialogue-line-{index}` — dialogue completion lines
- `feedback-overlay` — correct/incorrect feedback

### Auth Fixture Pattern

```typescript
// From support/fixtures/auth-fixture.ts
// Injects Supabase session via REST API before each test
// Provides: authToken (string), request (APIRequestContext)
```

### Supabase REST API for Premade Exercise Check

```typescript
const response = await request.get(
  `${SUPABASE_URL}/rest/v1/premade_exercises?book_id=eq.1&lesson_id=eq.${lesson}&exercise_type=eq.${exerciseType}&select=id`,
  {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'apikey': SUPABASE_ANON_KEY,
    }
  }
);
const exercises = await response.json();
if (exercises.length === 0) test.skip(`No premade exercise for ${exerciseType}, lesson ${lesson}`);
```

### 8 Exercise Types to Test

1. `vocabulary` — multiple choice (char→meaning, pinyin→char, meaning→char)
2. `grammar` — multiple choice
3. `fill_in_blank` — word bank selection
4. `matching` — pair matching
5. `dialogue_completion` — select from options
6. `sentence_construction` — word tile ordering
7. `reading_comprehension` — passage + multiple choice questions
8. `mixed` — blend of the above

### Anti-Patterns to Avoid

- **DO NOT** mock Supabase data — tests should hit real Supabase with test credentials
- **DO NOT** assert specific answer correctness — just that interaction and feedback work
- **DO NOT** fail on missing premade exercises — use `test.skip()` for missing content
- **DO NOT** create new fixture patterns — reuse existing `mergedTest` from merged-fixtures
- **DO NOT** set global timeout below 30s — some exercises may take time to render
- **DO NOT** test the AI-generated exercise path — this is premade-only after Story 4.16

### Dependencies

- **Depends on:** Story 4.16 (all exercise types available as premade), Playwright infrastructure (commit cf4ab96)
- **Blocks:** None
- **Note:** Tests can run before Story 4.16 is complete — missing types will be skipped gracefully

### Previous Story Intelligence

From the Playwright infrastructure commit (`cf4ab96`):
- Auth fixture uses Supabase REST API for session injection
- merged-fixtures pattern extends base test with multiple fixture sets
- Tests use `page.getByTestId()` for element selection
- HTML reporter is configured in `playwright.config.ts`

### References

- [Source: epics.md#Story-12.1] — Story requirements
- [Source: architecture.md#Exercise-Quality-Test-Strategy] — Two-layer test strategy
- [Source: dangdai-mobile/tests/exercise-discovery.test.ts] — Existing scaffolded test file
- [Source: dangdai-mobile/tests/support/merged-fixtures.ts] — Fixture merging pattern
- [Source: dangdai-mobile/tests/support/fixtures/auth-fixture.ts] — Auth fixture

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- TypeScript compilation: clean (no errors)
- Test listing: 120 tests confirmed (8 types × 15 lessons)

### Completion Notes List
- Reviewed and hardened existing scaffolded test file (was ~313 lines, now ~310 lines)
- Added `waitForExerciseScreen()` helper — validates premade-exercise-screen, exercise-title, quiz-progress
- Added `getExerciseInteraction()` helper — returns type-specific interaction function per exercise type
- Added `verifyFeedbackDisplayed()` helper — checks type-appropriate feedback after interaction (overlay, inline, pair highlight)
- Improved matching interaction: now uses `left-item-0`/`right-item-0` testIDs for pair selection
- Improved dialogue_completion interaction: now uses `dialogue-option-0` testID instead of generic button
- Added `test.step()` wrappers for better Playwright HTML report drill-down
- Set per-test timeout to 30s via `test.setTimeout(30_000)`
- Updated test names to `[${exerciseType}] Lesson ${lesson} - exercise renders and interacts`
- Screenshots on failure handled by playwright.config.ts (`screenshot: 'only-on-failure'`)
- No new dependencies added

### File List
- `dangdai-mobile/tests/exercise-discovery.test.ts` — modified (complete rewrite of test logic)

### Change Log
- 2026-03-21: Completed Story 12.1 — all 5 tasks implemented. Hardened existing scaffolded test with helpers, feedback verification, per-test timeouts, and improved interaction patterns.
