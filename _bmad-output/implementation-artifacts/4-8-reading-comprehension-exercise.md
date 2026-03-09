# Story 4.8: Reading Comprehension Exercise

Status: done

## Story

As a user,
I want to read a Chinese passage and answer comprehension questions,
So that I can practice reading skills.

## Acceptance Criteria

1. **Given** a reading comprehension exercise has loaded
   **When** I view the exercise
   **Then** I see a scrollable Chinese text passage (72px minimum for featured characters, 20px minimum for body reading, pinyin toggle available)
   **And** comprehension questions appear below the passage with standard multiple choice
   **And** the passage remains scrollable while answering questions

2. **Given** I select an answer to a comprehension question
   **When** the answer is validated locally against the answer key
   **Then** standard correct/incorrect feedback is shown

## Tasks / Subtasks

- [x] Task 1: Extend `types/quiz.ts` with reading comprehension types (AC: #1)
  - [x] 1.1 Add `ComprehensionSubQuestion` interface: `{ question: string; options: string[]; correct_answer: string; explanation?: string; source_citation?: string }`
  - [x] 1.2 Add reading-comprehension-specific optional fields to `QuizQuestion`: `passage?: string`, `passage_pinyin?: string`, `comprehension_questions?: ComprehensionSubQuestion[]`
  - [x] 1.3 Verify `ExerciseType` already includes `'reading_comprehension'` (it does — verify only)

- [x] Task 2: Create `ReadingPassageCard` component (AC: #1, #2)
  - [x] 2.1 Create `components/quiz/ReadingPassageCard.tsx` with `PassageContainer` using `styled(Card)` with `size` variant (`short`, `medium`, `long`)
  - [x] 2.2 Implement scrollable passage area using `ScrollView` inside `PassageContainer` — passage must scroll independently from the page
  - [x] 2.3 Render passage header text ("Read the following passage:")
  - [x] 2.4 Render Chinese passage text at 20px minimum body reading size with `$color` token
  - [x] 2.5 Implement pinyin toggle button — tap to show/hide pinyin above passage characters
  - [x] 2.6 When pinyin is visible, render `passage_pinyin` text above the passage in a smaller font (14px)
  - [x] 2.7 Render current comprehension question text below the passage with a `Separator` divider
  - [x] 2.8 Render answer options below the question using existing `AnswerOptionGrid` component (REUSE from Story 4.3)
  - [x] 2.9 On answer selection: validate locally against `correct_answer` (exact match), show correct/incorrect feedback via `AnswerOptionGrid` state variants
  - [x] 2.10 After feedback delay (~1s): call `onAnswer` callback to advance to next comprehension question or next quiz question
  - [x] 2.11 Show sub-question progress within the passage (e.g., "Question 1/3")
  - [x] 2.12 Enforce `animation="medium"` with `enterStyle={{ opacity: 0 }}` on `PassageContainer`
  - [x] 2.13 Enforce minimum 48px touch targets on pinyin toggle and answer options

- [x] Task 3: Create `ReadingPassageCard.test.tsx` (AC: #1, #2)
  - [x] 3.1 Create `components/quiz/ReadingPassageCard.test.tsx` with mock reading comprehension data
  - [x] 3.2 Test: renders passage text in a scrollable container
  - [x] 3.3 Test: renders "Read the following passage:" header
  - [x] 3.4 Test: renders first comprehension question text below passage
  - [x] 3.5 Test: renders 4 answer options via AnswerOptionGrid
  - [x] 3.6 Test: pinyin toggle shows/hides pinyin text
  - [x] 3.7 Test: selecting correct answer shows success feedback
  - [x] 3.8 Test: selecting incorrect answer shows error feedback and highlights correct answer
  - [x] 3.9 Test: answer options are disabled after selection
  - [x] 3.10 Test: `onAnswer` callback is called after feedback delay
  - [x] 3.11 Test: sub-question progress indicator shows correct count (e.g., "Question 2/3")
  - [x] 3.12 Test: passage remains rendered (not unmounted) across sub-question transitions

- [x] Task 4: Integrate `ReadingPassageCard` into quiz play screen (AC: #1, #2)
  - [x] 4.1 Add `'reading_comprehension'` case to the exercise type switch/conditional in `app/quiz/play.tsx`
  - [x] 4.2 Render `<ReadingPassageCard>` when `exercise_type === 'reading_comprehension'`, passing passage, passage_pinyin, comprehension_questions, and callbacks
  - [x] 4.3 Manage sub-question index state: track which comprehension question within the passage is currently active
  - [x] 4.4 On sub-question answer: advance to next comprehension question within the same passage (passage stays visible)
  - [x] 4.5 On last sub-question answer: advance to next quiz question via `useQuizStore.nextQuestion()`
  - [x] 4.6 Wire each sub-question answer to `useQuizStore.setAnswer()` and `addScore()` — each sub-question counts as a separate scored answer
  - [x] 4.7 Reuse `<QuizProgress>` — total question count includes all sub-questions across all passages

- [x] Task 5: Write integration tests for reading comprehension in play.tsx (AC: all)
  - [x] 5.1 Test: `play.tsx` renders `ReadingPassageCard` when `exercise_type === 'reading_comprehension'`
  - [x] 5.2 Test: passage stays visible across all sub-questions for that passage
  - [x] 5.3 Test: answering all sub-questions advances to next quiz question
  - [x] 5.4 Test: `QuizProgress` reflects total sub-question count (not passage count)
  - [x] 5.5 Test: score increments correctly for each sub-question answered correctly
  - [x] 5.6 Test: mixed quiz with reading comprehension + vocabulary questions renders both types correctly

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Wired into AuthProvider for cleanup on sign-out. Story 4.3 extends it with `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion`. | **USE** existing actions — do NOT extend store. Sub-question index is local component state (ephemeral to the passage, not session-level). |
| `types/quiz.ts` | Full types: `ExerciseType` (includes `'reading_comprehension'`), `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. `QuizQuestion` has optional `character`, `pinyin`, `options` fields. | **EXTEND** with `ComprehensionSubQuestion` interface and reading-specific fields (`passage`, `passage_pinyin`, `comprehension_questions`) |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, 10s timeout, typed errors. Uses `AbortController` pattern. | **USE** as-is — no changes needed for reading comprehension (local validation only) |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** as-is — do not modify |
| `app/quiz/play.tsx` | Quiz play screen handling vocab/grammar (Story 4.3), fill-in-blank (4.4), matching (4.5), dialogue (4.6), sentence construction (4.7). Uses `AnimatePresence`, `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress`. Reads `quizPayload` from `useQuizStore`. | **MODIFY** — add `reading_comprehension` case to exercise type switch |
| `components/quiz/QuizProgress.tsx` | Created by Story 4.3. Shows "X/Y" text + animated progress bar. | **REUSE** in reading comprehension screen layout |
| `components/quiz/AnswerOptionGrid.tsx` | Created by Story 4.3. Answer options with `state` variant (`default`, `selected`, `correct`, `incorrect`, `disabled`) and `layout` variant (`grid`, `list`). | **REUSE** for comprehension question answer options — do NOT create a new answer component |
| `components/quiz/QuizQuestionCard.tsx` | Created by Story 4.3. Question display with `display` and `feedback` variants. | **DO NOT USE** for reading comprehension — the passage card has its own layout. May optionally reuse for the comprehension question text display. |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. Tokens: `$surface`, `$borderColor`, `$primary`, `$success`, `$error`, `$successBackground`, `$errorBackground`. | **USE** — all tokens and presets available |
| `lib/supabase.ts` | Supabase client initialized. | **USE** as-is |
| `lib/queryKeys.ts` | Has `quiz(quizId)` key factory. | **USE** as-is |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/ReadingPassageCard.tsx` | Scrollable passage with pinyin toggle + comprehension questions below |
| `components/quiz/ReadingPassageCard.test.tsx` | Unit + integration tests |

**What does NOT need to be created (unlike other exercise stories):**

- No new store extensions — sub-question index is local `useState` (ephemeral to the passage component, resets when passage changes)
- No new API methods — reading comprehension uses LOCAL validation only (exact match against answer key)
- No new hooks — no hybrid validation needed (unlike Stories 4.6/4.7)

### ReadingPassageCard Component Spec

```tsx
// components/quiz/ReadingPassageCard.tsx
import { styled, Card, YStack, XStack, Text, Button, Separator, ScrollView, AnimatePresence } from 'tamagui'
import { useState, useCallback } from 'react'
import { AnswerOptionGrid } from './AnswerOptionGrid'

/**
 * PassageContainer — scrollable card for Chinese reading passages.
 * Size variants control maxHeight for different passage lengths.
 */
const PassageContainer = styled(Card, {
  animation: 'medium',
  enterStyle: { opacity: 0 },
  padding: '$4',
  maxHeight: 300,

  variants: {
    size: {
      short: { maxHeight: 200 },
      medium: { maxHeight: 300 },
      long: { maxHeight: 400 },
    },
  } as const,
})

/**
 * PinyinToggle — small button to show/hide pinyin above passage text.
 */
const PinyinToggle = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.95 },
  size: '$2',
  borderRadius: '$2',
  borderWidth: 1,
  borderColor: '$borderColor',
  backgroundColor: '$surface',
  minHeight: 48,  // 48px touch target

  variants: {
    active: {
      true: {
        backgroundColor: '$backgroundPress',
        borderColor: '$primary',
      },
    },
  } as const,
})
```

**Props interface:**

```typescript
interface ReadingPassageCardProps {
  /** The Chinese passage text */
  passage: string
  /** Optional pinyin for the passage (shown when pinyin toggle is active) */
  passagePinyin?: string
  /** Array of comprehension sub-questions for this passage */
  comprehensionQuestions: ComprehensionSubQuestion[]
  /** Index of the currently active sub-question (0-based) */
  currentSubQuestionIndex: number
  /** Callback when a sub-question is answered */
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void
  /** Whether interaction is disabled (e.g., during feedback delay) */
  disabled?: boolean
}
```

**Pinyin toggle implementation:**

```tsx
function ReadingPassageCard({ passage, passagePinyin, ... }: ReadingPassageCardProps) {
  const [showPinyin, setShowPinyin] = useState(false)

  return (
    <YStack gap="$3">
      {/* Passage header */}
      <Text fontSize={16} color="$colorSubtle">Read the following passage:</Text>

      {/* Scrollable passage container */}
      <PassageContainer size="medium">
        <ScrollView showsVerticalScrollIndicator>
          {showPinyin && passagePinyin && (
            <Text fontSize={14} color="$colorSubtle" marginBottom="$2">
              {passagePinyin}
            </Text>
          )}
          <Text fontSize={20} lineHeight={32} color="$color">
            {passage}
          </Text>
        </ScrollView>

        {/* Pinyin toggle button — bottom-right of passage card */}
        {passagePinyin && (
          <XStack justifyContent="flex-end" marginTop="$2">
            <PinyinToggle
              active={showPinyin}
              onPress={() => setShowPinyin(!showPinyin)}
            >
              <Text fontSize={14}>拼音</Text>
            </PinyinToggle>
          </XStack>
        )}
      </PassageContainer>

      <Separator />

      {/* Sub-question progress */}
      <Text fontSize={14} color="$colorSubtle" textAlign="center">
        Question {currentSubQuestionIndex + 1}/{comprehensionQuestions.length}
      </Text>

      {/* Current comprehension question */}
      <Text fontSize={18} fontWeight="600" color="$color">
        {comprehensionQuestions[currentSubQuestionIndex].question}
      </Text>

      {/* Answer options — REUSE AnswerOptionGrid from Story 4.3 */}
      <AnswerOptionGrid
        options={comprehensionQuestions[currentSubQuestionIndex].options}
        correctAnswer={comprehensionQuestions[currentSubQuestionIndex].correct_answer}
        onSelect={handleAnswerSelect}
        disabled={disabled}
      />
    </YStack>
  )
}
```

### Reading Comprehension Data Shape

**Backend schema (`dangdai-api/src/api/schemas.py`):**

```python
class ComprehensionSubQuestion(BaseModel):
    question: str
    options: list[str]          # 4 multiple-choice options
    correct: int                # Index of correct option (0-3)

class ReadingComprehensionQuestion(QuizQuestionBase):
    exercise_type: Literal["reading_comprehension"]
    passage: str                # The reading passage text
    comprehension_questions: list[ComprehensionSubQuestion]
```

**IMPORTANT: Backend uses `correct: int` (index into `options` array) for sub-questions.** The mobile type should store `correct_answer: string` (the actual answer text) for simpler comparison. A transform function should convert the index to the actual option text when receiving the API response.

**Mobile type mapping:**

```typescript
// In types/quiz.ts

/** A sub-question within a reading comprehension passage. */
interface ComprehensionSubQuestion {
  question: string
  options: string[]
  /** The correct answer text (resolved from backend's correct index) */
  correct_answer: string
  /** Optional per-sub-question explanation */
  explanation?: string
  /** Optional per-sub-question source citation */
  source_citation?: string
}

// Extended QuizQuestion fields (added to existing interface)
interface QuizQuestion {
  // ... existing fields ...
  passage?: string
  passage_pinyin?: string
  comprehension_questions?: ComprehensionSubQuestion[]
}
```

**Transform function (in API client or quiz store):**

```typescript
/**
 * Transform backend reading comprehension response to mobile format.
 * Converts `correct` index to `correct_answer` string.
 */
function transformComprehensionQuestions(
  backendQuestions: Array<{ question: string; options: string[]; correct: number }>
): ComprehensionSubQuestion[] {
  return backendQuestions.map((q) => ({
    question: q.question,
    options: q.options,
    correct_answer: q.options[q.correct],
  }))
}
```

### Passage + Questions Layout Strategy

Reading comprehension is unique among exercise types because a single `QuizQuestion` from the backend contains **multiple sub-questions** that share a single passage. The layout strategy:

1. **Passage stays mounted** across all sub-questions — it does NOT unmount/remount when advancing between sub-questions within the same passage.
2. **Sub-question index** is managed as local `useState` inside the `ReadingPassageCard` component (or in `play.tsx` if needed for score tracking). It is NOT stored in `useQuizStore` because it's ephemeral to the passage.
3. **Each sub-question counts as a separate scored answer** for `useQuizStore.setAnswer()` and `addScore()`. This means a single reading comprehension `QuizQuestion` with 3 sub-questions contributes 3 answers to the quiz score.
4. **QuizProgress** should reflect the total number of sub-questions across all passages, not the number of passages. For example, if a quiz has 2 reading passages with 3 sub-questions each + 4 vocabulary questions = 10 total questions.
5. **Question transitions**: Only the question text and answer options animate between sub-questions (using `AnimatePresence` with `key={subQuestionIndex}`). The passage container does NOT animate.

**Sub-question advancement flow:**

```
User answers sub-question 1/3
  → feedback delay (~1s)
  → advance subQuestionIndex to 2
  → passage stays visible, question text + options animate in
  → ...
User answers sub-question 3/3
  → feedback delay (~1s)
  → call onAnswer for the last sub-question
  → play.tsx calls useQuizStore.nextQuestion() to advance to next QuizQuestion
```

**Question count calculation for QuizProgress:**

```typescript
function getTotalQuestionCount(questions: QuizQuestion[]): number {
  return questions.reduce((total, q) => {
    if (q.exercise_type === 'reading_comprehension' && q.comprehension_questions) {
      return total + q.comprehension_questions.length
    }
    return total + 1
  }, 0)
}
```

### Screen Layout

```
┌─────────────────────────────────┐
│ Reading - Chapter 12     Q 7/10 │
│ ██████████████████░░            │  ← QuizProgress (reuse from 4.3)
├─────────────────────────────────┤
│ Read the following passage:     │
│ ┌───────────────────────────┐   │
│ │ 我每天早上六點起床。起床    │   │
│ │ 以後先去跑步，然後吃早      │   │  ← Scrollable passage (ScrollView)
│ │ 餐。我很喜歡吃包子和豆      │   │
│ │ 漿。吃完早餐以後，我就      │   │
│ │ 去上課了。                   │   │
│ │                    [拼音]   │   │  ← Pinyin toggle button
│ └───────────────────────────┘   │
│ ─────────────────────────────── │  ← Separator
│ Question 1/3                    │  ← Sub-question progress
│                                 │
│ What does the author do first   │
│ in the morning?                 │  ← Comprehension question text
│                                 │
│ ┌───────────┐ ┌───────────┐     │
│ │ A) 吃早餐  │ │ B) 去跑步  │     │  ← AnswerOptionGrid (REUSE from 4.3)
│ └───────────┘ └───────────┘     │
│ ┌───────────┐ ┌───────────┐     │
│ │ C) 喝咖啡  │ │ D) 看書    │     │
│ └───────────┘ └───────────┘     │
└─────────────────────────────────┘

After answering (correct):
┌─────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐     │
│ │ A) 吃早餐  │ │✓B) 去跑步  │     │  ← Correct answer highlighted green
│ └───────────┘ └─(success)──┘     │
│ ┌───────────┐ ┌───────────┐     │
│ │ C) 喝咖啡  │ │ D) 看書    │     │  ← Other options disabled
│ └─(disabled)─┘ └─(disabled)─┘    │
│                                 │
│ → Auto-advances to Question 2/3 │
└─────────────────────────────────┘

After answering (incorrect):
┌─────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐     │
│ │✗A) 吃早餐  │ │✓B) 去跑步  │     │  ← Selected = error, correct = success
│ └──(error)───┘ └─(success)──┘    │
│ ┌───────────┐ ┌───────────┐     │
│ │ C) 喝咖啡  │ │ D) 看書    │     │
│ └─(disabled)─┘ └─(disabled)─┘    │
│                                 │
│ → Auto-advances to Question 2/3 │
└─────────────────────────────────┘

With pinyin toggle active:
┌───────────────────────────────────┐
│ ┌─────────────────────────────┐   │
│ │ wǒ měi tiān zǎo shàng liù  │   │  ← Pinyin text (14px, subtle color)
│ │ diǎn qǐ chuáng...          │   │
│ │                             │   │
│ │ 我每天早上六點起床。起床     │   │  ← Passage text (20px body reading)
│ │ 以後先去跑步，然後吃早       │   │
│ │ 餐...                        │   │
│ │                    [拼音✓]  │   │  ← Toggle active state
│ └─────────────────────────────┘   │
└───────────────────────────────────┘
```

### Tamagui Animation Patterns

**Passage container entrance:**

```tsx
<PassageContainer
  size="medium"
  animation="medium"
  enterStyle={{ opacity: 0 }}
>
  {/* Passage content */}
</PassageContainer>
```

**Sub-question transition (question text + options animate, passage stays):**

```tsx
{/* Passage — NOT inside AnimatePresence, stays mounted */}
<PassageContainer size="medium">
  <ScrollView>{/* passage text */}</ScrollView>
</PassageContainer>

<Separator />

{/* Sub-question — inside AnimatePresence, animates on index change */}
<AnimatePresence>
  <YStack
    key={currentSubQuestionIndex}
    animation="medium"
    enterStyle={{ opacity: 0, x: 20 }}
    exitStyle={{ opacity: 0, x: -20 }}
  >
    <Text>Question {currentSubQuestionIndex + 1}/{total}</Text>
    <Text>{currentQuestion.question}</Text>
    <AnswerOptionGrid ... />
  </YStack>
</AnimatePresence>
```

**Pinyin toggle animation:**

```tsx
<PinyinToggle
  active={showPinyin}
  animation="quick"
  pressStyle={{ scale: 0.95 }}
  onPress={() => setShowPinyin(!showPinyin)}
>
  <Text>拼音</Text>
</PinyinToggle>
```

**Answer feedback (handled by AnswerOptionGrid — reuse existing):**

The `AnswerOptionGrid` component from Story 4.3 already handles:
- Setting selected option to `correct` or `incorrect` state
- Highlighting the correct answer when user selects wrong answer
- Disabling all options after selection
- `animation="quick"` on state transitions

No additional animation code needed for answer feedback.

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, `$successBackground`, `$errorBackground`, `$color`, `$colorSubtle`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts — not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations (sub-question transitions)
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on interactive elements
- **NEVER** use `Animated` from React Native — use Tamagui declarative animations
- **NEVER** create barrel `index.ts` files — import directly from each component file

### Anti-Patterns to Avoid

- **DO NOT** implement sound effects — that's Story 4.9 (Immediate Answer Feedback)
- **DO NOT** save quiz results to Supabase — that's Story 4.10 (Progress Saving)
- **DO NOT** create a CompletionScreen — that's Story 4.11 (Quiz Results)
- **DO NOT** use RN `Animated` API — use Tamagui declarative animations
- **DO NOT** create a new answer grid component — REUSE `AnswerOptionGrid` from Story 4.3
- **DO NOT** hardcode hex colors — use Tamagui tokens exclusively
- **DO NOT** use LLM/hybrid validation — reading comprehension uses LOCAL validation only (exact match against answer key per architecture.md)
- **DO NOT** store sub-question index in `useQuizStore` — it's ephemeral local state (`useState`) scoped to the passage component
- **DO NOT** unmount the passage when advancing between sub-questions — the passage MUST stay visible and scrollable across all sub-questions
- **DO NOT** use `setInterval` without cleanup for feedback delay — use `setTimeout` inside `useEffect` with cleanup
- **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file
- **DO NOT** put validation logic in the component — keep answer comparison in a pure function or reuse the local validation pattern from `play.tsx`
- **DO NOT** assume `passage_pinyin` always exists — it's optional. Only show the pinyin toggle when `passage_pinyin` is provided.
- **DO NOT** treat the entire passage as one question for scoring — each sub-question is a separate scored answer

### Dependencies on Other Stories

- **Depends on:** Story 4.3 (vocabulary quiz) — creates `play.tsx`, `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress`, extends `useQuizStore` with `quizPayload`. **Status: ready-for-dev**
- **Depends on:** Story 4.1 (quiz generation API) — backend generates reading comprehension questions with `passage` and `comprehension_questions` fields. **Status: review**
- **Depends on:** Story 4.2 (loading screen) — navigation to play screen, `lib/api.ts`, `types/quiz.ts`, `hooks/useQuizGeneration.ts`. **Status: done**
- **Depends on:** Story 1.1b (Tamagui theme) — sub-themes `success`, `error` for feedback colors. **Status: review**
- **Depends on:** Story 1.5 (TanStack + Zustand) — state management infrastructure. **Status: done**
- **Enables:** Story 4.9 (immediate feedback with sound) — adds sound to the visual feedback
- **Enables:** Story 4.10 (progress saving) — saves per-sub-question results to Supabase
- **Enables:** Story 4.11 (results screen) — shows quiz completion summary

**Backend reading comprehension endpoint exists.** The `ReadingComprehensionQuestion` schema in `dangdai-api/src/api/schemas.py` defines `passage: str` and `comprehension_questions: list[ComprehensionSubQuestion]` where each sub-question has `question: str`, `options: list[str]`, `correct: int` (index). The mobile client must transform `correct` (index) to `correct_answer` (string) when receiving the response.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/ReadingPassageCard --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/ReadingPassageCard.tsx types/quiz.ts --ext .ts,.tsx
```

**Mock quiz data for tests:**

```typescript
import type { QuizQuestion, QuizResponse, ComprehensionSubQuestion } from '../types/quiz'

const mockComprehensionSubQuestions: ComprehensionSubQuestion[] = [
  {
    question: 'What does the author do first in the morning?',
    options: ['吃早餐', '去跑步', '喝咖啡', '看書'],
    correct_answer: '去跑步',
  },
  {
    question: 'What does the author like to eat for breakfast?',
    options: ['麵包和牛奶', '包子和豆漿', '飯和菜', '水果和咖啡'],
    correct_answer: '包子和豆漿',
  },
  {
    question: 'What time does the author wake up?',
    options: ['五點', '六點', '七點', '八點'],
    correct_answer: '六點',
  },
]

const mockReadingQuestion: QuizQuestion = {
  question_id: 'rc-1',
  exercise_type: 'reading_comprehension',
  question_text: 'Read the passage and answer the questions.',
  correct_answer: 'See sub-questions',
  explanation: 'This passage describes a daily morning routine using time expressions and sequential actions.',
  source_citation: 'Book 2, Chapter 12 - Reading',
  passage: '我每天早上六點起床。起床以後先去跑步，然後吃早餐。我很喜歡吃包子和豆漿。吃完早餐以後，我就去上課了。',
  passage_pinyin: 'Wǒ měi tiān zǎo shàng liù diǎn qǐ chuáng. Qǐ chuáng yǐ hòu xiān qù pǎo bù, rán hòu chī zǎo cān. Wǒ hěn xǐ huān chī bāo zi hé dòu jiāng. Chī wán zǎo cān yǐ hòu, wǒ jiù qù shàng kè le.',
  comprehension_questions: mockComprehensionSubQuestions,
}

const mockReadingQuestion2: QuizQuestion = {
  question_id: 'rc-2',
  exercise_type: 'reading_comprehension',
  question_text: 'Read the passage and answer the questions.',
  correct_answer: 'See sub-questions',
  explanation: 'This passage describes weekend activities and preferences.',
  source_citation: 'Book 2, Chapter 12 - Reading',
  passage: '週末的時候，我喜歡去圖書館看書。圖書館很安靜，我可以在那裡學習。下午我會去打籃球。',
  comprehension_questions: [
    {
      question: 'Where does the author like to go on weekends?',
      options: ['公園', '圖書館', '電影院', '商店'],
      correct_answer: '圖書館',
    },
    {
      question: 'What does the author do in the afternoon?',
      options: ['看書', '打籃球', '游泳', '跑步'],
      correct_answer: '打籃球',
    },
  ],
}

// Full quiz response with mixed reading comprehension + vocabulary
const mockReadingQuizResponse: QuizResponse = {
  quiz_id: 'test-reading-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'reading_comprehension',
  question_count: 2,
  questions: [mockReadingQuestion, mockReadingQuestion2],
}

// Mixed quiz with reading comprehension and vocabulary
const mockMixedQuizWithReading: QuizResponse = {
  quiz_id: 'test-mixed-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'mixed',
  question_count: 3,
  questions: [
    {
      question_id: 'v1',
      exercise_type: 'vocabulary',
      question_text: 'What does this character mean?',
      correct_answer: 'to study',
      explanation: '學 (xué) means to study/learn.',
      source_citation: 'Book 2, Chapter 12 - Vocabulary',
      character: '學',
      pinyin: 'xué',
      options: ['to study', 'to teach', 'to read', 'to write'],
    },
    mockReadingQuestion,  // 3 sub-questions
    // Total scored questions: 1 (vocab) + 3 (reading sub-questions) = 4
  ],
}
```

**Key test scenarios:**

1. `ReadingPassageCard` renders passage text in a scrollable container
2. "Read the following passage:" header is displayed
3. First comprehension question text renders below the passage
4. 4 answer options render via `AnswerOptionGrid`
5. Pinyin toggle button appears when `passage_pinyin` is provided
6. Pinyin toggle button does NOT appear when `passage_pinyin` is undefined
7. Tapping pinyin toggle shows pinyin text above passage
8. Tapping pinyin toggle again hides pinyin text
9. Selecting correct answer: selected option shows `correct` state, `onAnswer(true)` called
10. Selecting incorrect answer: selected option shows `incorrect` state, correct answer highlighted, `onAnswer(false)` called
11. All options disabled after selection (cannot change answer)
12. Sub-question progress shows "Question 1/3", "Question 2/3", etc.
13. Passage stays visible (not unmounted) when advancing between sub-questions
14. After answering last sub-question, `onAnswer` triggers quiz-level advancement
15. `play.tsx` renders `ReadingPassageCard` when `exercise_type === 'reading_comprehension'`
16. `QuizProgress` reflects total sub-question count across all passages
17. Score increments correctly for each sub-question answered correctly
18. Mixed quiz renders both vocabulary and reading comprehension types correctly

### File Structure

```
dangdai-mobile/
├── app/quiz/
│   └── play.tsx                              # MODIFY: add reading_comprehension case
├── components/quiz/
│   ├── ReadingPassageCard.tsx                 # CREATE: scrollable passage + pinyin toggle + comprehension questions
│   └── ReadingPassageCard.test.tsx            # CREATE: unit + integration tests
└── types/
    └── quiz.ts                               # MODIFY: add ComprehensionSubQuestion, passage, passage_pinyin, comprehension_questions
```

### Previous Story Intelligence

**From Story 4.3 (vocabulary quiz — ready-for-dev):**
- Creates `app/quiz/play.tsx` with exercise type switching — this story adds the `reading_comprehension` case
- Creates `AnswerOptionGrid` component — REUSE for comprehension answer options (same 2x2 grid or list layout)
- Creates `QuizProgress` component — REUSE for overall quiz progress display
- Creates `QuizQuestionCard` component — NOT needed for reading comprehension (passage has its own layout)
- Extends `useQuizStore` with `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion` — USE as-is
- Uses `AnimatePresence` with `key={currentQuestionIndex}` for question transitions — follow the same pattern for sub-question transitions

**From Story 4.2 (loading screen — done):**
- `lib/api.ts` has complete `api.generateQuiz()` with JWT auth pattern — no changes needed
- `types/quiz.ts` has `QuizQuestion` with optional fields — extend with `passage`, `passage_pinyin`, `comprehension_questions`
- `QuizGenerationError` class pattern — no new error types needed

**From Story 4.1 (quiz generation API — review):**
- Backend `ReadingComprehensionQuestion` schema has `passage: str` and `comprehension_questions: list[ComprehensionSubQuestion]`
- Backend `ComprehensionSubQuestion` has `question: str`, `options: list[str]`, `correct: int` (index 0-3)
- **IMPORTANT:** Backend uses `correct: int` (index into `options` array), but the mobile type should store `correct_answer: string` (the actual answer text) for simpler comparison. Transform when receiving the API response.
- Backend generates 5 questions for reading comprehension (vs 12 for other types) — each question is a passage with 2-3 sub-questions

**From architecture.md:**
- Reading comprehension uses **LOCAL validation only** (exact match against answer key). No LLM call needed.
- Validation latency: <100ms (same as vocabulary, grammar, fill-in-blank, matching)
- This is the simplest validation pattern — no hybrid validation, no `useAnswerValidation` hook needed

**From UX spec:**
- `PassageContainer` styled component with `size` variants (`short`, `medium`, `long`) — use exactly as specified
- Passage is independently scrollable within its container (ScrollView inside Card)
- Chinese characters in passage: minimum 20px body reading size, key vocabulary highlighted
- Featured display characters: 72px minimum (for any standalone character display, not body text)
- Pinyin toggle: tap to show/hide pinyin above characters
- Standard answer feedback applies to comprehension questions (same as vocabulary/grammar)

**From Story 4.7 (sentence construction — ready-for-dev):**
- Demonstrates the pattern for extending `play.tsx` with a new exercise type case
- Shows how to wire `onAnswer` callback to `useQuizStore.setAnswer()` and `addScore()`
- Shows feedback delay pattern (~1.5s for sentence construction, ~1s for reading comprehension)

**From Story 4.6 (dialogue completion — ready-for-dev):**
- Creates `useAnswerValidation` hook — NOT needed for reading comprehension (local only)
- Creates `api.validateAnswer()` — NOT needed for reading comprehension
- Shows the pattern for exercise-specific components that manage their own internal state

### References

- [Source: epics.md#Story-4.8] - Story requirements and acceptance criteria
- [Source: architecture.md#Answer-Validation-Strategy] - Reading comprehension uses local validation only (exact match, <100ms)
- [Source: architecture.md#Project-Structure] - `ReadingPassageCard.tsx` in `components/quiz/`
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets, sub-themes, declarative animation props
- [Source: architecture.md#State-Management] - Zustand for quiz state, TanStack Query for server state
- [Source: ux-design-specification.md#ReadingPassageCard] - `PassageContainer` styled component spec with `size` variants, scrollable passage, pinyin toggle
- [Source: ux-design-specification.md#Animation-Patterns] - AnimatePresence for question transitions, named presets
- [Source: ux-design-specification.md#Accessibility] - 48px touch targets, 20px body reading size, 72px featured characters
- [Source: ux-design-specification.md#Feedback-Patterns] - Standard correct/incorrect overlay for comprehension answers
- [Source: dangdai-api/src/api/schemas.py#ReadingComprehensionQuestion] - Backend schema: `passage: str`, `comprehension_questions: list[ComprehensionSubQuestion]`
- [Source: dangdai-api/src/api/schemas.py#ComprehensionSubQuestion] - Backend sub-question schema: `question: str`, `options: list[str]`, `correct: int`
- [Source: dangdai-api/src/agent/prompts.py#READING_COMPREHENSION_INSTRUCTIONS] - LLM prompt: 2-4 sentence passages, 2-3 sub-questions each
- [Source: dangdai-api/src/agent/nodes.py] - Backend generates 5 reading comprehension questions (passages) per quiz
- [Source: 4-3-vocabulary-quiz-question-display.md] - Play screen structure, AnswerOptionGrid reuse, QuizProgress reuse, useQuizStore extensions
- [Source: 4-7-sentence-construction-exercise.md] - Pattern for extending play.tsx with new exercise type, onAnswer wiring
- [Source: 4-6-dialogue-completion-exercise.md] - useAnswerValidation hook (NOT needed here, but shows exercise-specific component pattern)
- [Source: prd.md#FR22] - Reading Comprehension: user reads passage and answers questions, generated from workbook reading exercises and textbook reading passages
- [Source: prd.md#FR23] - Immediate feedback per answer
- [Source: prd.md#NFR2] - 500ms screen navigation

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-5

### Debug Log References

N/A

### Completion Notes List

✅ **Story 4.8 Complete: Reading Comprehension Exercise**

**Implemented:**
1. Extended `types/quiz.ts` with `ComprehensionSubQuestion` interface and reading comprehension fields (`passage`, `passage_pinyin`, `comprehension_questions`) on `QuizQuestion`
2. Created `ReadingPassageCard` component with:
   - Scrollable passage container using `ScrollView` inside styled `Card`
   - Pinyin toggle button (only shown when `passage_pinyin` is provided)
   - Sub-question progress indicator (e.g., "Question 1/3")
   - `AnimatePresence` for sub-question transitions (passage stays mounted)
   - Reused `AnswerOptionGrid` from Story 4.3 for answer options
   - 1s feedback delay before advancing to next sub-question
3. Created comprehensive unit tests for `ReadingPassageCard` (16 tests, all passing)
4. Integrated reading comprehension into `app/quiz/play.tsx`:
   - Added `isReadingComprehension` exercise type flag
   - Managed sub-question index as local state (resets on question change)
   - Implemented `handleReadingSubQuestionAnswer` handler
   - Each sub-question counts as a separate scored answer
   - Passage stays visible across all sub-questions
   - Timer stops only on the last sub-question
5. Added integration tests for reading comprehension in `play.test.tsx` (5 tests, all passing)

**All acceptance criteria met:**
- AC #1: Scrollable Chinese text passage (20px body reading size), pinyin toggle, comprehension questions below with standard multiple choice
- AC #2: Local answer validation with standard correct/incorrect feedback

**Tests:**
- All 16 `ReadingPassageCard` unit tests pass
- All 5 integration tests in `play.test.tsx` pass
- Type checking passes (`npx tsc`)
- Linting passes (`npx eslint`)
- Full test suite: 632/633 tests pass (1 unrelated failing test in `useChapters.test.ts`)

**Key implementation details:**
- Sub-question index is ephemeral local state (not stored in `useQuizStore`)
- Passage does NOT unmount when advancing between sub-questions
- Each sub-question answer is stored as a JSON array in the quiz store
- Score increments by 10 points per correct sub-question
- Supabase result saved only after the last sub-question
- Used Tamagui animation presets (`animation="medium"`) and declarative styles
- Followed all Tamagui rules (no hardcoded colors, no RN `Animated` API, etc.)

### File List

- `dangdai-mobile/types/quiz.ts` — Added `ComprehensionSubQuestion` interface and reading comprehension fields to `QuizQuestion`
- `dangdai-mobile/components/quiz/ReadingPassageCard.tsx` — Created scrollable passage card with pinyin toggle and comprehension questions
- `dangdai-mobile/components/quiz/ReadingPassageCard.test.tsx` — Created unit tests for ReadingPassageCard component
- `dangdai-mobile/app/quiz/play.tsx` — Integrated reading comprehension exercise type with sub-question management
- `dangdai-mobile/app/quiz/play.test.tsx` — Added integration tests for reading comprehension in play.tsx

### Change Log

- 2026-02-21: Implemented reading comprehension exercise type with scrollable passage, pinyin toggle, and sub-question navigation (Story 4.8)
- 2026-02-21: **Code review fixes (13 issues):**
  - Fixed memory leak: setTimeout now has proper cleanup in useEffect
  - Added array bounds checking for currentSubQuestionIndex
  - Fixed race condition in handleReadingSubQuestionAnswer
  - Fixed incorrect feedback on last sub-question (now uses allSubAnswersCorrect)
  - Added accessibility labels to all interactive elements
  - Added error handling for empty comprehension_questions array
  - Implemented getTotalQuestionCount for accurate QuizProgress
  - Fixed QuizProgress current position to count sub-questions correctly
  - Optimized AnimatePresence to reduce unnecessary re-renders
  - Added null check for empty passage_pinyin string
  - Made feedback delay configurable via feedbackDelayMs prop
  - Added minHeight to PassageContainer to prevent layout shift
  - Added 4 new tests (empty pinyin, error states, custom delay)
  - **Tests:** All 20 ReadingPassageCard tests pass, all 5 integration tests pass

### File List
