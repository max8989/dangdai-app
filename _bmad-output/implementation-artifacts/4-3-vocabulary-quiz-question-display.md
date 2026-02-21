# Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)

Status: review

## Story

As a user,
I want to take vocabulary and grammar quizzes with clear Chinese character display and multiple choice answers,
So that I can practice character/pinyin/meaning recognition and grammar patterns.

## Acceptance Criteria

1. **Given** a vocabulary quiz has loaded (quiz data exists in `useQuizGeneration` mutation result)
   **When** I view a question
   **Then** I see the question type label (e.g., "What does this mean?")
   **And** the Chinese character is displayed at 72px minimum
   **And** pinyin is shown below the character when applicable
   **And** 4 answer options are displayed in a 2x2 grid layout (or vertical list for longer grammar answers)
   **And** a progress bar shows my position in the quiz (e.g., "3/10")
   **And** each option has minimum 48x48px touch target

2. **Given** I tap an answer option
   **When** my selection is registered
   **Then** the answer is validated locally against the answer key
   **And** I cannot change my answer after submission

3. **Given** quiz data arrives from the loading screen
   **When** the quiz screen mounts
   **Then** the first question is displayed with slide-in animation
   **And** `useQuizStore.startQuiz(quizId)` is called to initialize session state

4. **Given** I answer the last question
   **When** the quiz ends
   **Then** the completion state is triggered (next story 4.9 handles feedback, 4.11 handles results)
   **And** no crash occurs — graceful end-of-quiz handling

## Tasks / Subtasks

- [x] Task 1: Create `QuizQuestionCard` component (AC: #1)
  - [x] 1.1 Create `components/quiz/QuizQuestionCard.tsx` using Tamagui `styled(Card)` with `display` and `feedback` variants
  - [x] 1.2 Implement `display` variants: `character` (72px Chinese), `pinyin` (24px), `meaning` (20px English)
  - [x] 1.3 Implement `feedback` variants: `none`, `correct`, `incorrect` (border color changes)
  - [x] 1.4 Add `animation="medium"` with `enterStyle={{ opacity: 0, scale: 0.95, y: 10 }}`
  - [x] 1.5 Render question type label, primary content (character/pinyin/meaning), secondary content
  - [x] 1.6 Write co-located test `QuizQuestionCard.test.tsx`

- [x] Task 2: Create `AnswerOptionGrid` component (AC: #1, #2)
  - [x] 2.1 Create `components/quiz/AnswerOptionGrid.tsx` with `layout` variant: `grid` (2x2) and `list` (vertical)
  - [x] 2.2 Create individual `AnswerOption` using `styled(Button)` with `state` variant: `default`, `selected`, `correct`, `incorrect`, `disabled`
  - [x] 2.3 Implement `pressStyle={{ scale: 0.98 }}` and `animation="quick"` on each option
  - [x] 2.4 Enforce minimum 48px touch targets via `minHeight: 48`
  - [x] 2.5 Auto-select `grid` layout for short answers (≤15 chars), `list` for longer answers
  - [x] 2.6 Disable all options after an answer is selected (AC #2)
  - [x] 2.7 Write co-located test `AnswerOptionGrid.test.tsx`

- [x] Task 3: Create `QuizProgress` component (AC: #1)
  - [x] 3.1 Create `components/quiz/QuizProgress.tsx` showing "X/Y" text + animated progress bar
  - [x] 3.2 Use Tamagui `animation="slow"` on the progress bar width for smooth transitions
  - [x] 3.3 Write co-located test `QuizProgress.test.tsx`

- [x] Task 4: Implement quiz screen `app/quiz/play.tsx` (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `app/quiz/play.tsx` route that receives quiz data via route params or shared state
  - [x] 4.2 Read quiz data: receive `quizId` param, retrieve quiz payload from `useQuizStore` or navigation state
  - [x] 4.3 On mount: call `useQuizStore.startQuiz(quizId)` (AC #3)
  - [x] 4.4 Wrap question display in `AnimatePresence` with `key={currentQuestionIndex}` for enter/exit transitions
  - [x] 4.5 Implement answer selection: validate locally against `correct_answer`, update `useQuizStore.setAnswer()` and `addScore()`
  - [x] 4.6 After answer validation + feedback delay (~1s): call `useQuizStore.nextQuestion()` and advance to next question
  - [x] 4.7 On last question answered: navigate to results/completion (placeholder for Story 4.11)
  - [x] 4.8 Add exit confirmation dialog: "Leave exercise? Your progress will be saved." with Keep Learning / Leave options
  - [x] 4.9 Handle edge cases: empty quiz data, single question quiz, invalid quiz payload

- [x] Task 5: Wire navigation from loading screen to quiz play screen (AC: #3)
  - [x] 5.1 Update `app/quiz/loading.tsx`: on successful quiz generation, store quiz payload and navigate to `app/quiz/play.tsx`
  - [x] 5.2 Pass quiz data via a shared mechanism (Zustand store extension, or route params for quiz ID + store lookup)

- [x] Task 6: Extend `useQuizStore` for quiz payload storage (AC: #3, #4)
  - [x] 6.1 Add `quizPayload: QuizResponse | null` to `useQuizStore` state
  - [x] 6.2 Add `setQuizPayload(payload: QuizResponse)` action
  - [x] 6.3 Update `startQuiz()` to accept and store the quiz payload
  - [x] 6.4 Add `getCurrentQuestion()` derived getter
  - [x] 6.5 Add `isLastQuestion` derived boolean
  - [x] 6.6 Clear quiz payload on `resetQuiz()`

- [x] Task 7: Write tests (AC: all)
  - [x] 7.1 Unit test `QuizQuestionCard` renders all 3 display variants
  - [x] 7.2 Unit test `AnswerOptionGrid` renders 2x2 grid and vertical list
  - [x] 7.3 Unit test answer selection disables other options
  - [x] 7.4 Unit test `QuizProgress` shows correct position
  - [x] 7.5 Integration test: quiz play screen renders first question from quiz data
  - [x] 7.6 Integration test: selecting answer advances to next question
  - [x] 7.7 Integration test: last question triggers completion
  - [x] 7.8 Unit test `useQuizStore` extensions (quizPayload, getCurrentQuestion, isLastQuestion)

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Wired into AuthProvider for cleanup on sign-out. | **EXTEND** with `quizPayload` storage — do NOT rewrite |
| `types/quiz.ts` | Full types: `ExerciseType`, `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. | **USE** as-is — types already match the API contract |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, timeout, typed errors. | **USE** — do not modify |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** — do not modify |
| `app/quiz/loading.tsx` | Placeholder loading screen. Reads `chapterId`, `bookId`, `quizType` from `useLocalSearchParams`. | **MODIFY** — add navigation to play screen on success |
| `app/quiz/[chapterId].tsx` | Chapter detail screen. Navigates to `/quiz/loading` with `{chapterId, bookId, quizType}`. | **DO NOT MODIFY** |
| `lib/queryKeys.ts` | Has `quiz(quizId)` key factory. | **USE** as-is |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. | **USE** — all tokens and presets available |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/QuizQuestionCard.tsx` | Question display component |
| `components/quiz/QuizQuestionCard.test.tsx` | Tests |
| `components/quiz/AnswerOptionGrid.tsx` | Answer options (2x2 grid + list) |
| `components/quiz/AnswerOptionGrid.test.tsx` | Tests |
| `components/quiz/QuizProgress.tsx` | Progress bar + counter |
| `components/quiz/QuizProgress.test.tsx` | Tests |
| `app/quiz/play.tsx` | Main quiz playing screen (NEW route) |
| `app/quiz/play.test.tsx` | Tests |

### Quiz Data Flow

```
loading.tsx                     play.tsx
  ↓ (success)                     ↓ (reads)
  useQuizGeneration.data  →  useQuizStore.quizPayload
       ↓                          ↓
  setQuizPayload(data)       getCurrentQuestion()
  router.push('/quiz/play')      ↓
                             QuizQuestionCard + AnswerOptionGrid
                                  ↓ (answer selected)
                             setAnswer() → nextQuestion()
                                  ↓ (last question)
                             Navigate to results (Story 4.11)
```

### Quiz Data Storage Strategy

Store the full `QuizResponse` in `useQuizStore` (Zustand). This is local/ephemeral state for the active session — exactly what Zustand is for per architecture. Do NOT cache quiz data in TanStack Query (quiz generation is a mutation, not a query).

```typescript
// Extended useQuizStore interface
interface QuizState {
  // Existing fields (keep all)
  currentQuizId: string | null
  currentQuestion: number
  answers: Record<number, string>
  score: number

  // NEW: Full quiz payload
  quizPayload: QuizResponse | null

  // Existing actions (keep all)
  startQuiz: (quizId: string, payload?: QuizResponse) => void
  setAnswer: (questionIndex: number, answer: string) => void
  nextQuestion: () => void
  addScore: (points: number) => void
  resetQuiz: () => void

  // NEW actions
  setQuizPayload: (payload: QuizResponse) => void
}
```

### QuizQuestionCard Component Spec

```tsx
// components/quiz/QuizQuestionCard.tsx
const QuizQuestionCard = styled(Card, {
  animation: 'medium',
  enterStyle: { opacity: 0, scale: 0.95, y: 10 },
  padding: '$4',
  borderRadius: '$4',
  backgroundColor: '$surface',

  variants: {
    display: {
      character: {},  // 72px Chinese character display
      pinyin: {},     // 24px pinyin display
      meaning: {},    // 20px English meaning
    },
    feedback: {
      none: {},
      correct: { borderColor: '$success', borderWidth: 2 },
      incorrect: { borderColor: '$error', borderWidth: 2 },
    },
  } as const,
})
```

**Character display requirements:**
- Chinese characters: 72px minimum font size for quiz display
- Pinyin: 20px minimum, clear tone marks
- Sufficient spacing between character and pinyin
- Use system Chinese font (PingFang SC on iOS, Noto Sans CJK on Android)

### AnswerOptionGrid Component Spec

```tsx
// components/quiz/AnswerOptionGrid.tsx
const AnswerOption = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.98 },
  minHeight: 48,
  borderWidth: 1,

  variants: {
    state: {
      default: { borderColor: '$borderColor' },
      selected: { borderColor: '$primary', backgroundColor: '$backgroundPress' },
      correct: { borderColor: '$success', backgroundColor: '$successBackground' },
      incorrect: { borderColor: '$error', backgroundColor: '$errorBackground' },
      disabled: { opacity: 0.5 },
    },
    layout: {
      grid: {},   // 2x2 grid sizing
      list: {},   // full-width vertical
    },
  } as const,
})
```

**Layout logic:**
- Use `grid` (2x2) when ALL answers are ≤15 characters — common for vocabulary (meanings, pinyin)
- Use `list` (vertical stack) when ANY answer exceeds 15 characters — common for grammar (full sentences)
- Grammar questions should default to `list` layout

### Question Transition Animation (AnimatePresence)

```tsx
// In play.tsx — wrap question in AnimatePresence
<AnimatePresence>
  <QuizQuestionCard
    key={currentQuestionIndex}      // Changes trigger exit/enter cycle
    animation="medium"
    enterStyle={{ opacity: 0, x: 20 }}   // Slides in from right
    exitStyle={{ opacity: 0, x: -20 }}    // Slides out to left
  >
    {/* Question content */}
  </QuizQuestionCard>
</AnimatePresence>
```

**AnimatePresence rules:**
- Children MUST have a unique `key` prop that changes when the question changes
- `enterStyle` defines where the component animates FROM on mount
- `exitStyle` defines where the component animates TO on unmount
- Import from `tamagui` (re-exported from `@tamagui/animate-presence`)

### Answer Validation Logic (Local Only)

This story uses **local validation only** (exact match against `correct_answer` field). LLM validation is for Sentence Construction / Dialogue Completion (Stories 4.6, 4.7).

```typescript
function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}
```

After validation:
1. Set the selected option's `state` variant to `correct` or `incorrect`
2. If incorrect, also set the correct answer's option to `correct` state
3. Disable all options (set remaining to `disabled`)
4. Wait ~1 second (feedback display time per UX spec)
5. Advance to next question

### Quiz Play Screen Layout

```
┌─────────────────────────────────┐
│ ← Leave       Vocabulary Quiz    │
├─────────────────────────────────┤
│ ████████████░░░░░░░░  3/10       │  ← QuizProgress
├─────────────────────────────────┤
│                                  │
│        What does this mean?      │  ← Question type label
│                                  │
│              學                   │  ← 72px Chinese character
│             xué                   │  ← Pinyin below
│                                  │
├─────────────────────────────────┤
│                                  │
│  ┌──────────┐  ┌──────────┐      │
│  │ to study │  │ to teach │      │  ← 2x2 AnswerOptionGrid
│  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐      │
│  │ to read  │  │ to write │      │
│  └──────────┘  └──────────┘      │
│                                  │
└─────────────────────────────────┘
```

### Expo Router File Convention

Create `app/quiz/play.tsx` as a new route. It is NOT a dynamic route (no `[param]`) because quiz data comes from Zustand store, not URL params. The route just needs to exist as a navigation target.

If you need to pass data: store the quiz payload in `useQuizStore` before navigation, then read it on the play screen. Alternatively, you can pass `quizId` as a query param and look up from the store.

```typescript
// In loading.tsx on success:
const quizStore = useQuizStore.getState()
quizStore.setQuizPayload(data)
quizStore.startQuiz(data.quiz_id)
router.replace('/quiz/play')  // replace so back goes to chapter, not loading
```

```typescript
// In play.tsx on mount:
const { quizPayload, currentQuestion } = useQuizStore()
if (!quizPayload) {
  // No quiz data - navigate back
  router.replace('/(tabs)/books')
  return null
}
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts — not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on interactive elements

### Anti-Patterns to Avoid

- **DO NOT** create a new loading screen — `app/quiz/loading.tsx` already exists, just modify it to navigate to the play screen
- **DO NOT** use `useQuery` for quiz data — it's already a mutation via `useQuizGeneration`. Store result in Zustand.
- **DO NOT** create duplicate types — `types/quiz.ts` already has `QuizQuestion`, `QuizResponse`, `ExerciseType`
- **DO NOT** use `React.useState` for quiz session state — use `useQuizStore` (Zustand)
- **DO NOT** use `setInterval` without cleanup for feedback delay — use `setTimeout` inside `useEffect` with cleanup
- **DO NOT** implement sound effects — that's Story 4.9 (Immediate Answer Feedback)
- **DO NOT** implement the FeedbackOverlay component — that's Story 4.9. Just show correct/incorrect state on the answer options.
- **DO NOT** implement the CompletionScreen — that's Story 4.11. Navigate to a placeholder or back to chapter.
- **DO NOT** implement per-question result saving to Supabase — that's Story 4.10.
- **DO NOT** handle exercise types other than `vocabulary` and `grammar` — those are Stories 4.4-4.8. Structure the code to be extensible but only implement multiple-choice rendering.
- **DO NOT** use `Animated` from React Native — use Tamagui declarative animations
- **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file
- **DO NOT** put quiz logic in the component — keep answer validation and state management in the store/hooks layer

### Dependencies on Other Stories

- **Depends on:** Story 4.1 (quiz generation API) — IN PROGRESS (backend may not be deployed)
- **Depends on:** Story 4.2 (loading screen) — IN PROGRESS (hook + types + API client exist, screen is placeholder)
- **Depends on:** Story 1.1b (Tamagui theme) — REVIEW (sub-themes exist and are usable)
- **Depends on:** Story 1.5 (TanStack + Zustand) — DONE
- **Enables:** Story 4.9 (immediate feedback with sound), Story 4.10 (progress saving), Story 4.11 (results screen)
- **Enables:** Stories 4.4-4.8 (other exercise types can reuse `AnswerOptionGrid` and `QuizProgress`)

**Backend may not be deployed:** The quiz play screen MUST work with mock data for development. If `quizPayload` is null or empty, show an error state and allow going back. During dev, you can populate the Zustand store with mock quiz data to test the UI.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/ app/quiz/play --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/ app/quiz/play.tsx stores/useQuizStore.ts --ext .ts,.tsx
```

**Mock quiz data for tests:**

```typescript
const mockQuizResponse: QuizResponse = {
  quiz_id: 'test-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'vocabulary',
  question_count: 3,
  questions: [
    {
      question_id: 'q1',
      exercise_type: 'vocabulary',
      question_text: 'What does this character mean?',
      correct_answer: 'to study',
      explanation: '學 (xué) means to study/learn.',
      source_citation: 'Book 2, Chapter 12 - Vocabulary',
      character: '學',
      pinyin: 'xué',
      options: ['to study', 'to teach', 'to read', 'to write'],
    },
    {
      question_id: 'q2',
      exercise_type: 'vocabulary',
      question_text: 'What is the pinyin for this character?',
      correct_answer: 'chī',
      explanation: '吃 means to eat.',
      source_citation: 'Book 2, Chapter 12 - Vocabulary',
      character: '吃',
      options: ['chī', 'hē', 'chá', 'fàn'],
    },
    {
      question_id: 'q3',
      exercise_type: 'grammar',
      question_text: 'Which sentence correctly uses the 把 construction?',
      correct_answer: '我把書放在桌子上了',
      explanation: 'The 把 construction places the object before the verb.',
      source_citation: 'Book 2, Chapter 12 - Grammar',
      options: [
        '我把書放在桌子上了',
        '我放書把桌子上了',
        '把我書放在桌子上了',
        '我書把放在桌子上了',
      ],
    },
  ],
}
```

### File Structure (files to create/modify)

```
dangdai-mobile/
├── app/quiz/
│   ├── loading.tsx                  # MODIFY: navigate to play.tsx on success
│   ├── play.tsx                     # CREATE: main quiz playing screen
│   └── play.test.tsx                # CREATE: integration tests
├── components/quiz/
│   ├── QuizQuestionCard.tsx         # CREATE: question display component
│   ├── QuizQuestionCard.test.tsx    # CREATE: unit tests
│   ├── AnswerOptionGrid.tsx         # CREATE: answer options (grid + list)
│   ├── AnswerOptionGrid.test.tsx    # CREATE: unit tests
│   ├── QuizProgress.tsx             # CREATE: progress bar + counter
│   └── QuizProgress.test.tsx        # CREATE: unit tests
└── stores/
    └── useQuizStore.ts              # MODIFY: add quizPayload, setQuizPayload, getCurrentQuestion
```

### Project Structure Notes

- `components/quiz/` directory does not exist yet — this story creates it. This is where ALL quiz UI components will live per the architecture spec.
- `app/quiz/play.tsx` is a new Expo Router route. It is NOT dynamic (no `[param]`).
- Tests are co-located with source files per project convention.
- No new directories outside the established structure.

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- Backend is at early scaffold stage. The `/api/quizzes/generate` endpoint may raise `NotImplementedError`.
- `dangdai_chunks` table has 1060 rows with `exercise_type` column for RAG filtering.
- `question_results` table does NOT exist yet — irrelevant for this story but notable.

**From Story 4.2 (loading screen):**
- `lib/api.ts` has a complete `api.generateQuiz()` method — DO NOT recreate.
- `hooks/useQuizGeneration.ts` is a thin `useMutation` wrapper — DO NOT recreate.
- `types/quiz.ts` already defines `QuizQuestion` with optional `character`, `pinyin`, `options` fields.
- Loading screen currently reads params via `useLocalSearchParams` — needs update to call mutation and navigate to play screen.
- `app/quiz/loading.tsx` is still the Story 3.4 placeholder ("Quiz generation will be implemented in Epic 4").

**From Story 3.4 (chapter navigation):**
- `app/quiz/[chapterId].tsx` navigates to `/quiz/loading` with `{chapterId, bookId, quizType}` params.
- Chapter ID convention: `bookId * 100 + chapterNumber` (e.g., Book 2 Chapter 12 = 212).

### Git Intelligence

Recent commits show: Story 4.1 and 4.2 were created (commit `1f94908`, `2460f93`). Story 1.1b is in review. No quiz components have been committed yet.

### References

- [Source: epics.md#Story-4.3] - Story requirements and acceptance criteria
- [Source: architecture.md#State-Management] - Zustand for quiz state, TanStack Query for server state
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets, sub-themes, declarative animation props
- [Source: architecture.md#Answer-Validation-Strategy] - Local validation for vocabulary/grammar (exact match)
- [Source: architecture.md#Implementation-Patterns] - Naming conventions, file structure, enforcement rules
- [Source: ux-design-specification.md#QuizQuestionCard] - `styled(Card)` spec with `display` and `feedback` variants
- [Source: ux-design-specification.md#AnswerOptionGrid] - `styled(Button)` spec with `state` and `layout` variants
- [Source: ux-design-specification.md#Animation-Patterns] - AnimatePresence for question transitions, named presets
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Vocabulary = 2x2 grid, Grammar = vertical list
- [Source: ux-design-specification.md#Feedback-Patterns] - 1s feedback display, auto-advance
- [Source: ux-design-specification.md#Accessibility] - 48px touch targets, 72px Chinese characters, color + icon indicators
- [Source: 4-1-quiz-generation-api-endpoint.md] - API response contract, `QuizQuestion` schema
- [Source: 4-2-quiz-loading-screen-with-tips.md] - Existing code state (`lib/api.ts`, `types/quiz.ts`, `hooks/useQuizGeneration.ts`, `stores/useQuizStore.ts`)
- [Source: prd.md#FR16-FR17] - Vocabulary and grammar quiz requirements
- [Source: prd.md#FR23] - Immediate feedback per answer
- [Source: prd.md#NFR2] - 500ms screen navigation

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6

### Debug Log References

No blocking issues encountered. Pre-existing `hooks/useChapters.test.ts` failure (1 test) confirmed unrelated to this story via git stash verification.

### Completion Notes List

- Implemented all 7 tasks with full red-green-refactor TDD cycle (59 new tests, all passing)
- `useQuizStore` extended with `quizPayload`, `setQuizPayload`, `getCurrentQuestion()`, `isLastQuestion()`. `startQuiz()` updated to accept optional payload. `resetQuiz()` now clears `quizPayload`. 20 unit tests.
- `QuizQuestionCard`: Tamagui `styled(Card)` with `feedback` variants (none/correct/incorrect border colors), 3 display modes (character/72px, pinyin/24px, meaning/20px), `animation="medium"` enter transition. 12 unit tests.
- `AnswerOptionGrid`: Tamagui `styled(Button)` with `state` variants (default/selected/correct/incorrect/disabled), auto layout detection (grid for ≤15 chars, list for longer), `minHeight:48` touch targets, full disabling post-answer. 9 unit tests.
- `QuizProgress`: "X/Y" counter + animated progress bar (`animation="slow"`). 7 unit tests.
- `app/quiz/play.tsx`: Full quiz play screen with AnimatePresence question transitions, local answer validation, 1s feedback delay via `setTimeout`+`useEffect`, exit confirmation dialog via `Alert.alert`, graceful null-payload edge case. 11 integration tests.
- `app/quiz/loading.tsx` modified: replaces old dynamic route navigation with `setQuizPayload(data)` + `startQuiz(quizId, data)` + `router.replace('/quiz/play')`. Updated loading test mock and assertions to match.
- TypeScript: `npx tsc` passes clean. ESLint: 0 errors, warnings in test files only (consistent with project standard).

### File List

- `dangdai-mobile/stores/useQuizStore.ts` — MODIFIED: added quizPayload, setQuizPayload, getCurrentQuestion, isLastQuestion, updated startQuiz, resetQuiz
- `dangdai-mobile/stores/useQuizStore.test.ts` — CREATED: 20 unit tests for store extensions
- `dangdai-mobile/components/quiz/QuizQuestionCard.tsx` — CREATED: question display component
- `dangdai-mobile/components/quiz/QuizQuestionCard.test.tsx` — CREATED: 12 unit tests
- `dangdai-mobile/components/quiz/AnswerOptionGrid.tsx` — CREATED: answer options grid/list component
- `dangdai-mobile/components/quiz/AnswerOptionGrid.test.tsx` — CREATED: 9 unit tests
- `dangdai-mobile/components/quiz/QuizProgress.tsx` — CREATED: progress bar + counter component
- `dangdai-mobile/components/quiz/QuizProgress.test.tsx` — CREATED: 7 unit tests
- `dangdai-mobile/app/quiz/play.tsx` — CREATED: main quiz play screen route
- `dangdai-mobile/app/quiz/play.test.tsx` — CREATED: 11 integration tests
- `dangdai-mobile/app/quiz/loading.tsx` — MODIFIED: navigate to /quiz/play with payload stored in Zustand
- `dangdai-mobile/app/quiz/loading.test.tsx` — MODIFIED: updated mock + assertions for new navigation

## Change Log

- **2026-02-21 (Story 4.3):** Implemented vocabulary/grammar multiple choice quiz screen. Created `components/quiz/` directory with `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress` components. Created `app/quiz/play.tsx` play screen with AnimatePresence transitions, local validation, 1s feedback delay, exit dialog, and null-payload guard. Extended `useQuizStore` with quiz payload storage, `getCurrentQuestion()`, `isLastQuestion()`, `setQuizPayload()`. Updated `loading.tsx` to store payload in Zustand and navigate to `/quiz/play`. Added 59 tests (20 store unit, 12+9+7 component unit, 11 integration). TypeScript and ESLint pass clean.
