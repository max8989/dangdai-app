# Story 5.3: Chapter Mastery Celebration (Per-Type Breakdown)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to receive a special celebration when I master a chapter with a per-exercise-type breakdown,
So that I feel accomplished and see which types I've mastered.

## Acceptance Criteria

1. **Given** I achieve chapter mastery (≥4 types attempted, ≥80% average best_score)
   **When** this is my first time mastering the chapter (`isNewlyMastered === true` from Story 5.2)
   **Then** I see an enhanced celebration screen with:
   - `<Theme name="success">` wrapper on the entire CompletionScreen
   - "Chapter Mastered!" title instead of "Exercise Complete!"
   - A trophy/badge element with `animation="bouncy"` entrance
   - A per-exercise-type breakdown showing each type's score with checkmarks for mastered types (≥80%)
   - A special achievement sound (distinct from regular `celebration` sound)

2. **Given** I achieve chapter mastery for the first time
   **When** the celebration screen loads
   **Then** the per-exercise-type breakdown shows: type label, best_score %, and status indicator:
   - `✓` green for mastered types (≥80%)
   - Score in teal for in-progress types (attempted, <80%)
   - "New" in gray for unattempted types
   **And** the just-completed type is highlighted with primary theme left border (existing pattern)

3. **Given** I redo a mastered chapter (chapter was already mastered before this quiz)
   **When** the quiz completes
   **Then** I see the normal completion screen ("Exercise Complete!", no success theme wrapper, no achievement sound)
   **And** the per-exercise-type progress list still updates with my new score

4. **Given** I complete a quiz but do NOT achieve mastery (insufficient types or <80% average)
   **When** the completion screen loads
   **Then** I see the standard completion screen with encouragement messaging from Story 5.2
   **And** no achievement sound plays, no success theme wrapper, title is "Exercise Complete!"

5. **Given** I am on the mastery celebration screen
   **When** I tap "Continue"
   **Then** I am navigated back to the Exercise Type Selection screen (same behavior as normal completion)

## Tasks / Subtasks

- [ ] Task 1: Add `achievement` sound asset and update useSound (AC: #1, #3, #4)
  - [ ] 1.1 Add `achievement.mp3` file to `dangdai-mobile/assets/sounds/` — use a short achievement fanfare sound (2-3 seconds, uplifting tone, distinct from existing `celebration.mp3`)
  - [ ] 1.2 In `dangdai-mobile/hooks/useSound.ts`, add `'achievement'` to the `SoundName` union type: `export type SoundName = 'correct' | 'incorrect' | 'celebration' | 'achievement'`
  - [ ] 1.3 Add entry to `SOUND_ASSETS` map: `achievement: require('../assets/sounds/achievement.mp3') as number`
  - [ ] 1.4 No other changes to useSound.ts — the existing `preloadSounds()` and `playSound()` will automatically handle the new sound since they iterate over `SOUND_ASSETS`

- [ ] Task 2: Create MasteryBadge sub-component (AC: #1)
  - [ ] 2.1 Create `MasteryBadge` as a private sub-component inside `CompletionScreen.tsx` (not a separate file — follows existing pattern of StatsCard, WeaknessSummary, StruggledWithSection)
  - [ ] 2.2 Visual design:
    - Trophy emoji (🏆) displayed large (`fontSize="$10"`, ~80px)
    - Entrance animation: `animation="bouncy"` with `enterStyle={{ scale: 0, rotate: '-20deg' }}`
    - Sits above the "Chapter Mastered!" title
  - [ ] 2.3 Below the trophy, show chapter context: "Chapter {chapterNumber} Mastered!" in bold
  - [ ] 2.4 Add `testID="mastery-badge"` for testing

- [ ] Task 3: Enhance CompletionScreen with mastery celebration variant (AC: #1, #2, #3, #4)
  - [ ] 3.1 Add `masteryResult` to `CompletionScreenProps`:
    ```typescript
    /** Mastery calculation result from Story 5.2 */
    masteryResult?: MasteryResult | null
    ```
  - [ ] 3.2 Derive `isNewlyMastered` from `masteryResult?.isNewlyMastered ?? false`
  - [ ] 3.3 When `isNewlyMastered === true`:
    - Wrap the outer `YStack` content in `<Theme name="success">` (the UX spec mandates this for the mastery variant)
    - Replace "Exercise Complete!" title with "Chapter Mastered!" (keep same font styling `fontSize="$8"`, `fontWeight="bold"`)
    - Render `<MasteryBadge chapterNumber={chapterNumber} />` above the title
    - Play `achievement` sound on mount (via `playSound('achievement')` in the existing useEffect, or a separate one)
  - [ ] 3.4 When `isNewlyMastered === false` (including already-mastered chapters):
    - Render existing "Exercise Complete!" screen unchanged
    - Do NOT wrap in success theme
    - Do NOT play achievement sound
    - Do NOT render MasteryBadge
  - [ ] 3.5 The `ExerciseTypeProgressList` component already handles per-type progress bars with mastered/in-progress/new indicators and highlight — no changes needed to that component

- [ ] Task 4: Play achievement sound on mastery (AC: #1, #3, #4)
  - [ ] 4.1 In the CompletionScreen mount useEffect (or a new separate useEffect), add:
    ```typescript
    useEffect(() => {
      if (isNewlyMastered) {
        void playSound('achievement')
      }
    }, [isNewlyMastered])
    ```
  - [ ] 4.2 Ensure the `preloadSounds()` call in `play.tsx` runs before CompletionScreen mounts — it already does (play.tsx calls preloadSounds on mount, CompletionScreen renders later when isComplete is true)
  - [ ] 4.3 Do NOT play both `celebration` and `achievement` — the achievement sound replaces the celebration sound for mastery completions

- [ ] Task 5: Update CompletionScreen title logic (AC: #1, #3, #4)
  - [ ] 5.1 The title text should be:
    - `isNewlyMastered && exerciseType === 'chapter_test'` → "Chapter Test Mastered!"
    - `isNewlyMastered && exerciseType !== 'chapter_test'` → "Chapter Mastered!"
    - `exerciseType === 'chapter_test' && !isNewlyMastered` → "Chapter Test Complete!"
    - Default → "Exercise Complete!" (existing behavior)
  - [ ] 5.2 Keep the existing `testID="completion-title"` for backward compatibility

- [ ] Task 6: Write tests (AC: all)
  - [ ] 6.1 CompletionScreen tests (`CompletionScreen.test.tsx`):
    - Test: when `masteryResult.isNewlyMastered === true`, "Chapter Mastered!" title renders
    - Test: when `masteryResult.isNewlyMastered === true`, `mastery-badge` testID is in the tree
    - Test: when `masteryResult.isNewlyMastered === false`, "Exercise Complete!" title renders
    - Test: when `masteryResult` is null/undefined, "Exercise Complete!" title renders (backward compat)
    - Test: when `exerciseType === 'chapter_test'` and not mastered, "Chapter Test Complete!" renders
    - Test: `playSound` is called with `'achievement'` when `isNewlyMastered === true`
    - Test: `playSound` is NOT called with `'achievement'` when `isNewlyMastered === false`
  - [ ] 6.2 MasteryBadge sub-component tests:
    - Test: trophy emoji renders
    - Test: chapter number is displayed
    - Test: `animation="bouncy"` is applied (check enterStyle in snapshot or props)
  - [ ] 6.3 useSound tests (update existing test if present):
    - Test: `SoundName` type includes `'achievement'`
    - Test: `SOUND_ASSETS` has 4 entries (correct, incorrect, celebration, achievement)
  - [ ] 6.4 Integration test:
    - Test: full CompletionScreen render with mastery → badge visible, title correct, sound played
    - Test: full CompletionScreen render without mastery → standard screen, no badge
  - [ ] 6.5 Run `npx tsc` and `npx eslint . --ext .ts,.tsx` on mobile

## Dev Notes

### Current State of Code

| File | State | Action |
|------|-------|--------|
| `dangdai-mobile/components/quiz/CompletionScreen.tsx` | 434 lines, no mastery variant | **Modify**: Add MasteryBadge, success theme wrapper, title logic, achievement sound |
| `dangdai-mobile/hooks/useSound.ts` | 135 lines, 3 sounds (correct, incorrect, celebration) | **Modify**: Add `'achievement'` to SoundName and SOUND_ASSETS |
| `dangdai-mobile/assets/sounds/` | 3 files: correct.mp3, incorrect.mp3, celebration.mp3 | **Add**: `achievement.mp3` |
| `dangdai-mobile/components/quiz/ExerciseTypeProgressList.tsx` | 214 lines, complete | **No change** — already shows per-type breakdown with mastered/in-progress/new indicators |
| `dangdai-mobile/components/quiz/PointsCounter.tsx` | 122 lines, complete | **No change** — count-up animation already works |
| `dangdai-mobile/types/chapter.ts` | Updated by Story 5.2 with MasteryResult | **No change** — import MasteryResult from types |

### Achievement Sound Asset

The `achievement.mp3` file must be:
- **Duration:** 2-3 seconds (short fanfare, not looping)
- **Character:** Uplifting, celebratory, distinct from the existing `celebration.mp3` (which is a simpler "success" chime)
- **Format:** MP3, reasonable file size (<200KB)
- **Source:** Use a royalty-free achievement/fanfare sound effect. If no suitable file is available at dev time, copy `celebration.mp3` as a placeholder and add a TODO comment to replace it with a proper achievement sound.

### CompletionScreen Rendering Flow (Updated)

```
CompletionScreen mounts
  ├── useEffect: upsert exercise_type_progress (existing, Story 4.11)
  ├── useEffect: run mastery calculation (Story 5.2)
  │     ├── calculateCompletionPercentage(exerciseTypeProgress)
  │     ├── checkMasteryThreshold(exerciseTypeProgress)
  │     └── upsert chapter_progress via useUpdateChapterProgress
  ├── masteryResult state is set
  ├── if isNewlyMastered:
  │     ├── playSound('achievement')  ← Story 5.3
  │     ├── <Theme name="success">    ← Story 5.3
  │     ├── <MasteryBadge />          ← Story 5.3
  │     └── Title: "Chapter Mastered!"
  └── else:
        ├── No achievement sound
        ├── No success theme wrapper
        └── Title: "Exercise Complete!"
```

### UX Spec Animation Sequence (from ux-design-specification.md)

The CompletionScreen already implements the base animation sequence (Story 4.11):
1. Screen slides up (`enterStyle={{ opacity: 0, y: 50 }}`)
2. Points count up (PointsCounter with Reanimated withTiming)
3. Stats fade in (StatsCard with `enterStyle={{ opacity: 0 }}`)
4. Continue button appears (`enterStyle={{ opacity: 0, y: 10 }}`)

**Story 5.3 adds for mastery variant:**
- Step 1.5: MasteryBadge bounces in (`animation="bouncy"`, `enterStyle={{ scale: 0, rotate: '-20deg' }}`) — appears between the screen slide-up and the title
- The `<Theme name="success">` wrapper changes the color context — `$background` becomes success-tinted, `$color` shifts to success text color, `$borderColor` picks up success green

### Tamagui Theme Wrapping Pattern

The success theme wrapper is a well-established pattern in this codebase:
```tsx
// From WeaknessSummary in CompletionScreen.tsx (line 240-245):
if (isImproving) {
  return (
    <Theme name="success">
      {content}
    </Theme>
  )
}

// From ExerciseTypeProgressList.tsx (line 172-178):
if (isHighlighted) {
  return (
    <Theme name="primary">
      {rowContent}
    </Theme>
  )
}
```

For mastery, wrap the entire CompletionScreen content:
```tsx
const content = (
  <YStack ...>
    {isNewlyMastered && <MasteryBadge chapterNumber={chapterNumber} />}
    <Text ...>{title}</Text>
    <PointsCounter ... />
    ...
  </YStack>
)

return (
  <ScrollView ...>
    <AnimatePresence>
      {isNewlyMastered ? (
        <Theme name="success">{content}</Theme>
      ) : (
        content
      )}
    </AnimatePresence>
  </ScrollView>
)
```

### Previous Story Intelligence (from Story 5.2)

Story 5.2 provides:
- `MasteryResult` type in `types/chapter.ts` with `isNewlyMastered`, `isMastered`, `typesAttempted`, `averageScore`, `completionPercentage`
- `masteryResult` state computed inside CompletionScreen after exercise type progress refetch
- `useUpdateChapterProgress` mutation hook
- `calculateCompletionPercentage()` and `checkMasteryThreshold()` utility functions

Story 5.3 consumes `masteryResult` (already available in CompletionScreen scope from 5.2) and adds the visual/audio celebration layer.

### Seeding Script Patterns (required for any Python seeding/LLM extraction story)

Not applicable — this story is mobile-only UI, no seeding scripts involved.

[Source: epic-11-retro-2026-03-09.md#3.1, 3.2, 3.7, 4.3]

### Mobile Hook Patterns (required for any TanStack Query hook story)

No new TanStack Query hooks in this story. `useSound` is not a TanStack hook — it's a custom hook using expo-av. No `queryKeys` changes needed.

[Source: epic-11-retro-2026-03-09.md#3.3, 3.4]

### Mobile Component Patterns (required for any pressable component story)

No new pressable components. The MasteryBadge is display-only. The Continue button already has `accessibilityRole` and `accessibilityLabel` from Story 4.11.

[Source: epic-11-retro-2026-03-09.md#3.5, 3.8]

### Project Structure Notes

**Files to create:**
```
dangdai-mobile/assets/sounds/achievement.mp3       # Achievement fanfare sound
```

**Files to modify:**
```
dangdai-mobile/components/quiz/CompletionScreen.tsx # MasteryBadge, success theme, title, sound
dangdai-mobile/hooks/useSound.ts                   # Add 'achievement' to SoundName + SOUND_ASSETS
```

**No changes to:**
```
dangdai-mobile/components/quiz/ExerciseTypeProgressList.tsx  # Already handles per-type breakdown
dangdai-mobile/components/quiz/PointsCounter.tsx            # Already handles count-up
dangdai-mobile/types/chapter.ts                             # MasteryResult added by Story 5.2
dangdai-mobile/lib/masteryCalculation.ts                    # Created by Story 5.2
dangdai-mobile/hooks/useChapterProgress.ts                  # Mutation added by Story 5.2
dangdai-mobile/hooks/useExerciseTypeProgress.ts             # No changes
dangdai-mobile/lib/queryKeys.ts                             # No changes
```

### Edge Cases to Handle

1. **masteryResult is null/undefined (backward compatibility):** When CompletionScreen is rendered without Story 5.2's mastery integration (e.g., if 5.2 isn't deployed yet), `masteryResult` prop is undefined. Treat as non-mastery — render standard "Exercise Complete!" screen. This ensures the component doesn't break if deployed before Story 5.2.

2. **Sound not preloaded:** If `achievement.mp3` fails to preload (asset missing, audio system error), `playSound('achievement')` gracefully no-ops (existing try/catch in useSound handles this). The celebration screen still renders correctly without sound.

3. **Chapter test mastery:** When `exerciseType === 'chapter_test'` and mastery is achieved, the title should be "Chapter Test Mastered!" to distinguish from regular exercise mastery. Both trigger the same celebration visual treatment.

4. **Dark mode:** The `<Theme name="success">` wrapper respects both `light_success` and `dark_success` sub-themes (configured in Story 1.1b). No hardcoded colors needed.

5. **Re-render during animation:** The MasteryBadge uses Tamagui declarative animations (`animation="bouncy"`, `enterStyle`). These are idempotent and safe across re-renders — no manual animation cleanup needed.

### Anti-Patterns to Avoid

- **DO NOT** create a separate MasteryCelebrationScreen route — the celebration is a variant of CompletionScreen, rendered inside `play.tsx` via AnimatePresence (same as normal completion)
- **DO NOT** play both `celebration` and `achievement` sounds — achievement replaces celebration for mastery
- **DO NOT** use hardcoded hex colors — `<Theme name="success">` handles all color remapping
- **DO NOT** import Reanimated for the MasteryBadge — use Tamagui declarative `animation="bouncy"` with `enterStyle` instead (only PointsCounter uses raw Reanimated, for numeric interpolation)
- **DO NOT** add mastery state to Zustand quiz store — it's derived from server data via TanStack Query
- **DO NOT** modify ExerciseTypeProgressList — it already handles per-type breakdown correctly
- **DO NOT** use `useLayoutEffect` for sound — `useEffect` is sufficient and avoids SSR warnings
- **DO NOT** call hooks conditionally — Rules of Hooks (Epic 3 retro A9)

### Dependencies

- **Depends on:** Story 5.2 (Chapter Mastery Calculation) — provides `MasteryResult` type and `masteryResult` state in CompletionScreen
- **Depends on:** Story 4.11 (Quiz Results Screen) — CompletionScreen base implementation ✅
- **Depends on:** Story 4.9 (Immediate Answer Feedback) — useSound hook ✅
- **Depends on:** Story 1.1b (Tamagui sub-themes) — `<Theme name="success">` support ✅

### References

- [Source: epics.md#Story-5.3] — Story requirements and acceptance criteria
- [Source: epics.md#Epic-5] — Epic goal: chapter assessment and mastery celebration
- [Source: ux-design-specification.md#Journey-4] — Chapter mastery celebration flow, animation sequence
- [Source: ux-design-specification.md#CompletionScreen-variants] — Normal vs chapter mastery variants
- [Source: ux-design-specification.md#Sound-Patterns] — Achievement fanfare sound (distinct from regular)
- [Source: prd.md#FR30] — User sees mastery status and per-type breakdown
- [Source: hooks/useSound.ts] — Sound management, SoundName union, SOUND_ASSETS map
- [Source: components/quiz/CompletionScreen.tsx] — Current 434-line implementation to extend
- [Source: components/quiz/ExerciseTypeProgressList.tsx] — Per-type progress bars (no changes needed)
- [Source: components/quiz/PointsCounter.tsx] — Animation pattern reference

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
