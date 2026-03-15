# Story 5.2: Chapter Mastery Calculation (Multi-Type)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the system to calculate my chapter mastery based on exercise type coverage and performance,
So that I know when I've truly learned the material across different exercise types.

## Acceptance Criteria

1. **Given** I complete exercises for a chapter
   **When** the mastery is evaluated after each quiz completion
   **Then** the system checks: have I attempted ≥4 of 7 exercise types for this chapter?
   **And** the system checks: is my average `best_score` across attempted types ≥80%?
   **And** `chapter_progress` is upserted with `completion_percentage` calculated from exercise type coverage

2. **Given** I have attempted ≥4 types with ≥80% average best_score
   **When** the mastery threshold is met for the first time
   **Then** the chapter is marked as "Mastered" in `chapter_progress`
   **And** `mastered_at` timestamp is set to the current time
   **And** the CompletionScreen receives `isNewlyMastered: true` for Story 5.3 celebration

3. **Given** I have only attempted 2 of 7 types with 90% average
   **When** the mastery is evaluated
   **Then** the chapter is NOT mastered (insufficient type coverage)
   **And** `completion_percentage` still updates to reflect partial progress
   **And** the CompletionScreen shows encouragement: "Try Matching or Sentence Construction next!"

4. **Given** I have already mastered a chapter (`mastered_at` is set)
   **When** I complete another exercise in the same chapter
   **Then** `mastered_at` is preserved (not overwritten)
   **And** `completion_percentage` is recalculated and updated
   **And** the CompletionScreen receives `isNewlyMastered: false` (no re-celebration)

5. **Given** the chapter_test exercise type is used (Story 5.1)
   **When** the chapter test completes with multiple exercise types
   **Then** mastery is evaluated AFTER all individual exercise type progress records are upserted
   **And** the mastery check runs against the freshly updated exercise_type_progress data

## Tasks / Subtasks

- [ ] Task 1: Implement mastery calculation utility (AC: #1, #2, #3)
  - [ ] 1.1 Create `dangdai-mobile/lib/masteryCalculation.ts` with pure functions:
    - `calculateCompletionPercentage(progressRows: ExerciseTypeProgressRow[]): number` — formula: `(typesAttempted / 7) * (averageBestScore / 100) * 100`, clamped 0–100
    - `checkMasteryThreshold(progressRows: ExerciseTypeProgressRow[]): { isMastered: boolean; typesAttempted: number; averageScore: number }` — returns true when ≥4 types AND ≥80% average
    - `getUnattemptedExerciseTypes(progressRows: ExerciseTypeProgressRow[]): ExerciseType[]` — returns list of types not yet attempted (for encouragement messaging)
  - [ ] 1.2 Export `MASTERY_MIN_TYPES = 4` and `MASTERY_MIN_SCORE = 80` as named constants
  - [ ] 1.3 Handle edge cases: empty progressRows returns 0% and not mastered; single type at 100% returns ~14.3% completion

- [ ] Task 2: Create `useUpdateChapterProgress` mutation hook (AC: #1, #4)
  - [ ] 2.1 Add `useUpdateChapterProgress()` mutation to `dangdai-mobile/hooks/useChapterProgress.ts`
  - [ ] 2.2 Mutation parameters: `{ chapterId: number, bookId: number, completionPercentage: number, isMastered: boolean }`
  - [ ] 2.3 Upsert logic:
    - Fetch existing `chapter_progress` record via `.maybeSingle()`
    - If `isMastered && !existing?.mastered_at`: set `mastered_at = new Date().toISOString()` (first-time mastery)
    - If `existing?.mastered_at`: preserve existing `mastered_at` (already mastered — do not overwrite)
    - If `!isMastered`: set `mastered_at = null`
    - Always update `completion_percentage` and `updated_at`
  - [ ] 2.4 Upsert with `onConflict: 'user_id,chapter_id'` (unique constraint on chapter_progress table)
  - [ ] 2.5 On success, invalidate `queryKeys.chapterProgress(userId, bookId)` and `queryKeys.singleChapterProgress(userId, chapterId)` and `queryKeys.userProgress(userId)`
  - [ ] 2.6 Handle 42P01 gracefully (same pattern as useExerciseTypeProgress)

- [ ] Task 3: Integrate mastery calculation into CompletionScreen (AC: #1, #2, #3, #4, #5)
  - [ ] 3.1 In `CompletionScreen.tsx`, after the existing `useUpdateExerciseTypeProgress` mutation succeeds, run mastery calculation:
    - Wait for `exerciseTypeProgress` query to refetch (the mutation's `onSuccess` invalidates this cache)
    - Once refetched data is available, call `calculateCompletionPercentage()` and `checkMasteryThreshold()`
    - Call `useUpdateChapterProgress` mutation with computed values
  - [ ] 3.2 Add state: `const [masteryResult, setMasteryResult] = useState<{ isNewlyMastered: boolean; isMastered: boolean; typesAttempted: number; averageScore: number } | null>(null)`
  - [ ] 3.3 Determine `isNewlyMastered`: compare `chapter_progress.mastered_at` (from a query or the upsert response) with the mastery check result. If mastery is true AND `mastered_at` was previously null, then `isNewlyMastered = true`.
  - [ ] 3.4 For chapter_test (exerciseType === 'chapter_test'), the existing Task 7 from Story 5.1 upserts multiple exercise types. The mastery calculation must run AFTER all upserts complete. Use the refetched `exerciseTypeProgress` data (which is invalidated after each upsert) — the last upsert's invalidation triggers the final refetch.

- [ ] Task 4: Add encouragement messaging for non-mastered chapters (AC: #3)
  - [ ] 4.1 Create `MasteryEncouragement` sub-component in CompletionScreen.tsx
  - [ ] 4.2 When chapter is not mastered, show: "Try {unattemptedTypes[0]} or {unattemptedTypes[1]} next!" (pick first 2 unattempted types from canonical order)
  - [ ] 4.3 When ≥4 types attempted but average < 80%, show: "Almost there! Improve your {lowestScoreType} score to unlock mastery."
  - [ ] 4.4 Style: encouraging tone, `$colorSubtle` text, no negative framing

- [ ] Task 5: Add `MasteryResult` type for passing mastery state (AC: #2, #4)
  - [ ] 5.1 Add to `dangdai-mobile/types/chapter.ts`:
    ```typescript
    export interface MasteryResult {
      isMastered: boolean
      isNewlyMastered: boolean
      typesAttempted: number
      averageScore: number
      completionPercentage: number
    }
    ```
  - [ ] 5.2 Export from CompletionScreen for use by Story 5.3 (celebration variant)

- [ ] Task 6: Verify unique constraint on chapter_progress table (AC: #1, #4)
  - [ ] 6.1 Use Supabase MCP to verify `chapter_progress` has a unique constraint on `(user_id, chapter_id)` — if missing, add it via migration before implementing the upsert
  - [ ] 6.2 Verify `chapter_progress` RLS policy allows authenticated users to read/write their own rows

- [ ] Task 7: Write tests (AC: all)
  - [ ] 7.1 Unit tests for `masteryCalculation.ts`:
    - `calculateCompletionPercentage` with 0 types, 1 type, 4 types, 7 types
    - `checkMasteryThreshold` returns false for 3 types at 90%, true for 4 types at 80%, false for 4 types at 79%
    - `getUnattemptedExerciseTypes` returns correct types
    - Edge case: empty array
  - [ ] 7.2 Co-located test `masteryCalculation.test.ts` next to the source file
  - [ ] 7.3 Component tests for CompletionScreen mastery integration:
    - Test mastery calculation runs after exercise type progress refetch
    - Test `useUpdateChapterProgress` is called with correct completion percentage
    - Test encouragement message appears when not mastered
    - Test `isNewlyMastered` is true on first mastery, false on subsequent completions
  - [ ] 7.4 Hook test for `useUpdateChapterProgress`:
    - Test upsert creates record when none exists
    - Test upsert preserves `mastered_at` when already mastered
    - Test cache invalidation fires for correct query keys
    - Test 42P01 error handling
  - [ ] 7.5 Run `npx tsc` and `npx eslint . --ext .ts,.tsx` on mobile

## Dev Notes

### Current State of Code

| File | State | Action |
|------|-------|--------|
| `dangdai-mobile/hooks/useChapterProgress.ts` | 64 lines, read-only query hook, NO mutation | **Modify**: Add `useUpdateChapterProgress` mutation |
| `dangdai-mobile/components/quiz/CompletionScreen.tsx` | 434 lines, upserts exercise_type_progress only | **Modify**: Add mastery calculation after progress upsert, add encouragement section |
| `dangdai-mobile/hooks/useExerciseTypeProgress.ts` | 173 lines, complete | **No change** — already upserts and invalidates correctly |
| `dangdai-mobile/types/chapter.ts` | 40 lines, has ChapterProgress interface | **Modify**: Add `MasteryResult` interface |
| `dangdai-mobile/lib/queryKeys.ts` | 67 lines | **No change** — already has `chapterProgress`, `singleChapterProgress`, `userProgress` keys |
| `dangdai-mobile/lib/masteryCalculation.ts` | Does not exist | **Create**: Pure mastery calculation functions |

### Mastery Calculation Formula

**Completion Percentage:**
```
typesAttempted = count of exercise_type_progress rows with attempts_count > 0
averageBestScore = average of best_score across attempted types
completionPercentage = (typesAttempted / 7) * (averageBestScore / 100) * 100
```

Examples:
- 1 type at 100% → (1/7) × 1.0 × 100 = **14.3%**
- 4 types at 80% avg → (4/7) × 0.8 × 100 = **45.7%**
- 7 types at 80% avg → (7/7) × 0.8 × 100 = **80.0%**
- 4 types at 100% avg → (4/7) × 1.0 × 100 = **57.1%**

**Mastery Threshold:**
```
isMastered = typesAttempted >= 4 AND averageBestScore >= 80
```

### Previous Story Intelligence (from Story 5.1)

Story 5.1 is `ready-for-dev` (not yet implemented). Key design decisions from 5.1 that affect 5.2:

1. **Chapter test upserts multiple exercise types:** Story 5.1 Task 7 groups chapter_test answers by exercise_type and calls `useUpdateExerciseTypeProgress` in a loop. Story 5.2 must ensure mastery calculation runs AFTER all upserts complete.
2. **Exercise type switching already works in play.tsx:** The quiz play screen renders per-question based on `currentQuestion.exercise_type`. No changes needed in play.tsx for mastery.
3. **FR30 is deferred to 5.2 and 5.3:** Story 5.1 explicitly defers mastery status display and calculation.

### Architecture Compliance

**Technical Stack (no changes):**
- Mobile: React Native / Expo, TypeScript strict mode, Tamagui, TanStack Query v5, Zustand v5
- Database: Supabase PostgreSQL with RLS

**Database:**
- `chapter_progress` table already exists with `completion_percentage`, `mastered_at`, `book_id`, `chapter_id`, `user_id` columns
- Need to verify unique constraint on `(user_id, chapter_id)` — use Supabase MCP tool before implementing upsert
- No new tables or columns needed

**Cache Invalidation Chain:**
1. `useUpdateExerciseTypeProgress.onSuccess` → invalidates `exerciseTypeProgress(chapterId)`, `chapterProgress(userId, bookId)`, `userProgress(userId)`
2. `useUpdateChapterProgress.onSuccess` → invalidates `chapterProgress(userId, bookId)`, `singleChapterProgress(userId, chapterId)`, `userProgress(userId)`
3. Chapter list screen (`useChapterProgress`) will auto-refetch and show updated mastery indicators

### Interaction with Story 5.3 (Celebration)

Story 5.2 computes mastery state and exposes `MasteryResult` (with `isNewlyMastered` boolean). Story 5.3 consumes this to render the celebration variant of CompletionScreen. This story does NOT implement the celebration UI — it provides the data layer.

Specifically:
- Story 5.2: Adds `masteryResult` state to CompletionScreen, shows encouragement messaging for non-mastered
- Story 5.3: Enhances CompletionScreen with celebration variant when `isNewlyMastered === true` (Theme success wrapper, badge, achievement sound)

### Seeding Script Patterns (required for any Python seeding/LLM extraction story)

Not applicable — this story is mobile-only, no seeding scripts involved.

### Mobile Hook Patterns (required for any TanStack Query hook story)

1. **queryKeys factory** — `useUpdateChapterProgress` MUST use `queryKeys.chapterProgress()` and `queryKeys.singleChapterProgress()` for cache invalidation. These keys already exist in `lib/queryKeys.ts` — no additions needed.
2. **staleTime for dynamic content** — Chapter progress is dynamic (changes after every quiz). Keep the existing 2-minute staleTime in `useChapterProgress`.

[Source: epic-11-retro-2026-03-09.md#3.3, 3.4]

### Mobile Component Patterns (required for any pressable component story)

No new pressable components in this story. The encouragement section is display-only.

[Source: epic-11-retro-2026-03-09.md#3.5, 3.8]

### Project Structure Notes

**Files to create:**
```
dangdai-mobile/lib/masteryCalculation.ts          # Pure mastery calculation functions
dangdai-mobile/lib/masteryCalculation.test.ts      # Co-located unit tests
```

**Files to modify:**
```
dangdai-mobile/hooks/useChapterProgress.ts         # Add useUpdateChapterProgress mutation
dangdai-mobile/components/quiz/CompletionScreen.tsx # Integrate mastery calc + encouragement
dangdai-mobile/types/chapter.ts                    # Add MasteryResult interface
```

**No changes to:**
```
dangdai-mobile/hooks/useExerciseTypeProgress.ts    # Already invalidates chapterProgress
dangdai-mobile/lib/queryKeys.ts                    # Already has all needed keys
dangdai-mobile/stores/useQuizStore.ts              # No mastery state needed in store
```

### Edge Cases to Handle

1. **Empty exercise_type_progress (new chapter):** No rows exist for this chapter. `calculateCompletionPercentage` returns 0, `checkMasteryThreshold` returns false. No chapter_progress upsert needed (or upsert with 0% and null mastered_at).

2. **chapter_test with fewer than 4 types:** A chapter test may generate questions from only 3-4 exercise types. Mastery depends on the total types attempted across ALL quizzes for the chapter, not just the chapter test.

3. **Race condition on multi-type upsert (Story 5.1):** When chapter_test upserts 5 exercise types in sequence, each upsert invalidates the `exerciseTypeProgress` cache. The mastery calculation should use the FINAL refetched data. Use `onSettled` callback or `useEffect` triggered by refetched data to ensure all upserts are complete before calculating mastery.

4. **Concurrent quiz completions:** Two quizzes completing simultaneously for the same chapter could race on `chapter_progress` upsert. The `onConflict` clause handles this — last write wins, which is acceptable since both computations use the latest `exercise_type_progress` data.

5. **42P01 table missing:** Handle gracefully in both the query and mutation (same pattern as `useExerciseTypeProgress`).

### Anti-Patterns to Avoid

- **DO NOT** compute mastery on the backend — it's a mobile-only calculation from `exercise_type_progress` data already in TanStack Query cache
- **DO NOT** add mastery state to Zustand quiz store — it's derived state from server data, belongs in TanStack Query layer
- **DO NOT** block CompletionScreen rendering on mastery calculation — show the screen immediately, update mastery state asynchronously
- **DO NOT** use inline query key arrays — always use `queryKeys` factory
- **DO NOT** call hooks conditionally — Rules of Hooks
- **DO NOT** use hardcoded hex colors — Tamagui theme tokens only
- **DO NOT** implement celebration UI in this story — that's Story 5.3

### Dependencies

- **Depends on:** Epic 4 complete (exercise_type_progress functional) ✅
- **Depends on:** Story 1.3 (chapter_progress table exists) ✅
- **Depends on:** Story 5.1 (chapter_test generates multi-type results) — soft dependency (5.2 works independently for single-type quizzes; chapter_test integration tested after 5.1 is implemented)
- **Blocks:** Story 5.3 (Chapter Mastery Celebration) — needs `MasteryResult` from 5.2

### References

- [Source: epics.md#Story-5.2] — Story requirements and acceptance criteria
- [Source: epics.md#Epic-5] — Epic goal: chapter assessment spanning multiple exercise types
- [Source: architecture.md#Data-Architecture] — chapter_progress "calculated from exercise_type_progress"
- [Source: architecture.md#line-245] — "Chapter mastery requires ≥4 of 7 types attempted with ≥80% average"
- [Source: prd.md#FR30] — User sees mastery status and per-type breakdown
- [Source: ux-design-specification.md#Journey-4] — Chapter completion mastery flow
- [Source: hooks/useChapterProgress.ts] — Read-only hook, needs mutation added
- [Source: hooks/useExerciseTypeProgress.ts] — Existing upsert pattern to follow
- [Source: components/quiz/CompletionScreen.tsx] — Current completion screen to extend
- [Source: epic-4-retro-2026-03-14.md] — Epic 5 preparation notes

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
