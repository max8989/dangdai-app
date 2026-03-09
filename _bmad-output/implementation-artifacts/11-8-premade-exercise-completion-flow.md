# Story 11.8: Premade Exercise Completion Flow

Status: done

## Story

As a user,
I want to complete premade workbook exercises with local validation and progress tracking,
So that I can practice official workbook content instantly without waiting for AI generation.

## Acceptance Criteria

1. **Given** I tap a premade exercise from the Exercise Type Selection screen
   **When** the premade exercise screen loads
   **Then** exercises are rendered locally from the `content` JSONB stored in `premade_exercises`

2. **Given** the exercise renders
   **When** I view it
   **Then** the same exercise UI components are used as AI-generated exercises (fill-in-blank, matching, sentence construction, etc.)

3. **Given** I answer a question
   **When** the answer is submitted
   **Then** answers are validated locally against stored correct answers (no LLM call needed)

4. **Given** an answer is validated
   **When** feedback is shown
   **Then** the same correct/incorrect feedback patterns apply (visual + sound + explanation)

5. **Given** I complete the exercise
   **When** results are calculated
   **Then** per-question results are saved to `question_results`
   **And** `exercise_type_progress` is updated upon completion
   **And** the completion screen shows score and chapter progress update

6. **Given** a premade exercise has been completed before
   **When** I view it in the Exercise Type Selection screen
   **Then** the exercise card shows a completion indicator (checkmark, "Done")
   **And** I can retake it to improve my score

## Tasks / Subtasks

- [ ] Task 1: Create Premade Exercise screen route (AC: #1)
  - [ ] 1.1 Create `app/quiz/premade.tsx`
  - [ ] 1.2 Accept `chapterId`, `bookId`, `exerciseId` from route params
  - [ ] 1.3 Fetch the specific premade exercise by ID from `premade_exercises` table (including full `content` JSONB)
  - [ ] 1.4 Parse `content` JSONB based on `exercise_type`

- [ ] Task 2: Create premade exercise data hook (AC: #1)
  - [ ] 2.1 Create `hooks/usePremadeExercise.ts` (singular — fetches one exercise with full content)
  - [ ] 2.2 Query `premade_exercises` table by ID, including `content` JSONB
  - [ ] 2.3 Transform `content` JSONB into the quiz question format expected by existing exercise components

- [ ] Task 3: Adapt content JSONB to quiz question format (AC: #2)
  - [ ] 3.1 Create `lib/premadeExerciseAdapter.ts` — transforms premade content JSONB to the Question format used by quiz components
  - [ ] 3.2 Handle each exercise type mapping:
    - Fill-in-blank: `content.sentences` → array of fill-in-blank questions
    - Matching: `content.pairs` → matching exercise data
    - Sentence construction: `content.sentences` → sentence builder data
    - Reading comprehension: `content.passage` + `content.questions` → reading passage + questions
    - Dialogue completion: `content.pairs` → dialogue completion data
  - [ ] 3.3 Generate `correct_answer` from stored content for local validation

- [ ] Task 4: Implement local validation (AC: #3, #4)
  - [ ] 4.1 Validate answers against stored `correct_answers` from content JSONB — no LLM call needed
  - [ ] 4.2 Reuse existing `FeedbackOverlay` component for correct/incorrect feedback
  - [ ] 4.3 Reuse existing `useSound` hook for feedback sounds
  - [ ] 4.4 Show the correct answer when user gets it wrong (same pattern as AI quizzes)

- [ ] Task 5: Implement progress tracking (AC: #5)
  - [ ] 5.1 Save per-question results to `question_results` table (same as AI-generated quizzes)
  - [ ] 5.2 Update `exercise_type_progress` on completion
  - [ ] 5.3 Navigate to `CompletionScreen` on finish (reuse existing component)
  - [ ] 5.4 Pass score and progress data to completion screen

- [ ] Task 6: Add completion indicators (AC: #6)
  - [ ] 6.1 In `PremadeExerciseCard` (Story 3.5), show completion checkmark based on `exercise_type_progress`
  - [ ] 6.2 Allow retaking — navigate to same premade exercise screen, overwrite previous score

- [ ] Task 7: Write tests (AC: all)
  - [ ] 7.1 Create `app/quiz/premade.test.tsx`
  - [ ] 7.2 Test premade exercise renders correct exercise component based on type
  - [ ] 7.3 Test local validation produces correct/incorrect results
  - [ ] 7.4 Test completion triggers progress save
  - [ ] 7.5 Create `lib/premadeExerciseAdapter.test.ts`
  - [ ] 7.6 Test adapter transforms each content type correctly
  - [ ] 7.7 Test completion indicator shows on previously completed exercises

## Dev Notes

### Architecture: Premade Exercise Flow (from architecture.md)

```
1. Mobile: GET premade exercises for chapter from Supabase (premade_exercises table)
2. Mobile: Display exercise list with completion status per exercise
3. User selects a premade exercise → exercises rendered locally from stored structured content
4. Mobile: Local validation against stored correct answers
5. Mobile: Save per-question results to question_results + update exercise_type_progress
```

**Key difference from AI quizzes:** No LLM call needed. Everything is local — content comes from the database, validation is against stored answers.

### Existing Quiz Components to Reuse

The following existing components should be reused as-is (they are exercise-type-agnostic):

| Component | Location | Purpose |
|-----------|----------|---------|
| `FillInBlankSentence` | `components/quiz/FillInBlankSentence.tsx` | Fill-in-the-blank UI |
| `WordBankSelector` | `components/quiz/WordBankSelector.tsx` | Word bank for fill-in-blank |
| `MatchingExercise` | `components/quiz/MatchingExercise.tsx` | Matching pairs UI |
| `SentenceBuilder` | `components/quiz/SentenceBuilder.tsx` | Sentence construction UI |
| `ReadingPassageCard` | `components/quiz/ReadingPassageCard.tsx` | Reading comprehension passage |
| `DialogueCard` | `components/quiz/DialogueCard.tsx` | Dialogue completion UI |
| `AnswerOptionGrid` | `components/quiz/AnswerOptionGrid.tsx` | Multiple choice options |
| `QuizQuestionCard` | `components/quiz/QuizQuestionCard.tsx` | Question card wrapper |
| `FeedbackOverlay` | `components/quiz/FeedbackOverlay.tsx` | Correct/incorrect feedback |
| `CompletionScreen` | `components/quiz/CompletionScreen.tsx` | Quiz results |
| `QuizProgress` | `components/quiz/QuizProgress.tsx` | Progress bar |
| `PointsCounter` | `components/quiz/PointsCounter.tsx` | Points animation |
| `TextInputAnswer` | `components/quiz/TextInputAnswer.tsx` | Text input for typed answers |

### Existing Hooks to Reuse

| Hook | Location | Purpose |
|------|----------|---------|
| `useSound` | `hooks/useSound.ts` | Feedback sounds |
| `useQuizPersistence` | `hooks/useQuizPersistence.ts` | Save results to Supabase |
| `useAnswerValidation` | `hooks/useAnswerValidation.ts` | May need adaptation for local-only validation |
| `useExerciseTypeProgress` | `hooks/useExerciseTypeProgress.ts` | Progress tracking |

### Content JSONB → Question Format Adapter

The adapter (`lib/premadeExerciseAdapter.ts`) transforms the premade exercise content JSONB into the same Question format used by the quiz play screen. This lets all existing exercise components work unchanged.

```typescript
// lib/premadeExerciseAdapter.ts
import type { Question } from '../types/quiz';

export function adaptPremadeContent(
  exerciseType: string,
  content: Record<string, unknown>,
): Question[] {
  switch (exerciseType) {
    case 'fill_in_blank':
      return adaptFillInBlank(content);
    case 'matching':
    case 'dialogue_completion':
      return adaptMatching(content);
    case 'sentence_construction':
      return adaptSentenceConstruction(content);
    case 'reading':
      return adaptReadingComprehension(content);
    default:
      return [];
  }
}
```

### Component Structure

```
dangdai-mobile/
├── app/quiz/
│   └── premade.tsx               # THIS STORY — premade exercise screen
├── hooks/
│   └── usePremadeExercise.ts     # THIS STORY — fetch single exercise
└── lib/
    └── premadeExerciseAdapter.ts  # THIS STORY — content adapter
```

### Quiz State Management

Use the existing `useQuizStore` (Zustand) for managing current question index, answers, and local state during the premade exercise. The store is exercise-type-agnostic and works for both AI and premade exercises.

### Navigation Flow

```
Exercise Type Selection (Story 3.5)
  ↓ tap premade exercise
/quiz/premade?exerciseId=UUID&chapterId=X&bookId=Y
  ↓ complete exercise
CompletionScreen (existing component)
  ↓ tap "Continue"
Exercise Type Selection (back)
```

### Anti-Patterns to Avoid

- **DO NOT** call any LLM endpoint for premade exercises — all validation is local
- **DO NOT** create new exercise UI components — reuse existing quiz components
- **DO NOT** skip progress tracking — premade results go to same `question_results` and `exercise_type_progress` tables
- **DO NOT** create a separate completion screen — reuse existing `CompletionScreen`
- **DO NOT** fetch full content JSONB on the list screen — only fetch when user opens the exercise (the list screen from Story 3.5 only fetches metadata)
- **DO NOT** import exercise components differently — use the same import paths as `app/quiz/play.tsx`

### Dependencies

- **Depends on:** Story 1.10 (premade_exercises table), Story 11.4 (premade data seeded), Story 3.5 (navigation entry + PremadeExerciseCard), Stories 4.3-4.8 (exercise UI components must exist), Story 4.9 (FeedbackOverlay), Story 4.10 (quiz progress saving)
- **Blocks:** None

### References

- [Source: epics.md#Story-11.8] — Story requirements
- [Source: architecture.md#Premade-Exercise-Flow] — No-LLM exercise flow
- [Source: 1-10-create-structured-content-tables.md] — Premade exercises content JSONB schemas
- [Source: 3-5-exercise-type-selection-screen.md] — Navigation entry and PremadeExerciseCard
- [Source: app/quiz/play.tsx] — Existing quiz play screen to reference for component usage

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6

### Debug Log References

None — clean implementation.

### Completion Notes List

- Created `lib/premadeExerciseAdapter.ts` — transforms content JSONB to QuizQuestion[] for all 5 exercise types
- Created `hooks/usePremadeExercise.ts` — fetches single exercise with full content JSONB (lazy, on open)
- Replaced `app/quiz/premade.tsx` stub with full implementation reusing all existing quiz components
- Updated `app/chapter/[chapterId]/exercises.tsx` to pass `bookId` param to premade screen
- Updated `lib/queryKeys.ts` to register `premadeExercise` key for cache consistency
- Code review fixes: array param normalization, initialization guard ref, removed unused store subscription
- All 6 ACs verified: local rendering, component reuse, local validation, feedback, progress saving, completion indicator
- 64 tests passing, TypeScript clean

### File List

- `dangdai-mobile/app/quiz/premade.tsx` — REPLACED (stub → full implementation)
- `dangdai-mobile/app/quiz/premade.test.tsx` — CREATED (18 tests)
- `dangdai-mobile/hooks/usePremadeExercise.ts` — CREATED
- `dangdai-mobile/lib/premadeExerciseAdapter.ts` — CREATED
- `dangdai-mobile/lib/premadeExerciseAdapter.test.ts` — CREATED (46 tests)
- `dangdai-mobile/lib/queryKeys.ts` — UPDATED (added premadeExercise key)
- `dangdai-mobile/app/chapter/[chapterId]/exercises.tsx` — UPDATED (pass bookId to premade screen)
