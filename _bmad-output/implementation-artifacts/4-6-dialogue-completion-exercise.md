# Story 4.6: Dialogue Completion Exercise

Status: review

## Story

As a user,
I want to complete conversation exercises by selecting appropriate responses,
So that I can practice dialogue patterns from the textbook.

## Acceptance Criteria

1. **Given** a dialogue completion exercise has loaded **When** I view the exercise **Then** I see conversation bubbles (A left-aligned, B right-aligned) with one blank bubble **And** answer options are displayed below the dialogue as a vertical list **And** Chinese characters are displayed at 72px minimum in bubbles

2. **Given** I tap an answer option **When** the selection is registered **Then** the selected text fills the blank bubble with a slide-in animation **Then** if the answer matches the key: local validation -> instant correct feedback **Then** if the answer differs from key: LLM validation call via `/api/quizzes/validate-answer` **And** LLM returns is_correct + explanation + alternative valid answers **And** if correct alternative: "Your answer is also valid!" shown with alternatives **And** if incorrect: correct answer shown with explanation

## Tasks / Subtasks

- [x] Task 1: Extend `types/quiz.ts` with dialogue-specific types (AC: #1)
  - [x] 1.1 Add `DialogueLine` interface: `{ speaker: 'a' | 'b', text: string, isBlank: boolean }`
  - [x] 1.2 Add `DialogueQuestion` interface extending `QuizQuestion` with `dialogue_lines: DialogueLine[]`
  - [x] 1.3 Add `AnswerValidationRequest` and `AnswerValidationResponse` types for the LLM validation endpoint
  - [x] 1.4 Ensure `QuizQuestion` union can discriminate dialogue_completion via `exercise_type` field

- [x] Task 2: Extend `lib/api.ts` with `validateAnswer()` method (AC: #2)
  - [x] 2.1 Add `ANSWER_VALIDATION_TIMEOUT_MS = 3_000` constant
  - [x] 2.2 Add `api.validateAnswer({ question, userAnswer, correctAnswer, exerciseType })` method
  - [x] 2.3 Use `AbortController` with 3-second timeout
  - [x] 2.4 Return typed `AnswerValidationResponse` (`{ is_correct, explanation, alternatives }`)
  - [x] 2.5 On timeout/network error: throw typed error so caller can fall back to local validation

- [x] Task 3: Create `useAnswerValidation` hook (AC: #2)
  - [x] 3.1 Create `hooks/useAnswerValidation.ts` with hybrid validation logic
  - [x] 3.2 Implement local check first: exact match against `correct_answer` -> instant result
  - [x] 3.3 If no local match: call `api.validateAnswer()` via TanStack `useMutation`
  - [x] 3.4 On LLM timeout/error: fall back to local validation (mark as incorrect if doesn't match key)
  - [x] 3.5 Return `{ validate, isValidating }` with typed `ValidationResult`
  - [x] 3.6 Write co-located test `hooks/useAnswerValidation.test.ts`

- [x] Task 4: Create `DialogueCard` component (AC: #1, #2)
  - [x] 4.1 Create `components/quiz/DialogueCard.tsx` with `DialogueBubble` styled component
  - [x] 4.2 Implement `speaker` variant: `a` (left-aligned, `$surface` bg) and `b` (right-aligned, `$primary` bg)
  - [x] 4.3 Implement `hasBlank` variant: dashed border with `$primary` color
  - [x] 4.4 Render dialogue lines as alternating bubbles with staggered `enterStyle` animation
  - [x] 4.5 Render answer options below dialogue as vertical list with `AnswerOption` styled buttons
  - [x] 4.6 On option tap: fill blank bubble with selected text via slide-in animation (`animation="medium"`)
  - [x] 4.7 Trigger `useAnswerValidation.validate()` after selection
  - [x] 4.8 Show loading spinner on blank bubble during LLM validation (non-blocking UI)
  - [x] 4.9 Display feedback: success/error theme on filled bubble + explanation text
  - [x] 4.10 Show "Your answer is also valid!" message when LLM confirms a correct alternative
  - [x] 4.11 Show correct answer + explanation when answer is incorrect
  - [x] 4.12 Disable all answer options after selection (prevent re-selection)
  - [x] 4.13 Enforce 72px minimum font size for Chinese characters in bubbles (`fontSize="$13"`)
  - [x] 4.14 Enforce 48px minimum touch targets on answer options (`minHeight: 48`)
  - [x] 4.15 Write co-located test `components/quiz/DialogueCard.test.tsx`

- [x] Task 5: Integrate `DialogueCard` into quiz play screen (AC: #1, #2)
  - [x] 5.1 Modify `app/quiz/play.tsx` to handle `dialogue_completion` exercise type
  - [x] 5.2 Add `dialogue_completion` case to the exercise type switch/conditional rendering
  - [x] 5.3 Pass dialogue question data to `DialogueCard` component
  - [x] 5.4 Wire answer result to `useQuizStore.setAnswer()` and `addScore()`
  - [x] 5.5 After feedback delay (~1s): call `useQuizStore.nextQuestion()` to advance

- [x] Task 6: Write integration tests (AC: #1, #2)
  - [x] 6.1 Test `DialogueCard` renders conversation bubbles with correct alignment
  - [x] 6.2 Test blank bubble has dashed border styling
  - [x] 6.3 Test selecting an option fills the blank bubble
  - [x] 6.4 Test local validation path: exact match -> instant correct feedback
  - [x] 6.5 Test LLM validation path: non-match -> loading state -> LLM result
  - [x] 6.6 Test LLM timeout fallback: timeout -> falls back to local (incorrect)
  - [x] 6.7 Test "Your answer is also valid!" message for correct alternatives
  - [x] 6.8 Test options are disabled after selection
  - [x] 6.9 Test Chinese characters render at 72px minimum

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Wired into AuthProvider for cleanup on sign-out. Story 4.3 may have extended with `quizPayload`. | **USE** existing actions — check if `quizPayload` extension exists from Story 4.3 |
| `types/quiz.ts` | Full types: `ExerciseType` (includes `'dialogue_completion'`), `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. `QuizQuestion` has optional `character`, `pinyin`, `options` fields. | **EXTEND** with `DialogueLine`, `DialogueQuestion`, `AnswerValidationRequest`, `AnswerValidationResponse` |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, 10s timeout, typed errors. Uses `AbortController` pattern. | **EXTEND** with `api.validateAnswer()` — follow same auth + AbortController pattern |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** as-is — do not modify |
| `app/quiz/loading.tsx` | Full loading screen with tip rotation, progress bar, error states. Navigates to quiz screen on success. | **DO NOT MODIFY** — already handles navigation |
| `app/quiz/play.tsx` | Quiz play screen handling vocab/grammar/fill-in-blank/matching (created in Stories 4.3-4.5). | **MODIFY** — add `dialogue_completion` type rendering |
| `components/quiz/QuizProgress.tsx` | Progress bar + counter component. | **USE** as-is — already rendered by play.tsx |
| `components/quiz/AnswerOptionGrid.tsx` | Answer options with `state` variant (default/selected/correct/incorrect/disabled). | **REFERENCE** for styling patterns — dialogue uses its own vertical list but can reuse `AnswerOption` styled component |
| `lib/queryKeys.ts` | Has `quiz(quizId)` key factory. | **USE** as-is |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. Font size `$13` = 72px. | **USE** — all tokens and presets available |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/DialogueCard.tsx` | Dialogue bubble layout + answer selection + hybrid validation UI |
| `components/quiz/DialogueCard.test.tsx` | Unit/integration tests for DialogueCard |
| `hooks/useAnswerValidation.ts` | Hybrid validation hook (local check + LLM fallback) |
| `hooks/useAnswerValidation.test.ts` | Tests for validation hook |

### CRITICAL: Hybrid Validation Pattern

This is one of ONLY 2 exercise types that uses LLM validation (along with Sentence Construction in Story 4.7). The validation flow is:

```
User taps answer option
        │
        ▼
┌─────────────────────┐
│ Local exact match?   │
│ userAnswer.trim() == │
│ correctAnswer.trim() │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │ YES       │ NO
    ▼           ▼
 Instant    ┌──────────────────────┐
 correct    │ Call POST             │
 feedback   │ /api/quizzes/         │
            │ validate-answer       │
            │ (3s timeout)          │
            └──────────┬───────────┘
                       │
              ┌────────┴────────┐
              │ SUCCESS         │ TIMEOUT/ERROR
              ▼                 ▼
    ┌──────────────┐    Fall back to local:
    │ LLM response │    answer != key → incorrect
    │ is_correct?  │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │ TRUE      │ FALSE
     ▼           ▼
  "Your answer   Show correct
  is also valid!" answer +
  + alternatives  explanation
```

**Key rules:**
- Local check ALWAYS happens first (instant, no network)
- LLM call ONLY when local check fails (answer differs from key)
- 3-second timeout on LLM call with `AbortController`
- Fallback to local on ANY error (timeout, network, 500, etc.)
- UI MUST NOT block during LLM call — show loading indicator on the blank bubble
- The `explanation` field from the original `QuizQuestion` is used for local validation feedback
- The LLM response `explanation` is used for LLM validation feedback

### DialogueCard Component Spec

```tsx
// components/quiz/DialogueCard.tsx

import { styled, YStack, XStack, Text, Button, Spinner, Theme, AnimatePresence } from 'tamagui'

/**
 * DialogueBubble — styled speech bubble for conversation display.
 * Speaker A = left-aligned (surface bg), Speaker B = right-aligned (primary bg).
 * hasBlank variant adds dashed border for the blank to fill.
 */
const DialogueBubble = styled(YStack, {
  animation: 'medium',
  enterStyle: { opacity: 0, y: 5 },
  padding: '$3',
  borderRadius: 12,
  maxWidth: '80%',

  variants: {
    speaker: {
      a: {
        alignSelf: 'flex-start',
        backgroundColor: '$surface',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
      b: {
        alignSelf: 'flex-end',
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
    },
    hasBlank: {
      true: {
        borderStyle: 'dashed',
        borderColor: '$primary',
        borderWidth: 2,
      },
    },
  } as const,
})

/**
 * DialogueAnswerOption — styled button for answer selection below dialogue.
 * Vertical list layout (not 2x2 grid — dialogue answers are full sentences).
 */
const DialogueAnswerOption = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.98 },
  minHeight: 48,
  borderWidth: 1,
  borderRadius: '$3',
  justifyContent: 'flex-start',
  paddingHorizontal: '$3',
  paddingVertical: '$2',

  variants: {
    state: {
      default: { borderColor: '$borderColor', backgroundColor: '$surface' },
      selected: { borderColor: '$primary', backgroundColor: '$backgroundPress' },
      correct: { borderColor: '$success', backgroundColor: '$successBackground' },
      incorrect: { borderColor: '$error', backgroundColor: '$errorBackground' },
      disabled: { opacity: 0.5 },
    },
  } as const,
})
```

**Props interface:**

```typescript
interface DialogueCardProps {
  /** The dialogue question data */
  question: DialogueQuestion
  /** Callback when answer is validated (correct: boolean, isAlternative: boolean) */
  onAnswerResult: (result: {
    correct: boolean
    selectedAnswer: string
    isAlternative: boolean
    explanation: string
    alternatives?: string[]
  }) => void
  /** Whether interaction is disabled (e.g., already answered) */
  disabled?: boolean
}
```

### useAnswerValidation Hook Pattern

```typescript
// hooks/useAnswerValidation.ts

import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ExerciseType } from '../types/quiz'

/** Result of answer validation (local or LLM). */
interface ValidationResult {
  isCorrect: boolean
  /** Whether the answer was validated by LLM as a correct alternative */
  isAlternative: boolean
  /** Explanation for the answer (from quiz payload or LLM) */
  explanation: string
  /** Alternative valid answers (from LLM only) */
  alternatives?: string[]
  /** Whether LLM was used (vs local-only) */
  usedLlm: boolean
}

interface ValidateParams {
  userAnswer: string
  correctAnswer: string
  questionText: string
  exerciseType: ExerciseType
  /** Pre-generated explanation from quiz payload (used for local validation) */
  preGeneratedExplanation: string
}

/**
 * Hook for hybrid answer validation.
 *
 * 1. Checks locally against answer key (exact match)
 * 2. If no match → calls LLM validation endpoint (3s timeout)
 * 3. If LLM times out → falls back to local (incorrect)
 *
 * Usage:
 * ```tsx
 * const { validate, isValidating, result } = useAnswerValidation()
 * await validate({ userAnswer, correctAnswer, questionText, exerciseType, preGeneratedExplanation })
 * ```
 */
export function useAnswerValidation() {
  const llmMutation = useMutation({
    mutationFn: (params: {
      question: string
      userAnswer: string
      correctAnswer: string
      exerciseType: string
    }) => api.validateAnswer(params),
    retry: 0, // No auto-retry — timeout fallback handles failure
  })

  async function validate(params: ValidateParams): Promise<ValidationResult> {
    // Step 1: Local exact match
    const localMatch =
      params.userAnswer.trim() === params.correctAnswer.trim()

    if (localMatch) {
      return {
        isCorrect: true,
        isAlternative: false,
        explanation: params.preGeneratedExplanation,
        usedLlm: false,
      }
    }

    // Step 2: LLM validation (with 3s timeout handled inside api.validateAnswer)
    try {
      const llmResult = await llmMutation.mutateAsync({
        question: params.questionText,
        userAnswer: params.userAnswer,
        correctAnswer: params.correctAnswer,
        exerciseType: params.exerciseType,
      })

      return {
        isCorrect: llmResult.is_correct,
        isAlternative: llmResult.is_correct,
        explanation: llmResult.explanation,
        alternatives: llmResult.alternatives,
        usedLlm: true,
      }
    } catch {
      // Step 3: Fallback to local on timeout/error — mark as incorrect
      return {
        isCorrect: false,
        isAlternative: false,
        explanation: params.preGeneratedExplanation,
        usedLlm: false,
      }
    }
  }

  return {
    validate,
    isValidating: llmMutation.isPending,
    result: null as ValidationResult | null, // Managed by caller via state
  }
}
```

### API Client Extension (validateAnswer)

```typescript
// Addition to lib/api.ts

/** Client-side timeout for answer validation requests (3 seconds). */
const ANSWER_VALIDATION_TIMEOUT_MS = 3_000

// Inside the api object:

/**
 * Validate an answer via the LLM backend.
 * Used for Dialogue Completion and Sentence Construction exercise types
 * when the user's answer differs from the pre-generated answer key.
 *
 * @param params - Validation parameters.
 * @returns LLM validation result with is_correct, explanation, alternatives.
 * @throws {QuizGenerationError} On timeout, network, or server error.
 */
async validateAnswer(params: {
  question: string
  userAnswer: string
  correctAnswer: string
  exerciseType: string
}): Promise<AnswerValidationResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ANSWER_VALIDATION_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}/api/quizzes/validate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        question: params.question,
        user_answer: params.userAnswer,
        correct_answer: params.correctAnswer,
        exercise_type: params.exerciseType,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new QuizGenerationError('server', 'Answer validation failed.')
    }

    return (await response.json()) as AnswerValidationResponse
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof QuizGenerationError) throw error

    if (error instanceof Error && error.name === 'AbortError') {
      throw new QuizGenerationError('timeout', 'Validation timed out.')
    }

    throw new QuizGenerationError('network', 'Validation request failed.')
  }
}
```

### Dialogue Data Shape

The backend returns dialogue questions with a `dialogue_lines` array embedded in the question payload. The `question_text` field contains the instruction (e.g., "Complete the dialogue"), while `dialogue_lines` contains the conversation structure.

```typescript
// Types to add to types/quiz.ts

/** A single line in a dialogue exercise. */
interface DialogueLine {
  /** Speaker identifier */
  speaker: 'a' | 'b'
  /** The text content of this line. Empty string if this is the blank. */
  text: string
  /** Whether this line is the blank the user must fill */
  isBlank: boolean
}

/** Extended question type for dialogue completion exercises. */
interface DialogueQuestion extends QuizQuestion {
  exercise_type: 'dialogue_completion'
  /** The conversation lines with one blank */
  dialogue_lines: DialogueLine[]
  /** Answer options for the blank (displayed as vertical list) */
  options: string[]  // Required (not optional) for dialogue
}

/** Request body for POST /api/quizzes/validate-answer */
interface AnswerValidationRequest {
  question: string
  user_answer: string
  correct_answer: string
  exercise_type: string
}

/** Response from POST /api/quizzes/validate-answer */
interface AnswerValidationResponse {
  is_correct: boolean
  explanation: string
  alternatives: string[]
}
```

**Example dialogue question from API:**

```json
{
  "question_id": "dq1",
  "exercise_type": "dialogue_completion",
  "question_text": "Complete the conversation by selecting the best response.",
  "correct_answer": "咖啡",
  "explanation": "The question asks what you want to drink (喝什麼). 咖啡 (coffee) is the appropriate response.",
  "source_citation": "Book 1, Chapter 12 - Dialogue",
  "dialogue_lines": [
    { "speaker": "a", "text": "你要喝什麼？", "isBlank": false },
    { "speaker": "b", "text": "", "isBlank": true },
    { "speaker": "a", "text": "好的，我也是。", "isBlank": false }
  ],
  "options": ["咖啡", "你好", "謝謝", "再見"]
}
```

### Screen Layout

```
┌─────────────────────────────────┐
│ Dialogue - Chapter 12    Q 3/10 │  ← QuizProgress (reused)
│ ██████████████░░░░░░            │
├─────────────────────────────────┤
│                                 │
│ ┌──────────────────┐            │
│ │ A: 你要喝什麼？   │            │  ← Speaker A bubble (left, $surface bg)
│ └──────────────────┘            │
│                                 │
│          ┌──────────────────┐   │
│          │ B: _____________ │   │  ← Speaker B bubble (right, dashed border)
│          └──────────────────┘   │
│                                 │
│ ┌──────────────────┐            │
│ │ A: 好的，我也是。  │            │  ← Speaker A bubble (left)
│ └──────────────────┘            │
│                                 │
│ Select the best response:       │  ← Instruction text
│                                 │
│ ┌───────────────────────────┐   │
│ │ A) 咖啡                    │   │  ← DialogueAnswerOption (vertical list)
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ B) 你好                    │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ C) 謝謝                    │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ D) 再見                    │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**After selection (during LLM validation):**

```
┌─────────────────────────────────┐
│          ┌──────────────────┐   │
│          │ B: 咖啡    ⟳     │   │  ← Blank filled + spinner (LLM validating)
│          └──────────────────┘   │
│                                 │
│ ┌───────────────────────────┐   │
│ │ A) 咖啡  ← (selected)     │   │  ← All options disabled
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ B) 你好                    │   │  ← Dimmed (disabled)
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

**After validation (correct alternative):**

```
┌─────────────────────────────────┐
│          ┌──────────────────┐   │
│          │ B: 茶      ✓     │   │  ← Success theme, checkmark
│          └──────────────────┘   │
│                                 │
│ Your answer is also valid!      │  ← Alternative confirmation
│ Other valid answers: 咖啡, 水   │  ← Alternatives list
│                                 │
│ 茶 (chá) means tea. The         │  ← LLM explanation
│ question asks what you want     │
│ to drink.                       │
└─────────────────────────────────┘
```

### Tamagui Animation Patterns

**Bubble stagger animation:**
Each dialogue bubble should appear with a slight delay for a natural conversation feel. Use the `enterStyle` with increasing `y` offset or use `delay` if supported.

```tsx
// Stagger effect via enterStyle y-offset per bubble index
<DialogueBubble
  speaker={line.speaker}
  hasBlank={line.isBlank}
  animation="medium"
  enterStyle={{ opacity: 0, y: 5 + index * 3 }}
>
```

**Blank fill slide-in animation:**
When the user selects an answer, the text should slide into the blank bubble.

```tsx
// Inside the blank bubble, wrap the filled text in AnimatePresence
<AnimatePresence>
  {selectedAnswer && (
    <Text
      key="filled-answer"
      animation="medium"
      enterStyle={{ opacity: 0, x: 20 }}
      fontSize="$13"  // 72px for Chinese characters
    >
      {selectedAnswer}
    </Text>
  )}
</AnimatePresence>
```

**Feedback theme wrapping:**
After validation, wrap the filled bubble in a Theme for color context.

```tsx
<Theme name={isCorrect ? 'success' : 'error'}>
  <DialogueBubble speaker={blankLine.speaker}>
    <Text fontSize="$13">{selectedAnswer}</Text>
    {isCorrect && <Check size={20} color="$success" />}
    {!isCorrect && <X size={20} color="$error" />}
  </DialogueBubble>
</Theme>
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts -- not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on interactive elements
- **ALWAYS** use font size token `$13` for 72px Chinese character display (per `tamagui.config.ts` font scale)

### Anti-Patterns to Avoid

- **DO NOT** implement sound effects -- that's Story 4.9 (Immediate Answer Feedback)
- **DO NOT** save results to Supabase -- that's Story 4.10 (Quiz Progress Saving)
- **DO NOT** create a CompletionScreen -- that's Story 4.11 (Quiz Results)
- **DO NOT** skip LLM validation -- this exercise type REQUIRES hybrid validation per architecture
- **DO NOT** block UI during LLM validation -- show a loading spinner on the blank bubble while waiting
- **DO NOT** hardcode hex color values -- use Tamagui `$token` references only
- **DO NOT** use `React.useState` for quiz session state -- use `useQuizStore` (Zustand)
- **DO NOT** use `Animated` from React Native -- use Tamagui declarative animations
- **DO NOT** create `components/quiz/index.ts` barrel files -- import directly from each component file
- **DO NOT** use `useQuery` for validation -- it's a mutation (side-effect triggered by user action)
- **DO NOT** implement drag-and-drop for dialogue -- this is tap-to-select only
- **DO NOT** handle other exercise types in DialogueCard -- it only handles `dialogue_completion`
- **Fallback to local on LLM timeout is MANDATORY** -- never leave the user hanging

### Dependencies on Other Stories

- **Depends on:** Story 4.1b (Answer Validation API Endpoint) -- backend must have `POST /api/quizzes/validate-answer`. If not deployed, the hook's timeout fallback will handle it gracefully (falls back to local validation).
- **Depends on:** Story 4.3 (Vocabulary Quiz) -- `app/quiz/play.tsx` must exist with the base quiz flow, `QuizProgress`, `useQuizStore` extensions (`quizPayload`, `getCurrentQuestion`, `isLastQuestion`).
- **Depends on:** Story 1.1b (Tamagui Theme) -- DONE (sub-themes `success`, `error`, animation presets available)
- **Depends on:** Story 1.5 (TanStack + Zustand) -- DONE
- **Enables:** Story 4.7 (Sentence Construction) -- will reuse `useAnswerValidation` hook and `api.validateAnswer()` method
- **Enables:** Story 4.9 (Immediate Feedback) -- will add sound effects and FeedbackOverlay to all exercise types including dialogue
- **Enables:** Story 4.10 (Progress Saving) -- will add per-question result saving for all exercise types

**Backend may not be deployed:** The `useAnswerValidation` hook is designed to gracefully degrade. If the backend `/api/quizzes/validate-answer` endpoint is not available, the 3-second timeout will trigger and the hook falls back to local validation (marking non-matching answers as incorrect). This means the DialogueCard UI works end-to-end even without the backend -- it just won't recognize correct alternatives.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/DialogueCard hooks/useAnswerValidation --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/DialogueCard.tsx hooks/useAnswerValidation.ts lib/api.ts types/quiz.ts --ext .ts,.tsx
```

**Mock dialogue question for tests:**

```typescript
const mockDialogueQuestion: DialogueQuestion = {
  question_id: 'dq1',
  exercise_type: 'dialogue_completion',
  question_text: 'Complete the conversation by selecting the best response.',
  correct_answer: '咖啡',
  explanation: 'The question asks what you want to drink (喝什麼). 咖啡 (coffee) is the appropriate response.',
  source_citation: 'Book 1, Chapter 12 - Dialogue',
  dialogue_lines: [
    { speaker: 'a', text: '你要喝什麼？', isBlank: false },
    { speaker: 'b', text: '', isBlank: true },
    { speaker: 'a', text: '好的，我也是。', isBlank: false },
  ],
  options: ['咖啡', '你好', '謝謝', '再見'],
}
```

**Mock LLM validation response for tests:**

```typescript
const mockValidationResponse: AnswerValidationResponse = {
  is_correct: true,
  explanation: '茶 (tea) is also a valid drink to order in this context.',
  alternatives: ['咖啡', '水', '茶'],
}
```

**Test scenarios:**

| Scenario | Input | Expected |
|----------|-------|----------|
| Exact match (local) | User selects "咖啡" (matches key) | Instant correct, no LLM call |
| Correct alternative (LLM) | User selects "茶" (valid but not key) | LLM call -> "Your answer is also valid!" |
| Incorrect (LLM) | User selects "你好" (wrong) | LLM call -> show correct answer + explanation |
| LLM timeout | User selects "茶", LLM times out | Fallback to local -> incorrect (doesn't match key) |
| LLM network error | User selects "茶", network fails | Fallback to local -> incorrect |
| Options disabled | User selects any option | All options become disabled |
| Bubble fill animation | User selects option | Selected text appears in blank bubble |

### File Structure

```
dangdai-mobile/
├── app/quiz/
│   └── play.tsx                        # MODIFY: add dialogue_completion case
├── components/quiz/
│   ├── DialogueCard.tsx                # CREATE: dialogue bubble layout + answer selection
│   └── DialogueCard.test.tsx           # CREATE: unit/integration tests
├── hooks/
│   ├── useAnswerValidation.ts          # CREATE: hybrid validation hook
│   └── useAnswerValidation.test.ts     # CREATE: hook tests
├── lib/
│   └── api.ts                          # MODIFY: add validateAnswer() method
└── types/
    └── quiz.ts                         # MODIFY: add DialogueLine, DialogueQuestion, validation types
```

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- Backend is at early scaffold stage. The `/api/quizzes/generate` endpoint may raise `NotImplementedError`.
- `dangdai_chunks` table has 1060 rows with `exercise_type` column for RAG filtering.
- `question_results` table does NOT exist yet -- irrelevant for this story.

**From Story 4.1b (answer validation API):**
- `POST /api/quizzes/validate-answer` accepts `{ question, user_answer, correct_answer, exercise_type }`.
- Returns `{ is_correct: bool, explanation: string, alternatives: string[] }`.
- Backend may not be deployed yet -- the 3s timeout fallback in `useAnswerValidation` handles this.

**From Story 4.2 (loading screen):**
- `lib/api.ts` has a complete `api.generateQuiz()` method with JWT auth, `AbortController` timeout, typed errors -- follow the same pattern for `validateAnswer()`.
- `hooks/useQuizGeneration.ts` is a thin `useMutation` wrapper -- follow the same pattern for `useAnswerValidation`.
- `types/quiz.ts` already defines `QuizQuestion` with optional `character`, `pinyin`, `options` fields. `ExerciseType` already includes `'dialogue_completion'`.

**From Story 4.3 (vocabulary quiz):**
- `app/quiz/play.tsx` exists with base quiz flow: reads `quizPayload` from `useQuizStore`, renders questions via `AnimatePresence`, handles answer selection + feedback delay + next question advancement.
- `components/quiz/QuizProgress.tsx` exists and is rendered by play.tsx.
- `components/quiz/AnswerOptionGrid.tsx` exists with `AnswerOption` styled component -- reference for styling patterns.
- `useQuizStore` was extended with `quizPayload`, `setQuizPayload`, `getCurrentQuestion()`, `isLastQuestion`.

**From Story 3.4 (chapter navigation):**
- Chapter ID convention: `bookId * 100 + chapterNumber` (e.g., Book 1 Chapter 12 = 112).

### References

- [Source: epics.md#Story-4.6] - Story requirements and acceptance criteria
- [Source: epics.md#Story-4.1b] - Answer validation API endpoint contract
- [Source: architecture.md#Answer-Validation-Strategy] - Hybrid validation: local for simple types, LLM for Dialogue Completion + Sentence Construction
- [Source: architecture.md#API-Endpoints] - `POST /api/quizzes/validate-answer` request/response schema
- [Source: architecture.md#Quiz-Generation-Flow] - Step 8: LLM call for complex types when answer differs from key
- [Source: architecture.md#Implementation-Patterns] - Naming conventions, file structure, enforcement rules
- [Source: ux-design-specification.md#DialogueCard] - `styled(YStack)` spec with `speaker` and `hasBlank` variants
- [Source: ux-design-specification.md#Dialogue-Completion-Interaction] - Full screen layout, key elements, behavior spec
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Dialogue Completion: tap response option, response fills bubble
- [Source: ux-design-specification.md#Feedback-Patterns] - 1s feedback display, auto-advance, 100ms feedback appearance
- [Source: ux-design-specification.md#Accessibility] - 48px touch targets, 72px Chinese characters
- [Source: 4-3-vocabulary-quiz-question-display.md] - Existing code state, QuizQuestionCard patterns, AnswerOptionGrid patterns, play.tsx structure
- [Source: prd.md#FR20] - Dialogue Completion: complete conversation exchanges
- [Source: prd.md#FR23] - Immediate feedback per answer
- [Source: prd.md#NFR2] - 500ms screen navigation

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic/claude-sonnet-4-6)

### Debug Log References

- DialogueCard.test.tsx: `jest.mock()` factory restriction — `React` cannot be referenced out-of-scope; used `require('react')` inside factory as `ReactLocal`.
- DialogueCard.test.tsx: disabled prop test used `accessibilityState?.disabled` pattern to match existing test conventions (same as `AnswerOptionGrid.test.tsx`).
- app/quiz/play.test.tsx: Adding `DialogueCard` import to play.tsx caused AsyncStorage transitive import failure in play.test.tsx. Fixed by adding DialogueCard mock to play.test.tsx.

### Completion Notes List

- **Task 1**: Extended `types/quiz.ts` with `DialogueLine`, `DialogueQuestion`, `AnswerValidationRequest`, `AnswerValidationResponse`. `QuizQuestion` extended with optional `dialogue_lines` field. Type discrimination works via `exercise_type: 'dialogue_completion'` literal on `DialogueQuestion`.
- **Task 2**: Extended `lib/api.ts` with `validateAnswer()` using same AbortController + 3s timeout pattern as `generateQuiz()`. Throws `QuizGenerationError` on auth/timeout/network/server errors so callers can distinguish.
- **Task 3**: Created `hooks/useAnswerValidation.ts` implementing the hybrid validation flow: local exact match → LLM mutation → fallback. Returns `{ validate, isValidating }`. 10 hook tests, all passing.
- **Task 4**: Created `components/quiz/DialogueCard.tsx` with `DialogueBubble` (speaker a/b + hasBlank variants) and `DialogueAnswerOption` styled components. Full hybrid validation UI: spinner during LLM call, `Theme name="success"/"error"` for feedback, "Your answer is also valid!" for alternatives, `AnimatePresence` for slide-in fill. 22 component tests, all passing.
- **Task 5**: Modified `app/quiz/play.tsx` to add `isDialogue` flag and `handleDialogueAnswer` callback. Added dialogue branch as first check in the exercise type conditional (`isDialogue ? ... : isFillInBlank ? ... : multiple choice`). Added `DialogueCard` mock to `play.test.tsx` to prevent AsyncStorage transitive import failure.
- **Task 6**: 32 total new tests (10 hook + 22 component). All pass. Full regression: 357/358 tests pass (1 pre-existing AsyncStorage failure in `useChapters.test.ts`, unrelated to this story).
- TypeScript: `npx tsc` — no errors. ESLint: 0 errors, 0 warnings on all modified files.

### File List

- `dangdai-mobile/types/quiz.ts` — MODIFIED: added `DialogueLine`, `DialogueQuestion`, `AnswerValidationRequest`, `AnswerValidationResponse`; extended `QuizQuestion` with optional `dialogue_lines`
- `dangdai-mobile/lib/api.ts` — MODIFIED: added `ANSWER_VALIDATION_TIMEOUT_MS` constant and `validateAnswer()` method
- `dangdai-mobile/hooks/useAnswerValidation.ts` — CREATED: hybrid validation hook
- `dangdai-mobile/hooks/useAnswerValidation.test.ts` — CREATED: 10 hook tests
- `dangdai-mobile/components/quiz/DialogueCard.tsx` — CREATED: dialogue completion component
- `dangdai-mobile/components/quiz/DialogueCard.test.tsx` — CREATED: 22 component tests
- `dangdai-mobile/app/quiz/play.tsx` — MODIFIED: added `isDialogue` flag, `handleDialogueAnswer` callback, dialogue branch in exercise type rendering
- `dangdai-mobile/app/quiz/play.test.tsx` — MODIFIED: added `DialogueCard` mock to fix transitive AsyncStorage import

## Change Log

- 2026-02-20: Implemented Story 4.6 — Dialogue Completion Exercise. Created `DialogueCard` component, `useAnswerValidation` hook, extended `types/quiz.ts` and `lib/api.ts` with dialogue/validation types and methods, integrated into `play.tsx`. 32 new tests added. (claude-sonnet-4-6)
