# Story 4.4: Fill-in-the-Blank Exercise (Word Bank)

Status: done

## Story

As a user,
I want to complete fill-in-the-blank exercises by selecting words from a word bank,
So that I can practice using vocabulary in sentence context.

## Acceptance Criteria

1. **Given** a fill-in-the-blank exercise has loaded (quiz data exists in `useQuizStore.quizPayload`)
   **When** I view a question
   **Then** I see a sentence with one or more blanks highlighted
   **And** a horizontal scrollable word bank is displayed below with selectable word options
   **And** each word option has minimum 48px touch target

2. **Given** I tap a word in the word bank
   **When** the selection is registered
   **Then** the word animates from the bank to fill the blank in the sentence (`animation="medium"`)
   **And** the used word becomes semi-transparent (opacity 0.4) in the bank
   **And** I can tap the filled blank to return the word to the bank

3. **Given** I have filled all blanks
   **When** the answer is validated locally against the answer key
   **Then** correct/incorrect feedback is shown per blank (green border for correct, gentle orange for incorrect)

## Tasks / Subtasks

- [x] Task 1: Create `WordBankSelector` component (AC: #1, #2)
  - [x] 1.1 Create `components/quiz/WordBankSelector.tsx` using Tamagui `styled(Button)` with `state` variant (`available`, `selected`, `correct`, `incorrect`, `used`)
  - [x] 1.2 Implement horizontal `ScrollView` with pill-shaped word items (`borderRadius: 20`, `minHeight: 48`)
  - [x] 1.3 Implement `pressStyle={{ scale: 0.95 }}` and `animation="quick"` on each word item
  - [x] 1.4 Handle `onWordSelect` callback when a word is tapped
  - [x] 1.5 Render used words with `opacity: 0.4` (state: `used`)
  - [x] 1.6 Apply `correct`/`incorrect` state variants after validation
  - [x] 1.7 Use `focusStyle={{ borderColor: '$borderColorFocus' }}` on interactive word items

- [x] Task 2: Create `FillInBlankSentence` component (AC: #1, #2)
  - [x] 2.1 Create `components/quiz/FillInBlankSentence.tsx` that parses `sentence_with_blanks` and renders text segments with interactive blank slots
  - [x] 2.2 Render blank slots as tappable areas with dashed border and `$primary` theme styling when empty
  - [x] 2.3 When a blank is filled, display the word inside the slot with `animation="medium"` and `enterStyle={{ opacity: 0, scale: 0.8 }}`
  - [x] 2.4 Handle `onBlankTap` callback to return a word to the bank when a filled blank is tapped
  - [x] 2.5 Apply per-blank feedback styling after validation: `<Theme name="success">` for correct, `<Theme name="error">` for incorrect
  - [x] 2.6 Ensure blank slots have minimum 48px touch targets
  - [x] 2.7 Display Chinese characters at appropriate reading size within the sentence context

- [x] Task 3: Add blank-filling state to `useQuizStore` (AC: #2)
  - [x] 3.1 Add `blankAnswers: Record<number, string | null>` to track which word fills each blank position
  - [x] 3.2 Add `setBlankAnswer(blankIndex: number, word: string | null)` action
  - [x] 3.3 Add `clearBlankAnswer(blankIndex: number)` action (returns word to bank)
  - [x] 3.4 Add `allBlanksFilled` derived getter for the current question
  - [x] 3.5 Reset `blankAnswers` on `nextQuestion()` and `resetQuiz()`

- [x] Task 4: Integrate fill-in-blank type into `play.tsx` (AC: #1, #2, #3)
  - [x] 4.1 Add `fill_in_blank` case to the exercise type rendering switch in `app/quiz/play.tsx`
  - [x] 4.2 Render `FillInBlankSentence` + `WordBankSelector` for fill-in-blank questions
  - [x] 4.3 Wire word selection: tapping a word in the bank fills the next empty blank
  - [x] 4.4 Wire blank tap: tapping a filled blank returns the word to the bank
  - [x] 4.5 Auto-submit when all blanks are filled (trigger validation)
  - [x] 4.6 Wrap fill-in-blank question in `AnimatePresence` with `key={currentQuestionIndex}` for enter/exit transitions
  - [x] 4.7 Show per-blank feedback for ~1 second before auto-advancing to next question

- [x] Task 5: Implement per-blank validation logic (AC: #3)
  - [x] 5.1 Create `validateFillInBlank(blankAnswers: Record<number, string>, correctAnswers: string[]): boolean[]` utility
  - [x] 5.2 Validate each blank position independently (exact match, case-insensitive, trimmed)
  - [x] 5.3 Return per-blank results array (true/false per position)
  - [x] 5.4 Calculate overall score: all blanks correct = full points, partial = no points (per question)
  - [x] 5.5 Update `useQuizStore.setAnswer()` with serialized blank answers for the question
  - [x] 5.6 Disable word bank and blank interaction after validation

- [x] Task 6: Write tests (AC: #1, #2, #3)
  - [x] 6.1 Unit test `WordBankSelector` renders all word options with correct touch targets
  - [x] 6.2 Unit test `WordBankSelector` marks tapped word as `used` (opacity 0.4)
  - [x] 6.3 Unit test `WordBankSelector` applies `correct`/`incorrect` states after validation
  - [x] 6.4 Unit test `FillInBlankSentence` parses sentence and renders blanks
  - [x] 6.5 Unit test `FillInBlankSentence` fills blank when word is selected
  - [x] 6.6 Unit test `FillInBlankSentence` returns word to bank when filled blank is tapped
  - [x] 6.7 Unit test `FillInBlankSentence` shows per-blank feedback after validation
  - [x] 6.8 Unit test `validateFillInBlank` returns correct per-blank results
  - [x] 6.9 Unit test `useQuizStore` blank-filling state (setBlankAnswer, clearBlankAnswer, allBlanksFilled, reset)
  - [x] 6.10 Integration test: fill-in-blank question renders sentence + word bank in play.tsx
  - [x] 6.11 Integration test: selecting words fills blanks and triggers validation when all filled

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Story 4.3 will add `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion`. | **EXTEND** with blank-filling state — do NOT rewrite existing fields |
| `types/quiz.ts` | Full types: `ExerciseType` (includes `fill_in_blank`), `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. `QuizQuestion` has optional `character`, `pinyin`, `options` fields but does NOT yet have fill-in-blank-specific fields. | **EXTEND** — add `sentence_with_blanks`, `word_bank`, `blank_positions` optional fields to `QuizQuestion` |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, timeout, typed errors. | **USE** — do not modify |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** — do not modify |
| `app/quiz/loading.tsx` | Full loading screen with tips, error handling, navigation to play screen on success. | **DO NOT MODIFY** |
| `app/quiz/play.tsx` | Will be created by Story 4.3 with vocabulary/grammar multiple-choice rendering. | **MODIFY** — add `fill_in_blank` exercise type case |
| `components/quiz/QuizQuestionCard.tsx` | Will be created by Story 4.3 — question display with `display` and `feedback` variants. | **REUSE** for question text display if applicable |
| `components/quiz/AnswerOptionGrid.tsx` | Will be created by Story 4.3 — 2x2 grid/list for multiple choice. | **DO NOT USE** for fill-in-blank (different interaction pattern) |
| `components/quiz/QuizProgress.tsx` | Will be created by Story 4.3 — progress bar + counter. | **REUSE** — same progress bar for all exercise types |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. | **USE** — all tokens and presets available |
| `lib/queryKeys.ts` | Has `quiz(quizId)` key factory. | **USE** as-is |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/WordBankSelector.tsx` | Horizontal scrollable word bank component |
| `components/quiz/WordBankSelector.test.tsx` | Unit tests |
| `components/quiz/FillInBlankSentence.tsx` | Sentence display with interactive blank slots |
| `components/quiz/FillInBlankSentence.test.tsx` | Unit tests |

### Quiz Data Flow

```
loading.tsx                     play.tsx
  ↓ (success)                     ↓ (reads)
  useQuizGeneration.data  →  useQuizStore.quizPayload
       ↓                          ↓
  setQuizPayload(data)       getCurrentQuestion()
  router.replace('/quiz/play')    ↓
                             exercise_type === 'fill_in_blank'?
                                  ↓ YES
                             FillInBlankSentence + WordBankSelector
                                  ↓ (word tapped)
                             setBlankAnswer(blankIndex, word)
                                  ↓ (all blanks filled)
                             validateFillInBlank() → per-blank feedback
                                  ↓ (~1s delay)
                             nextQuestion()
```

### WordBankSelector Component Spec

```tsx
// components/quiz/WordBankSelector.tsx
import { styled, Button } from 'tamagui'

const WordBankItem = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.95 },
  focusStyle: { borderColor: '$borderColorFocus' },
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: 20,
  minHeight: 48,

  variants: {
    state: {
      available: {
        backgroundColor: '$surface',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
      selected: {
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
      correct: {
        backgroundColor: '$successBackground',
        borderColor: '$success',
      },
      incorrect: {
        backgroundColor: '$errorBackground',
        borderColor: '$error',
      },
      used: {
        opacity: 0.4,
      },
    },
  } as const,
})
```

**Props interface:**

```typescript
interface WordBankSelectorProps {
  words: string[]
  usedWords: Set<string>           // Words currently placed in blanks
  feedbackState?: Record<string, 'correct' | 'incorrect'>  // Per-word feedback after validation
  onWordSelect: (word: string) => void
  disabled?: boolean               // Disable all interaction after validation
}
```

**Layout:**
- Horizontal `ScrollView` wrapping a `XStack` of `WordBankItem` components
- `gap="$2"` between items
- `paddingHorizontal="$4"` for edge padding
- Word bank scrolls automatically to keep unused words visible

### FillInBlankSentence Component Spec

```tsx
// components/quiz/FillInBlankSentence.tsx
```

**Props interface:**

```typescript
interface FillInBlankSentenceProps {
  sentenceWithBlanks: string       // e.g., "我___去___買東西" (blanks marked with ___)
  filledBlanks: Record<number, string | null>  // { 0: '想', 1: null }
  blankFeedback?: Record<number, 'correct' | 'incorrect'>  // Per-blank feedback
  onBlankTap: (blankIndex: number) => void  // Tap filled blank to return word
  disabled?: boolean
}
```

**Sentence parsing logic:**
- Split `sentence_with_blanks` on blank markers (e.g., `___` or a delimiter from the API)
- Render text segments as `<Text>` and blank slots as tappable `<Button>` or `<Pressable>`
- Use `flexWrap: 'wrap'` on the container `XStack` so the sentence wraps naturally
- Blank slots when empty: dashed border, `$primary` background tint, placeholder width based on average word length
- Blank slots when filled: solid border, word text displayed with `animation="medium"` and `enterStyle={{ opacity: 0, scale: 0.8 }}`
- After validation: wrap each blank in `<Theme name="success">` or `<Theme name="error">` based on per-blank result

**Blank slot styling:**

```tsx
const BlankSlot = styled(Button, {
  animation: 'medium',
  minWidth: 60,
  minHeight: 40,
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    state: {
      empty: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '$primary',
        backgroundColor: '$backgroundPress',
      },
      filled: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '$borderColor',
        backgroundColor: '$surface',
      },
      correct: {
        borderWidth: 2,
        borderColor: '$success',
        backgroundColor: '$successBackground',
      },
      incorrect: {
        borderWidth: 2,
        borderColor: '$error',
        backgroundColor: '$errorBackground',
      },
    },
  } as const,
})
```

### Blank-Filling State Management

Extend `useQuizStore` with fill-in-blank-specific state. This state is ephemeral per question and resets on `nextQuestion()`.

```typescript
// Extended useQuizStore interface (additions only)
interface QuizState {
  // ... existing fields from Story 4.3 ...

  // NEW: Fill-in-blank state (per question, resets on nextQuestion)
  blankAnswers: Record<number, string | null>  // blankIndex -> word or null

  // NEW actions
  setBlankAnswer: (blankIndex: number, word: string | null) => void
  clearBlankAnswer: (blankIndex: number) => void
}
```

**Derived state (compute in component or as store getter):**

```typescript
// Check if all blanks are filled for the current question
function allBlanksFilled(
  blankAnswers: Record<number, string | null>,
  totalBlanks: number
): boolean {
  for (let i = 0; i < totalBlanks; i++) {
    if (!blankAnswers[i]) return false
  }
  return true
}
```

**Reset behavior:**
- `nextQuestion()` must reset `blankAnswers` to `{}`
- `resetQuiz()` must reset `blankAnswers` to `{}`
- `clearBlankAnswer(index)` sets `blankAnswers[index]` to `null`

### Fill-in-Blank Validation Logic

Validation is **LOCAL only** — exact match against the answer key. No LLM call needed for fill-in-the-blank.

```typescript
/**
 * Validate fill-in-the-blank answers against the answer key.
 * Returns a boolean array where each element indicates if the
 * corresponding blank was filled correctly.
 */
function validateFillInBlank(
  blankAnswers: Record<number, string>,
  correctAnswers: string[]
): boolean[] {
  return correctAnswers.map((correct, index) => {
    const userAnswer = blankAnswers[index]
    if (!userAnswer) return false
    return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
  })
}
```

**After validation:**
1. Compute per-blank results via `validateFillInBlank()`
2. Set each blank's feedback state to `correct` or `incorrect`
3. Set each word in the bank to `correct` or `incorrect` state
4. Disable all interaction (word bank + blank tapping)
5. If ALL blanks correct: `addScore(1)` (full points)
6. If ANY blank incorrect: no points for this question
7. Store serialized answer: `setAnswer(questionIndex, JSON.stringify(blankAnswers))`
8. Wait ~1 second, then `nextQuestion()`

### Screen Layout

```
┌─────────────────────────────────┐
│ ← Leave    Fill-in-the-Blank     │
├─────────────────────────────────┤
│ ████████████░░░░░░░░  3/10       │  ← QuizProgress (from 4.3)
├─────────────────────────────────┤
│                                  │
│   Complete the sentence:         │  ← Question text label
│                                  │
│   我 [___想___] 去               │  ← FillInBlankSentence
│   [_________] 買東西。           │     Blanks are interactive slots
│                                  │     Filled blanks show the word
│                                  │
├─────────────────────────────────┤
│                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 想  │ │ 要  │ │ 超市 │ ←──── │  ← WordBankSelector
│  └─────┘ └─────┘ └─────┘        │     Horizontal scroll
│  ┌─────┐ ┌─────┐                │     Pill-shaped buttons
│  │ 會  │ │ 商店 │                │     Used words at 0.4 opacity
│  └─────┘ └─────┘                │
│                                  │
└─────────────────────────────────┘
```

**After filling blanks:**
```
┌─────────────────────────────────┐
│   我 [ 想 ✓ ] 去                │  ← Green border (correct)
│   [ 超市 ✗ ] 買東西。           │  ← Orange border (incorrect)
│                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 想 ✓│ │ 要  │ │超市✗│        │  ← Feedback on used words
│  └─────┘ └─────┘ └─────┘        │
└─────────────────────────────────┘
```

### Tamagui Animation Patterns

**Word selection animation** — word animates into blank:
```tsx
// When a word fills a blank, the text appears with scale + opacity animation
<BlankSlot state="filled">
  <Text
    animation="medium"
    enterStyle={{ opacity: 0, scale: 0.8 }}
  >
    {filledWord}
  </Text>
</BlankSlot>
```

**Question transition** — same AnimatePresence pattern as 4.3:
```tsx
<AnimatePresence>
  <YStack
    key={currentQuestionIndex}
    animation="medium"
    enterStyle={{ opacity: 0, x: 20 }}
    exitStyle={{ opacity: 0, x: -20 }}
  >
    <FillInBlankSentence ... />
    <WordBankSelector ... />
  </YStack>
</AnimatePresence>
```

**Feedback entrance** — per-blank feedback with AnimatePresence:
```tsx
// After validation, wrap blank in Theme for color context
<Theme name={isCorrect ? 'success' : 'error'}>
  <BlankSlot state={isCorrect ? 'correct' : 'incorrect'}>
    <Text>{filledWord}</Text>
  </BlankSlot>
</Theme>
```

**Word bank item press** — quick spring feedback:
```tsx
<WordBankItem
  state={isUsed ? 'used' : 'available'}
  animation="quick"
  pressStyle={{ scale: 0.95 }}
  onPress={() => onWordSelect(word)}
  disabled={isUsed || disabled}
>
  <Text>{word}</Text>
</WordBankItem>
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

- **DO NOT** create a new loading screen — `app/quiz/loading.tsx` already exists from Story 4.2, do not modify it
- **DO NOT** use `useQuery` for quiz data — it's already a mutation via `useQuizGeneration`. Quiz data is in Zustand store.
- **DO NOT** create duplicate types — `types/quiz.ts` already has `QuizQuestion`, `QuizResponse`, `ExerciseType`. Extend, don't recreate.
- **DO NOT** use `React.useState` for blank-filling state — use `useQuizStore` (Zustand)
- **DO NOT** use `setInterval` without cleanup for feedback delay — use `setTimeout` inside `useEffect` with cleanup
- **DO NOT** implement sound effects — that's Story 4.9 (Immediate Answer Feedback)
- **DO NOT** implement the FeedbackOverlay component — that's Story 4.9. Just show correct/incorrect state on the blanks and word bank items.
- **DO NOT** implement the CompletionScreen — that's Story 4.11. Navigate to a placeholder or back to chapter on last question.
- **DO NOT** implement per-question result saving to Supabase — that's Story 4.10.
- **DO NOT** use `Animated` from React Native — use Tamagui declarative animations
- **DO NOT** use `Dimensions` API — use Tamagui media queries (`$xs`, `$sm`)
- **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file
- **DO NOT** put quiz logic (validation, state management) in the component — keep in store/hooks layer
- **DO NOT** call LLM validation for fill-in-the-blank — validation is LOCAL only (exact match against answer key)
- **DO NOT** rewrite existing `useQuizStore` fields or actions — only ADD new fields for blank-filling state

### Dependencies on Other Stories

- **Depends on:** Story 4.3 (vocabulary quiz) — READY-FOR-DEV (creates `play.tsx`, `QuizProgress`, `QuizQuestionCard`, extends `useQuizStore` with `quizPayload`)
- **Depends on:** Story 4.2 (loading screen) — DONE (loading screen, API client, types, hook all exist)
- **Depends on:** Story 4.1 (quiz generation API) — IN PROGRESS (backend may not be deployed; fill-in-blank payload includes `sentence_with_blanks`, `word_bank`, `blank_positions`)
- **Depends on:** Story 1.1b (Tamagui theme) — REVIEW (sub-themes `success`, `error` exist and are usable)
- **Depends on:** Story 1.5 (TanStack + Zustand) — DONE
- **Enables:** Story 4.9 (immediate feedback with sound — will add ding/bonk sounds to fill-in-blank feedback)
- **Enables:** Story 4.10 (progress saving — will save fill-in-blank results to Supabase)
- **Enables:** Story 4.11 (results screen — will show fill-in-blank scores in completion breakdown)

**Backend may not be deployed:** The fill-in-blank rendering MUST work with mock data for development. If `quizPayload` is null or empty, the existing error handling from Story 4.3 applies. During dev, populate the Zustand store with mock fill-in-blank quiz data to test the UI.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/WordBankSelector components/quiz/FillInBlankSentence app/quiz/play --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/WordBankSelector.tsx components/quiz/FillInBlankSentence.tsx app/quiz/play.tsx stores/useQuizStore.ts --ext .ts,.tsx
```

**Mock quiz data for tests:**

```typescript
const mockFillInBlankQuizResponse: QuizResponse = {
  quiz_id: 'test-fib-quiz-1',
  chapter_id: 105,
  book_id: 1,
  exercise_type: 'fill_in_blank',
  question_count: 3,
  questions: [
    {
      question_id: 'fib-q1',
      exercise_type: 'fill_in_blank',
      question_text: 'Complete the sentence:',
      correct_answer: '想,超市',  // comma-separated for multiple blanks
      explanation: '想 (xiǎng) means "want to" and 超市 (chāoshì) means "supermarket".',
      source_citation: 'Book 1, Chapter 5 - Vocabulary',
      sentence_with_blanks: '我___去___買東西。',
      word_bank: ['想', '要', '超市', '商店', '會'],
      blank_positions: [0, 1],
    },
    {
      question_id: 'fib-q2',
      exercise_type: 'fill_in_blank',
      question_text: 'Complete the sentence:',
      correct_answer: '喜歡',
      explanation: '喜歡 (xǐhuān) means "to like".',
      source_citation: 'Book 1, Chapter 5 - Vocabulary',
      sentence_with_blanks: '我很___吃中國菜。',
      word_bank: ['喜歡', '想要', '可以', '應該'],
      blank_positions: [0],
    },
    {
      question_id: 'fib-q3',
      exercise_type: 'fill_in_blank',
      question_text: 'Complete the sentence:',
      correct_answer: '是,學生',
      explanation: '是 (shì) is the verb "to be" and 學生 (xuéshēng) means "student".',
      source_citation: 'Book 1, Chapter 5 - Grammar',
      sentence_with_blanks: '他___一個___。',
      word_bank: ['是', '有', '學生', '老師', '很'],
      blank_positions: [0, 1],
    },
  ],
}
```

**Key test scenarios:**

1. `WordBankSelector` renders all words as pill-shaped buttons with 48px min height
2. `WordBankSelector` calls `onWordSelect` when a word is tapped
3. `WordBankSelector` renders used words at 0.4 opacity
4. `WordBankSelector` disables used words (not tappable)
5. `WordBankSelector` shows correct/incorrect feedback states
6. `FillInBlankSentence` parses sentence and renders correct number of blanks
7. `FillInBlankSentence` shows empty blank slots with dashed border
8. `FillInBlankSentence` displays filled word in blank with animation props
9. `FillInBlankSentence` calls `onBlankTap` when a filled blank is tapped
10. `FillInBlankSentence` shows per-blank correct/incorrect feedback
11. `validateFillInBlank` returns `[true, true]` for all correct answers
12. `validateFillInBlank` returns `[true, false]` for partial correct
13. `validateFillInBlank` handles case-insensitive comparison
14. `useQuizStore` blank state: `setBlankAnswer` updates correctly
15. `useQuizStore` blank state: `clearBlankAnswer` sets to null
16. `useQuizStore` blank state: `nextQuestion` resets `blankAnswers`
17. Integration: play.tsx renders fill-in-blank question with sentence + word bank
18. Integration: selecting all words triggers validation and shows feedback

### File Structure

```
dangdai-mobile/
├── app/quiz/
│   └── play.tsx                          # MODIFY: add fill_in_blank exercise type rendering
├── components/quiz/
│   ├── WordBankSelector.tsx              # CREATE: horizontal word bank component
│   ├── WordBankSelector.test.tsx         # CREATE: unit tests
│   ├── FillInBlankSentence.tsx           # CREATE: sentence with interactive blanks
│   └── FillInBlankSentence.test.tsx      # CREATE: unit tests
├── stores/
│   └── useQuizStore.ts                   # MODIFY: add blankAnswers, setBlankAnswer, clearBlankAnswer
└── types/
    └── quiz.ts                           # MODIFY: add sentence_with_blanks, word_bank, blank_positions to QuizQuestion
```

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- Backend fill-in-blank payload includes: `sentence_with_blanks: str`, `word_bank: list[str]`, `blank_positions: list[int]`
- `correct_answer` field contains the answer(s) — for multiple blanks, answers are comma-separated or stored as a list
- Backend is at early scaffold stage; the endpoint may raise `NotImplementedError`
- `dangdai_chunks` table has 1060 rows with `exercise_type` column including `fill_in_blank` for RAG filtering

**From Story 4.2 (loading screen):**
- `lib/api.ts` has a complete `api.generateQuiz()` method — DO NOT recreate
- `hooks/useQuizGeneration.ts` is a thin `useMutation` wrapper — DO NOT recreate
- `types/quiz.ts` already defines `QuizQuestion` with optional fields but does NOT yet have `sentence_with_blanks`, `word_bank`, `blank_positions`
- Loading screen navigates to `/quiz/play` on success via `router.replace('/quiz/play')`

**From Story 4.3 (vocabulary quiz):**
- `app/quiz/play.tsx` will exist with vocabulary/grammar rendering — this story adds the `fill_in_blank` case
- `useQuizStore` will be extended with `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion`
- `QuizProgress` component will exist and should be reused for fill-in-blank
- Answer validation pattern: validate locally → show feedback → wait ~1s → advance
- `AnimatePresence` with `key={currentQuestionIndex}` pattern for question transitions

**From Story 3.4 (chapter navigation):**
- Chapter ID convention: `bookId * 100 + chapterNumber` (e.g., Book 1 Chapter 5 = 105)

### References

- [Source: epics.md#Story-4.4] - Story requirements and acceptance criteria
- [Source: architecture.md#State-Management] - Zustand for quiz state, TanStack Query for server state
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets, sub-themes, declarative animation props
- [Source: architecture.md#Answer-Validation-Strategy] - Local validation for fill-in-the-blank (exact match)
- [Source: architecture.md#Implementation-Patterns] - Naming conventions, file structure, enforcement rules
- [Source: ux-design-specification.md#WordBankSelector] - `styled(Button)` spec with `state` variant, pill-shaped, horizontal scroll
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Fill-in-the-Blank: tap word from bank, word animates into blank
- [Source: ux-design-specification.md#Animation-Patterns] - Named presets (quick, bouncy, medium, slow), enterStyle/exitStyle patterns
- [Source: ux-design-specification.md#Feedback-Patterns] - 1s feedback display, auto-advance, per-element feedback
- [Source: ux-design-specification.md#Accessibility] - 48px touch targets, color + icon indicators
- [Source: 4-1-quiz-generation-api-endpoint.md] - API response contract, fill-in-blank extra fields: `sentence_with_blanks`, `word_bank`, `blank_positions`
- [Source: 4-2-quiz-loading-screen-with-tips.md] - Existing code state (`lib/api.ts`, `types/quiz.ts`, `hooks/useQuizGeneration.ts`, `stores/useQuizStore.ts`)
- [Source: 4-3-vocabulary-quiz-question-display.md] - Play screen structure, QuizProgress reuse, AnimatePresence pattern, useQuizStore extensions
- [Source: prd.md#FR18] - Fill-in-the-Blank exercise requirements
- [Source: prd.md#FR23] - Immediate feedback per answer
- [Source: prd.md#NFR2] - 500ms screen navigation

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic/claude-sonnet-4-6)

### Debug Log References

No blocking issues encountered. Pre-existing ESLint `react-hooks/exhaustive-deps` rule definition error in `play.tsx` (existed before this story, inherited from Story 4.3 pattern).

### Completion Notes List

- ✅ Created `WordBankSelector` component with `styled(Button)` Tamagui pattern, horizontal `ScrollView`, pill-shaped items, 5 state variants (`available`, `selected`, `correct`, `incorrect`, `used`), `opacity: 0.4` for used words.
- ✅ Created `FillInBlankSentence` component with `parseSentence()` helper splitting on `___`, interactive `BlankSlot` styled component with 4 state variants, Theme wrappers for correct/incorrect feedback.
- ✅ Extended `useQuizStore` with `blankAnswers`, `setBlankAnswer`, `clearBlankAnswer`; `nextQuestion()` and `resetQuiz()` both reset `blankAnswers` to `{}`.
- ✅ Extended `types/quiz.ts` `QuizQuestion` with optional fields: `sentence_with_blanks`, `word_bank`, `blank_positions`.
- ✅ Created `lib/validateFillInBlank.ts` with `validateFillInBlank()`, `parseCorrectAnswers()`, `allBlanksFilled()` utilities. All local validation, no LLM call.
- ✅ Updated `app/quiz/play.tsx` to branch on `exercise_type === 'fill_in_blank'`, rendering `FillInBlankSentence` + `WordBankSelector` with full word-select/blank-tap/auto-validate/feedback/advance logic.
- ✅ 87 tests pass (27 unit tests for stores, 26 for components, 17 for utilities, 17 integration tests for play.tsx). Zero regressions introduced.
- ✅ TypeScript type checking passes cleanly (`npx tsc --noEmit` clean).

### Change Log

- **2026-02-21**: Implemented Story 4.4 Fill-in-the-Blank Exercise. Added `WordBankSelector`, `FillInBlankSentence` components, `validateFillInBlank` utility, extended `useQuizStore` with blank-filling state, extended `QuizQuestion` type with fill-in-blank fields, updated `play.tsx` to handle `fill_in_blank` exercise type. 87 tests total, all passing.
- **2026-02-21**: Code review fixes applied. H1: fixed race condition in `handleWordSelect` by passing `updatedAnswers` synchronously to validation instead of relying on Zustand flush. H2: removed premature reset of multiple-choice state (`selectedAnswer`, `feedbackState`) from `currentQuestionIndex` effect. H3: `startQuiz` now resets `blankAnswers` and `blankAnswerIndices`. M1: switched word-bank tracking from value-based `Set<string>` to index-based `Set<number>` + `blankAnswerIndices` store field to correctly handle duplicate words. M2: `getBlankState` now treats any blank with no explicit `'correct'` feedback key as `'incorrect'` when `blankFeedback` is provided. M3: removed phantom `eslint-disable-next-line react-hooks/exhaustive-deps` comment. M4: added early guard in `handleWordSelect` when all blanks already filled. M5: `WordBankSelector` feedback state tests now assert `accessibilityHint` (visual state) not just element existence. 92 tests total, all passing.

### File List

- `dangdai-mobile/components/quiz/WordBankSelector.tsx` — CREATED
- `dangdai-mobile/components/quiz/WordBankSelector.test.tsx` — CREATED
- `dangdai-mobile/components/quiz/FillInBlankSentence.tsx` — CREATED
- `dangdai-mobile/components/quiz/FillInBlankSentence.test.tsx` — CREATED
- `dangdai-mobile/lib/validateFillInBlank.ts` — CREATED
- `dangdai-mobile/lib/validateFillInBlank.test.ts` — CREATED
- `dangdai-mobile/stores/useQuizStore.ts` — MODIFIED (added blankAnswers, blankAnswerIndices, setBlankAnswer, clearBlankAnswer; reset in nextQuestion/resetQuiz/startQuiz)
- `dangdai-mobile/stores/useQuizStore.test.ts` — MODIFIED (added Story 4.4 blank-filling state tests)
- `dangdai-mobile/types/quiz.ts` — MODIFIED (added sentence_with_blanks, word_bank, blank_positions to QuizQuestion)
- `dangdai-mobile/app/quiz/play.tsx` — MODIFIED (added fill_in_blank exercise type rendering, word selection, blank tap, validation, feedback)
- `dangdai-mobile/app/quiz/play.test.tsx` — MODIFIED (added fill-in-blank integration tests, fill-in-blank component mocks, blank store mocks)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (4-4 status: ready-for-dev → review)
- `_bmad-output/implementation-artifacts/4-4-fill-in-the-blank-exercise.md` — MODIFIED (all tasks checked, status → review)
