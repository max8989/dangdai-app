# Epic 4 — Quiz Pause/Resume (Story 4.10b) Test Summary

**Date:** 2026-03-09  
**Author:** Quinn (QA Engineer)  
**Story:** 4.10b — Quiz Pause/Resume  
**Run type:** Automate workflow

---

## Overview

This document summarises the tests generated and run for Story 4.10b (Quiz Pause/Resume). Tests cover the `ExitConfirmationModal`, `PausedQuizBanner`, `usePauseQuiz` hook, and `usePausedQuiz` hook.

---

## Files Created / Modified

| File | Action | Tests Added |
|------|--------|-------------|
| `dangdai-mobile/tests/epic-4-quiz-pause-resume.test.ts` | **Created** | 30 E2E tests |
| `dangdai-mobile/hooks/usePauseQuiz.test.ts` | **Modified** | +4 edge case unit tests (13 total) |
| `dangdai-mobile/hooks/usePausedQuiz.test.ts` | **Modified** | +3 edge case unit tests (12 total) |

---

## Unit Test Results

### `usePauseQuiz.test.ts` — 13 tests ✅ ALL PASS

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | calls supabase.from("paused_quizzes").upsert() with correct params | Positive | ✅ PASS |
| 2 | throws when supabase returns an error | Negative | ✅ PASS |
| 3 | throws when user is not authenticated | Negative | ✅ PASS |
| 4 | fetches paused quiz state from supabase | Positive | ✅ PASS |
| 5 | returns null when no paused quiz exists | Negative | ✅ PASS |
| 6 | returns null when user is not authenticated (resumeQuiz) | Negative | ✅ PASS |
| 7 | calls supabase.from("paused_quizzes").delete() with correct params | Positive | ✅ PASS |
| 8 | does not throw when user is not authenticated (deletePausedQuiz) | Positive | ✅ PASS |
| 9 | throws when supabase returns an error (deletePausedQuiz) | Negative | ✅ PASS |
| 10 | **[NEW]** throws with "Failed to pause quiz" when upsert rejects with a network error | Negative | ✅ PASS |
| 11 | **[NEW]** throws when deletePausedQuiz rejects with a network error | Negative | ✅ PASS |
| 12 | **[NEW]** returns null when database row has null quiz_state (corrupted data) | Negative | ✅ PASS |
| 13 | **[NEW]** throws when resumeQuiz encounters a non-null Supabase error | Negative | ✅ PASS |

### `usePausedQuiz.test.ts` — 12 tests ✅ ALL PASS

| # | Test | Type | Result |
|---|------|------|--------|
| 1 | returns paused quiz when one exists | Positive | ✅ PASS |
| 2 | returns null when no paused quiz exists (no rows case) | Negative | ✅ PASS |
| 3 | returns null when user is not authenticated | Negative | ✅ PASS |
| 4 | is disabled when chapterId is 0 | Negative | ✅ PASS |
| 5 | is disabled when exerciseType is empty string | Negative | ✅ PASS |
| 6 | handles 42P01 table not found error gracefully | Negative | ✅ PASS |
| 7 | returns all paused quizzes for the user | Positive | ✅ PASS |
| 8 | returns empty array when no paused quizzes exist | Negative | ✅ PASS |
| 9 | returns empty array when user is not authenticated (useAllPausedQuizzes) | Negative | ✅ PASS |
| 10 | **[NEW]** returns multiple paused quizzes ordered most-recent-first | Positive | ✅ PASS |
| 11 | **[NEW]** throws for non-42P01 Supabase errors in usePausedQuiz | Negative | ✅ PASS |
| 12 | **[NEW]** throws for non-42P01 Supabase errors in useAllPausedQuizzes | Negative | ✅ PASS |

---

## E2E Tests Generated

**File:** `dangdai-mobile/tests/epic-4-quiz-pause-resume.test.ts`  
**Status:** Compiled (same TypeScript pattern as existing E2E tests). Requires running app + test credentials to execute.

### Smoke Tests (5 tests — run unconditionally)

| # | Test | Type |
|---|------|------|
| 1 | app loads successfully | Positive |
| 2 | quiz play route is accessible | Positive |
| 3 | exercises route is accessible for Book 1 Chapter 1 | Positive |
| 4 | dashboard (home) route is accessible | Positive |
| 5 | quiz loading route handles missing params gracefully | Negative |

### Authenticated Flow Tests (25 tests — require TEST_USER_EMAIL/TEST_USER_PASSWORD)

#### Exit Modal Appearance (AC #1) — 3 tests
| # | Test | Type |
|---|------|------|
| 6 | pressing back on quiz play screen shows exit confirmation modal | Positive |
| 7 | exit modal shows title and description text | Positive |
| 8 | exit modal does not appear when navigating away from completed quiz | Negative |

#### Stay Button (AC #2) — 2 tests
| # | Test | Type |
|---|------|------|
| 9 | tapping Stay dismisses modal and quiz continues | Positive |
| 10 | tapping close button (X) dismisses modal and quiz continues | Positive |

#### Cancel Quiz Button (AC #3) — 2 tests
| # | Test | Type |
|---|------|------|
| 11 | tapping Cancel Quiz navigates back to exercises screen | Positive |
| 12 | Cancel Quiz does not save a paused quiz — no banner on exercises screen | Negative |

#### Pause Quiz Button (AC #4) — 2 tests
| # | Test | Type |
|---|------|------|
| 13 | tapping Pause Quiz navigates back to exercises screen | Positive |
| 14 | Pause Quiz button shows Saving... text while pausing | Positive |

#### Paused Quiz Banner (AC #5) — 3 tests
| # | Test | Type |
|---|------|------|
| 15 | paused quiz banner appears on exercises screen after pausing | Positive |
| 16 | paused quiz banner shows Resume and Discard buttons | Positive |
| 17 | paused quiz banner does not appear for a different exercise type | Negative |

#### Resume from Banner (AC #6) — 2 tests
| # | Test | Type |
|---|------|------|
| 18 | tapping Resume on banner navigates to quiz play screen | Positive |
| 19 | resumed quiz restores quiz state (question index preserved) | Positive |

#### Dashboard Continue Card (AC #7) — 3 tests
| # | Test | Type |
|---|------|------|
| 20 | dashboard shows paused quiz continue card after pausing a quiz | Positive |
| 21 | dashboard continue card shows exercise type and chapter info | Positive |
| 22 | dashboard does not show continue card when no quiz is paused | Negative |

#### Resume from Dashboard (AC #8) — 2 tests
| # | Test | Type |
|---|------|------|
| 23 | tapping continue card on dashboard navigates to quiz play screen | Positive |
| 24 | quiz resumed from dashboard shows correct quiz title | Positive |

#### Discard from Banner (AC #9) — 3 tests
| # | Test | Type |
|---|------|------|
| 25 | tapping Discard on banner removes the paused quiz banner | Positive |
| 26 | after discarding paused quiz, dashboard continue card disappears | Negative |
| 27 | discarding from dashboard removes paused quiz from exercises screen banner | Negative |

#### Full Flow Integration — 2 tests
| # | Test | Type |
|---|------|------|
| 28 | can pause a quiz and resume it to completion | Positive |
| 29 | paused quiz banner is chapter-specific | Positive |

---

## Test Design Notes

- **Arrange-Act-Assert** pattern used throughout.
- **All external dependencies mocked** in unit tests (Supabase, AuthProvider, TanStack Query).
- **testID attributes** used for all element selection in E2E tests.
- **Deterministic**: no time-based flakiness; network calls mocked in unit tests.
- **Edge cases covered**: offline network errors, corrupted quiz state, non-42P01 DB errors, multi-quiz ordering.
- **E2E tests** follow the exact same structure as `epic-3-exercise-type-selection.test.ts`.

---

## Acceptance Criteria Coverage

| AC | Description | Unit Tests | E2E Tests |
|----|-------------|-----------|-----------|
| AC #1 | Exit modal appears on back navigation | ExitConfirmationModal.test.tsx | Tests 6–8 |
| AC #2 | Stay button dismisses modal | ExitConfirmationModal.test.tsx | Tests 9–10 |
| AC #3 | Cancel Quiz navigates back without saving | usePauseQuiz.test.ts | Tests 11–12 |
| AC #4 | Pause Quiz saves and navigates back | usePauseQuiz.test.ts | Tests 13–14 |
| AC #5 | PausedQuizBanner on exercises screen | PausedQuizBanner.test.tsx | Tests 15–17 |
| AC #6 | Resume from banner restores state | usePauseQuiz.test.ts | Tests 18–19 |
| AC #7 | Dashboard continue card | usePausedQuiz.test.ts | Tests 20–22 |
| AC #8 | Resume from dashboard | usePausedQuiz.test.ts | Tests 23–24 |
| AC #9 | Discard removes paused quiz | PausedQuizBanner.test.tsx | Tests 25–27 |
