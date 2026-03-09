# Story 3.5: Exercise Type Selection Screen (Premade + AI-Generated)

Status: ready-for-dev

## Story

As a user,
I want to see premade workbook exercises and all AI exercise types for a chapter with per-type progress,
So that I can choose instant workbook practice or AI-generated exercises.

## Acceptance Criteria

1. **Given** I have selected a chapter
   **When** the Exercise Type Selection screen loads
   **Then** I see two sections:
     - **"Workbook Exercises" section** (if premade exercises exist for this chapter): A list of premade exercise cards showing title, exercise type, and completion status
     - **"AI-Generated Exercises" section**: A 2-column grid of 8 cards: "Mixed" + 7 exercise types

2. **Given** the AI-Generated Exercises section is displayed
   **When** I view the exercise type cards
   **Then** each card shows: exercise type icon, label, and progress indicator (%, "New", or checkmark)
   **And** the "Mixed" card is at top-left with distinct primary theme styling and subtitle "AI picks exercises based on your weak areas"

3. **Given** I tap a premade exercise card
   **When** the selection is registered
   **Then** I am taken to the premade exercise screen with exercises rendered locally (no LLM call)

4. **Given** I tap an AI exercise type card
   **When** the selection is registered
   **Then** quiz generation starts for that chapter + exercise type
   **And** I see the loading screen with progressive loading

5. **Given** I tap the "Mixed" card
   **When** the quiz is generated
   **Then** the AI selects exercise types biased toward my documented weak areas

6. **Given** premade exercise data is fetched from `premade_exercises` table
   **When** the screen loads
   **Then** premade exercises are displayed with their completion status from `exercise_type_progress`

## Tasks / Subtasks

- [ ] Task 1: Create Exercise Type Selection screen route (AC: #1, #2)
  - [ ] 1.1 Create `app/chapter/[chapterId]/exercises.tsx` (replaces current `app/quiz/[chapterId].tsx` as entry point)
  - [ ] 1.2 Accept `chapterId` and `bookId` route params
  - [ ] 1.3 Display chapter header with book and chapter info
  - [ ] 1.4 Add back navigation to chapter list

- [ ] Task 2: Implement AI-Generated Exercise Type Grid (AC: #2)
  - [ ] 2.1 Create `components/chapter/ExerciseTypeCard.tsx` with icon, label, progress
  - [ ] 2.2 Create 2-column grid layout with 8 cards (Mixed + 7 types)
  - [ ] 2.3 Style "Mixed" card with `<Theme name="primary">` and subtitle
  - [ ] 2.4 Add per-type progress indicators (%, "New", checkmark)
  - [ ] 2.5 Use exercise type icons from `@tamagui/lucide-icons`

- [ ] Task 3: Implement Premade Exercises Section (AC: #1, #6)
  - [ ] 3.1 Create `hooks/usePremadeExercises.ts` TanStack Query hook
  - [ ] 3.2 Query `premade_exercises` table filtered by book_id and lesson_id
  - [ ] 3.3 Create `components/chapter/PremadeExerciseCard.tsx` with title, type, completion status
  - [ ] 3.4 Display premade exercises section only if data exists for this chapter
  - [ ] 3.5 Show completion status from exercise_type_progress or local tracking

- [ ] Task 4: Implement Exercise Type Progress Hook (AC: #2, #6)
  - [ ] 4.1 Create `hooks/useExerciseTypeProgress.ts` TanStack Query hook
  - [ ] 4.2 Query `exercise_type_progress` table for user + chapter
  - [ ] 4.3 Return per-type progress map: { exerciseType: { bestScore, attemptCount, mastered } }

- [ ] Task 5: Implement Navigation (AC: #3, #4, #5)
  - [ ] 5.1 Premade exercise tap → navigate to premade exercise screen (placeholder for Epic 11)
  - [ ] 5.2 AI exercise type tap → navigate to quiz loading screen with exercise type param
  - [ ] 5.3 Mixed tap → navigate to quiz loading with exercise_type='mixed'
  - [ ] 5.4 Update chapter detail screen to navigate here instead of directly to quiz

- [ ] Task 6: Write tests (AC: all)
  - [ ] 6.1 Test screen renders with all 8 AI exercise type cards
  - [ ] 6.2 Test premade section hidden when no premade exercises exist
  - [ ] 6.3 Test premade section visible when premade exercises exist
  - [ ] 6.4 Test navigation on exercise type card tap
  - [ ] 6.5 Test progress indicators display correctly
  - [ ] 6.6 Test Mixed card has primary theme styling

## Dev Notes

### Architecture Requirements

**File Structure:**
```
dangdai-mobile/
├── app/
│   └── chapter/
│       └── [chapterId]/
│           └── exercises.tsx     # THIS STORY — Exercise Type Selection
├── components/
│   └── chapter/
│       ├── ExerciseTypeCard.tsx  # AI exercise type card
│       └── PremadeExerciseCard.tsx # Premade exercise card
└── hooks/
    ├── usePremadeExercises.ts   # TanStack Query for premade exercises
    └── useExerciseTypeProgress.ts # TanStack Query for per-type progress
```

### Exercise Types

The 8 exercise type cards (including Mixed) with their display properties:

| Exercise Type | Icon | Label | Description |
|---------------|------|-------|-------------|
| mixed | Shuffle | Mixed | AI picks exercises based on your weak areas |
| vocabulary | BookOpen | Vocabulary | Characters, pinyin, meanings |
| grammar | MessageSquare | Grammar | Sentence patterns, grammar rules |
| fill_in_blank | PenTool | Fill in Blank | Complete sentences with correct words |
| matching | Link | Matching | Connect related items |
| dialogue_completion | MessageCircle | Dialogue | Complete conversation exchanges |
| sentence_construction | Layout | Sentence Builder | Arrange words into correct order |
| reading_comprehension | FileText | Reading | Read passages and answer questions |

### Progress Indicator Logic

For each exercise type card, show:
- **"New"** — if no `exercise_type_progress` record exists for this user + chapter + type
- **"XX%"** — if best_score exists but < 80%
- **Checkmark (✓)** — if best_score >= 80% (mastered)

### Component Implementation

**ExerciseTypeCard:**
```tsx
// components/chapter/ExerciseTypeCard.tsx
import { Card, Text, YStack, XStack, Theme } from 'tamagui';

interface ExerciseTypeCardProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  subtitle?: string;
  progress?: { bestScore: number; mastered: boolean } | null;
  onPress: () => void;
  isMixed?: boolean;
}

// Use Tamagui styled() variants:
// - status: notStarted | inProgress | mastered
// - type: mixed | standard
// pressStyle: { scale: 0.98 }
// animation: "quick"
// minHeight: 80
```

### Navigation Updates

**Current flow (Story 3.4):**
```
Chapter List → /quiz/[chapterId] (chapter detail with vocab/grammar buttons)
```

**New flow (this story):**
```
Chapter List → /chapter/[chapterId]/exercises (exercise type selection)
                  ↓ tap AI type
              /quiz/loading?chapterId=X&bookId=Y&exerciseType=vocabulary
                  ↓ tap premade exercise
              /quiz/premade?chapterId=X&exerciseId=Y (placeholder for Epic 11)
```

The existing `app/quiz/[chapterId].tsx` (from Story 3.4) should be updated to redirect to the new exercises screen, or the chapter list navigation updated to point to the new route.

### Premade Exercises Query

```typescript
// hooks/usePremadeExercises.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function usePremadeExercises(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: ['premadeExercises', bookId, lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premade_exercises')
        .select('id, exercise_type, exercise_order, title, instructions, difficulty')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('exercise_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!bookId && !!lessonId,
  });
}
```

### Exercise Type Progress Query

```typescript
// hooks/useExerciseTypeProgress.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useExerciseTypeProgress(chapterId: number) {
  return useQuery({
    queryKey: ['exerciseTypeProgress', chapterId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('exercise_type_progress')
        .select('exercise_type, best_score, attempts_count, mastered_at')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId);

      if (error) throw error;

      // Transform to map: { exerciseType: { bestScore, attemptCount, mastered } }
      const progressMap: Record<string, { bestScore: number; attemptCount: number; mastered: boolean }> = {};
      for (const row of data ?? []) {
        progressMap[row.exercise_type] = {
          bestScore: row.best_score,
          attemptCount: row.attempts_count,
          mastered: !!row.mastered_at,
        };
      }
      return progressMap;
    },
    enabled: !!chapterId,
  });
}
```

### UX Requirements (from UX Spec)

- **Grid layout:** 2 columns, 4 rows for AI exercise cards
- **Mixed card:** Top-left position, `<Theme name="primary">` wrapper, distinct background
- **Card style:** `pressStyle: { scale: 0.98 }`, `animation: "quick"`, `minHeight: 80`, `padding: "$3"`
- **Progress indicators:** Text for "New" and "XX%", checkmark icon for mastered
- **Staggered animation:** Cards animate in with staggered `enterStyle: { opacity: 0, y: 10 }` using `AnimatePresence`
- **Touch targets:** Minimum 48px tap areas
- **Section headers:** "Workbook Exercises" and "AI-Generated Exercises" as H2

### Existing Patterns to Follow

**From Story 3.4 (ChapterDetailScreen):**
- Use same header pattern with back navigation
- Use same `useLocalSearchParams` for route params
- Use same Card press interaction patterns

**From Story 3.3 (ChapterListItem):**
- Follow same progress indicator dot pattern (green/teal/gray)

### Important: exercise_type_progress Table

This table may not exist yet if Epic 6 hasn't been implemented. The hook should handle the case where the table doesn't exist gracefully (return empty progress map, don't crash). The `premade_exercises` table also requires Story 1.10 to be completed first.

**Graceful degradation:** If `exercise_type_progress` or `premade_exercises` tables don't exist yet (Supabase error code `42P01`), show all exercise types as "New" and hide the premade section. Log a warning but don't crash.

### Anti-Patterns to Avoid

- **DO NOT** start quiz generation from this screen — navigation only
- **DO NOT** hardcode exercise type lists — use a constant array
- **DO NOT** gate/lock any exercise type — all are accessible
- **DO NOT** fetch full premade exercise `content` JSONB on list screen — only fetch metadata
- **DO NOT** use hardcoded hex colors — use Tamagui theme tokens only

### Dependencies

- **Depends on:** Story 3.4 (chapter navigation flow), Story 1.10 (premade_exercises table — degrades gracefully if not yet created)
- **Blocks:** Epic 4 quiz types (provides navigation entry point), Epic 11 (premade exercise flow)

### References

- [Source: epics.md#Story-3.5] — Story requirements and acceptance criteria
- [Source: ux-design-specification.md#ExerciseTypeSelector] — Component design specification
- [Source: architecture.md#API-Patterns] — Premade exercises direct Supabase read
- [Source: architecture.md#State-Management] — TanStack Query for server state
- [Source: 3-4-open-chapter-navigation-no-gates.md] — Previous story patterns and navigation flow

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
