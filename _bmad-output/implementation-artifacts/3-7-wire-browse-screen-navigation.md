# Story 3.7: Wire Browse Screen Navigation from Exercise Type Selection

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to navigate to vocabulary, grammar, and dialogue browse screens from the Exercise Type Selection screen,
so that I can study chapter content directly without starting a quiz.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** the screen loads
   **Then** I see navigation entry points for "Browse Vocabulary", "Browse Grammar", and "Browse Dialogues"
   **And** each entry point is only visible when that content exists for the chapter (graceful degradation)

2. **Given** I tap "Browse Vocabulary"
   **When** navigation completes
   **Then** I am taken to `app/chapter/[chapterId]/vocabulary.tsx` for that chapter
   **And** the vocabulary screen (`testID="vocabulary-screen"`) renders successfully

3. **Given** I tap "Browse Grammar"
   **When** navigation completes
   **Then** I am taken to `app/chapter/[chapterId]/grammar.tsx` for that chapter
   **And** the grammar screen (`testID="grammar-screen"`) renders successfully

4. **Given** I tap "Browse Dialogues"
   **When** navigation completes
   **Then** I am taken to `app/chapter/[chapterId]/dialogues.tsx` for that chapter
   **And** the dialogues screen (`testID="dialogues-screen"`) renders successfully

5. **Given** a chapter has no vocabulary/grammar/dialogue data yet
   **When** the Exercise Type Selection screen loads
   **Then** the corresponding browse entry point is hidden (graceful degradation, matching 42P01 pattern from Stories 11.5–11.7)

## Tasks / Subtasks

- [ ] Task 1: Add content availability hooks for conditional browse button visibility (AC: #1, #5)
  - [ ] 1.1 Add `useVocabularyCount(bookId, lessonId)` to `hooks/useVocabulary.ts` — queries `vocabulary` table with `.count()`, returns `count > 0`, handles 42P01 gracefully
  - [ ] 1.2 Add `useGrammarPointsCount(bookId, lessonId)` to `hooks/useGrammarPoints.ts` — same pattern
  - [ ] 1.3 Add `useDialoguesCount(bookId, lessonId)` to `hooks/useDialogues.ts` — same pattern
  - [ ] 1.4 Add `queryKeys` entries for each count hook: `vocabularyCount(bookId, lessonId)`, `grammarPointsCount(bookId, lessonId)`, `dialoguesCount(bookId, lessonId)` in `lib/queryKeys.ts`
  - [ ] 1.5 Use `staleTime: 1000 * 60 * 30` on all count hooks (static content, same as the data hooks)

- [ ] Task 2: Update `exercises.tsx` to conditionally show browse buttons (AC: #1, #5)
  - [ ] 2.1 Import the three count hooks in `exercises.tsx`
  - [ ] 2.2 Invoke `useVocabularyCount`, `useGrammarPointsCount`, `useDialoguesCount` (always called unconditionally — Rules of Hooks)
  - [ ] 2.3 Conditionally render each browse button only when its count returns `true` (content exists)
  - [ ] 2.4 Keep the `browse-buttons` container (`testID="browse-buttons"`) rendered only if at least one browse button is visible; hide entirely if none
  - [ ] 2.5 Keep existing `testID` attributes (`browse-vocabulary-button`, `browse-grammar-button`, `browse-dialogues-button`) for test compatibility

- [ ] Task 3: Update `exercises.test.tsx` for conditional visibility (AC: #1, #5)
  - [ ] 3.1 Add mock stubs for the three new count hooks
  - [ ] 3.2 Update existing browse button tests: mock `useVocabularyCount` → `{ data: true }` (content exists) to keep current behavior
  - [ ] 3.3 Add tests: when count returns `false` or `0`, browse button is NOT rendered (hidden)
  - [ ] 3.4 Add test: when all three counts are `false`, the `browse-buttons` container is hidden

- [ ] Task 4: End-to-end validation via existing E2E tests (AC: #2, #3, #4)
  - [ ] 4.1 Verify existing E2E tests in `tests/epic-3-exercise-type-selection.test.ts` pass — they already test navigation to vocabulary/grammar/dialogues screens
  - [ ] 4.2 The existing E2E tests navigate to `vocabulary-screen`, `grammar-screen`, `dialogues-screen` — these routes are confirmed working (Stories 11.5–11.7)
  - [ ] 4.3 No new E2E tests required; existing coverage is sufficient (already tests full navigation flow including back navigation)

- [ ] Task 5: TypeScript type-check and lint (AC: all)
  - [ ] 5.1 Run `npx tsc` — zero errors
  - [ ] 5.2 Run `npx eslint . --ext .ts,.tsx` — zero warnings/errors on new code
  - [ ] 5.3 Run `npx jest` — all tests pass

## Dev Notes

### Current State (Critical Context)

**Story 3.5 already wired the browse navigation** in `exercises.tsx` (commit `c02b780`). The current implementation:
- Has all three browse buttons always visible (no conditional rendering)
- Navigation calls `router.push('/chapter/${chapterIdNum}/vocabulary|grammar|dialogues')` — correct
- Has `testID="browse-vocabulary-button"`, `testID="browse-grammar-button"`, `testID="browse-dialogues-button"`

**The three browse screens are complete and tested** (Stories 11.5–11.7):
- `app/chapter/[chapterId]/vocabulary.tsx` — `testID="vocabulary-screen"` — 37 passing tests
- `app/chapter/[chapterId]/grammar.tsx` — `testID="grammar-screen"` — 49 passing tests
- `app/chapter/[chapterId]/dialogues.tsx` — `testID="dialogues-screen"` — 57 passing tests

**This story's primary work** is adding conditional visibility for the browse buttons based on whether content exists for the chapter, and updating the test suite to validate that behavior.

### Architecture: Count Hook Pattern

Follow the exact same pattern as the data hooks in `hooks/useVocabulary.ts`, `hooks/useGrammarPoints.ts`, `hooks/useDialogues.ts`.

```typescript
// Example: useVocabularyCount (add to hooks/useVocabulary.ts)
export function useVocabularyCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.vocabularyCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)

      if (error) {
        if (error.code === '42P01') {
          console.warn('vocabulary table not found - returning false')
          return false
        }
        throw error
      }
      return (count ?? 0) > 0
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 min — static textbook content
  })
}
```

Same pattern for `useGrammarPointsCount` and `useDialoguesCount`.

### queryKeys Factory Updates

Add to `lib/queryKeys.ts`:
```typescript
// Content availability (Story 3.7)
vocabularyCount: (bookId: number, lessonId: number) => ['vocabularyCount', bookId, lessonId] as const,
grammarPointsCount: (bookId: number, lessonId: number) => ['grammarPointsCount', bookId, lessonId] as const,
dialoguesCount: (bookId: number, lessonId: number) => ['dialoguesCount', bookId, lessonId] as const,
```

**MANDATORY** — per epic-11 retro A3: all new hooks MUST add their key to the `queryKeys` factory in `lib/queryKeys.ts`. Never use inline arrays.

### exercises.tsx Conditional Rendering Pattern

```tsx
// In ExercisesScreen — always call hooks unconditionally (Rules of Hooks)
const { data: hasVocabulary } = useVocabularyCount(bookId, lessonId)
const { data: hasGrammar } = useGrammarPointsCount(bookId, lessonId)
const { data: hasDialogues } = useDialoguesCount(bookId, lessonId)

const hasBrowseContent = hasVocabulary || hasGrammar || hasDialogues

// In render:
{hasBrowseContent && (
  <XStack gap="$2" testID="browse-buttons">
    {hasVocabulary && (
      <Button
        flex={1}
        size="$3"
        icon={<BookOpen size={16} />}
        onPress={() => router.push(`/chapter/${chapterIdNum}/vocabulary`)}
        testID="browse-vocabulary-button"
        chromeless
        bordered
      >
        Vocabulary
      </Button>
    )}
    {hasGrammar && (
      <Button
        flex={1}
        size="$3"
        icon={<MessageSquare size={16} />}
        onPress={() => router.push(`/chapter/${chapterIdNum}/grammar`)}
        testID="browse-grammar-button"
        chromeless
        bordered
      >
        Grammar
      </Button>
    )}
    {hasDialogues && (
      <Button
        flex={1}
        size="$3"
        icon={<MessageCircle size={16} />}
        onPress={() => router.push(`/chapter/${chapterIdNum}/dialogues`)}
        testID="browse-dialogues-button"
        chromeless
        bordered
      >
        Dialogues
      </Button>
    )}
  </XStack>
)}
```

### Project Structure Notes

**Files to modify:**
- `dangdai-mobile/hooks/useVocabulary.ts` — add `useVocabularyCount`
- `dangdai-mobile/hooks/useGrammarPoints.ts` — add `useGrammarPointsCount`
- `dangdai-mobile/hooks/useDialogues.ts` — add `useDialoguesCount`
- `dangdai-mobile/lib/queryKeys.ts` — add `vocabularyCount`, `grammarPointsCount`, `dialoguesCount`
- `dangdai-mobile/app/chapter/[chapterId]/exercises.tsx` — import count hooks, conditional rendering
- `dangdai-mobile/app/chapter/[chapterId]/exercises.test.tsx` — mock count hooks, add conditional tests

**Files NOT to modify:**
- `app/chapter/[chapterId]/vocabulary.tsx` — complete, no changes needed
- `app/chapter/[chapterId]/grammar.tsx` — complete, no changes needed
- `app/chapter/[chapterId]/dialogues.tsx` — complete, no changes needed
- `tests/epic-3-exercise-type-selection.test.ts` — existing E2E tests already cover navigation
- `hooks/useChapters.ts`, `constants/books.ts`, `constants/chapters.ts` — not touched

**No new screens, no new routes, no new components needed.**

### Seeding Script Patterns (required for any Python seeding/LLM extraction story)

Not applicable — this is a mobile UI story only.

### Mobile Hook Patterns (required for any TanStack Query hook story)

1. **queryKeys factory** — All three new count hooks MUST add their keys to `lib/queryKeys.ts`.
   Never use inline arrays like `['vocabularyCount', bookId, lessonId]` directly.
   [Source: epic-11-retro-2026-03-09.md#3.3]

2. **staleTime for static content** — All count hooks query static textbook content.
   Use `staleTime: 1000 * 60 * 30` (30 minutes) on all three.
   [Source: epic-11-retro-2026-03-09.md#3.4]

### Mobile Component Patterns (required for any pressable component story)

Not applicable — browse buttons are already implemented in Story 3.5; this story adds conditional visibility only. No new pressable components.

### Key Gotchas / Anti-Patterns

- **DO NOT** remove the existing `router.push` navigation calls — they are correct and work
- **DO NOT** move browse button `testID` attributes — existing E2E tests depend on them
- **DO NOT** inline query keys — add to `queryKeys` factory
- **DO NOT** skip `enabled: !!bookId && !!lessonId` guard — prevents queries with 0 as IDs
- **DO NOT** break the Rules of Hooks — call all three count hooks unconditionally before any conditional returns
- The count hooks should use `{ count: 'exact', head: true }` for an efficient HEAD query (no rows returned, only count metadata). This is the Supabase pattern for checking existence without fetching data.
- When `hasVocabulary/hasGrammar/hasDialogues` is `undefined` (loading state), treat as falsy — buttons hidden during load. This is the correct UX (don't flash buttons while loading).

### Dependencies

- **Depends on:** Story 3.5 (Exercise Type Selection Screen — done), Stories 11.5, 11.6, 11.7 (browse screens — done)
- **Blocks:** None

### References

- [Source: epics.md#Story-3.7] — Story requirements and rationale
- [Source: epic-11-retro-2026-03-09.md#3.8, #7.2, A7] — Action item to wire browse navigation
- [Source: app/chapter/[chapterId]/exercises.tsx] — Existing browse button implementation (always visible)
- [Source: app/chapter/[chapterId]/vocabulary.tsx] — Target screen, `testID="vocabulary-screen"`
- [Source: app/chapter/[chapterId]/grammar.tsx] — Target screen, `testID="grammar-screen"`
- [Source: app/chapter/[chapterId]/dialogues.tsx] — Target screen, `testID="dialogues-screen"`
- [Source: tests/epic-3-exercise-type-selection.test.ts] — Existing E2E tests (already cover browse navigation)
- [Source: hooks/useVocabulary.ts] — Pattern for count hook (42P01 handling, staleTime)
- [Source: lib/queryKeys.ts] — queryKeys factory to extend

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
