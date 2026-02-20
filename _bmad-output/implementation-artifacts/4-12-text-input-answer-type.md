# Story 4.12: Text Input Answer Type

Status: ready-for-dev

## Story

As a user,
I want to type my answer for certain question types,
So that I can practice recall without multiple choice hints.

## Acceptance Criteria

1. **Given** a question requires typed input (pinyin or meaning)
   **When** I view the question
   **Then** a text input field is displayed instead of the answer grid
   **And** placeholder text shows what to enter (e.g., "Type the pinyin...", "Type the meaning...")
   **And** I can submit with Enter key or Submit button
   **And** the input has `autoCapitalize="none"` for pinyin input
   **And** the input has minimum 48px touch target height

2. **Given** I submit a typed answer
   **When** the answer is validated locally against the answer key
   **Then** correct/incorrect feedback is shown with the same visual/audio patterns + explanation (FeedbackOverlay from Story 4.9)
   **And** for correct answers, the input border turns green (`<Theme name="success">`)
   **And** for incorrect answers, the input border turns gentle orange (`<Theme name="error">`) and the correct answer is displayed below
   **And** the user's typed text is NOT cleared (let user compare their answer vs correct)
   **And** the input becomes read-only after submission
   **And** the keyboard is dismissed on submit

## Tasks / Subtasks

- [ ] Task 1: Add `input_type` field to `QuizQuestion` type (AC: #1)
  - [ ] 1.1 Add `input_type?: 'multiple_choice' | 'text_input'` optional field to `QuizQuestion` in `types/quiz.ts`
  - [ ] 1.2 Add `input_placeholder?: string` optional field to `QuizQuestion` for backend-provided placeholder text

- [ ] Task 2: Create pinyin normalization utility (AC: #2)
  - [ ] 2.1 Create `lib/pinyinNormalize.ts` with `normalizePinyin(input: string): string` function
  - [ ] 2.2 Implement tone mark → tone number mapping (ā→a1, á→a2, ǎ→a3, à→a4, etc. for a/e/i/o/u/ü)
  - [ ] 2.3 Implement tone number → tone mark mapping (a1→ā, a2→á, etc.)
  - [ ] 2.4 Normalize to a canonical form for comparison: lowercase, strip spaces, convert tone marks to numbers
  - [ ] 2.5 Handle ü/v equivalence (lü == lv, nü == nv)
  - [ ] 2.6 Write co-located test `lib/pinyinNormalize.test.ts` with comprehensive tone mark/number cases

- [ ] Task 3: Create `TextInputAnswer` component (AC: #1, #2)
  - [ ] 3.1 Create `components/quiz/TextInputAnswer.tsx` using Tamagui `Input` with `animation="quick"` and `focusStyle`
  - [ ] 3.2 Implement `feedback` variant states: `none`, `correct`, `incorrect` (border color changes via `<Theme>` wrapping)
  - [ ] 3.3 Add Submit button using Tamagui `Button` with `theme="primary"`, disabled when input is empty
  - [ ] 3.4 Handle Enter key submission via `onSubmitEditing` prop
  - [ ] 3.5 Dismiss keyboard on submit via `Keyboard.dismiss()`
  - [ ] 3.6 Set `autoCapitalize="none"`, `autoCorrect={false}`, `spellCheck={false}` for pinyin input
  - [ ] 3.7 Display correct answer below input when feedback is `incorrect` (with `animation="medium"` enter)
  - [ ] 3.8 Make input `editable={false}` after submission
  - [ ] 3.9 Write co-located test `components/quiz/TextInputAnswer.test.tsx`

- [ ] Task 4: Create text answer validation utility (AC: #2)
  - [ ] 4.1 Create `validateTextAnswer(userAnswer: string, correctAnswer: string, questionType: 'pinyin' | 'meaning'): boolean` in `lib/quizValidation.ts` (or extend existing validation from Story 4.3)
  - [ ] 4.2 For `meaning` type: trim whitespace, case-insensitive exact match
  - [ ] 4.3 For `pinyin` type: normalize both answers via `normalizePinyin()`, then compare
  - [ ] 4.4 Write tests for validation logic

- [ ] Task 5: Integrate text input type into `play.tsx` (AC: #1, #2)
  - [ ] 5.1 Add `text_input` case to the exercise type rendering logic in `app/quiz/play.tsx`
  - [ ] 5.2 Check `question.input_type === 'text_input'` to render `TextInputAnswer` instead of `AnswerOptionGrid`
  - [ ] 5.3 Wire submission: call `validateTextAnswer()`, then `useQuizStore.setAnswer()` and `addScore()`
  - [ ] 5.4 Trigger FeedbackOverlay (from Story 4.9) with same visual/audio patterns
  - [ ] 5.5 Trigger `useSound` ding/bonk on correct/incorrect (from Story 4.9)
  - [ ] 5.6 After feedback delay (~1s): call `useQuizStore.nextQuestion()` and advance
  - [ ] 5.7 Wrap text input question in `AnimatePresence` with `key={currentQuestionIndex}` for enter/exit transitions

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Story 4.3 adds `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion`. | **USE** as-is — no store changes needed for this story |
| `types/quiz.ts` | Full types: `ExerciseType` (includes `vocabulary`, `grammar`), `QuizQuestion` (has `question_id`, `exercise_type`, `question_text`, `correct_answer`, `explanation`, `source_citation`, optional `options`, `character`, `pinyin`), `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. Does NOT yet have `input_type` field. | **EXTEND** — add `input_type` and `input_placeholder` optional fields to `QuizQuestion` |
| `app/quiz/play.tsx` | Created by Story 4.3 with vocabulary/grammar multiple-choice rendering. Story 4.9 adds FeedbackOverlay + sound integration. | **MODIFY** — add `text_input` rendering branch |
| `components/quiz/QuizQuestionCard.tsx` | Created by Story 4.3 — question display with `display` and `feedback` variants. | **REUSE** — same question card for text input questions (character + pinyin display) |
| `components/quiz/AnswerOptionGrid.tsx` | Created by Story 4.3 — 2x2 grid/list for multiple choice. | **DO NOT USE** for text input (different interaction pattern) |
| `components/quiz/QuizProgress.tsx` | Created by Story 4.3 — progress bar + counter. | **REUSE** — same progress bar for all exercise types |
| `components/quiz/FeedbackOverlay.tsx` | Created by Story 4.9 — correct/incorrect feedback with explanation, auto-advance, `AnimatePresence` pop-in. | **REUSE** — trigger with same API for text input answers |
| `hooks/useSound.ts` | Created by Story 4.9 — sound effect management (ding/bonk). | **REUSE** — play ding on correct, bonk on incorrect |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, timeout, typed errors. | **USE** — do not modify |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** — do not modify |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. Tokens: `$borderColorFocus`, `$placeholderColor`, `$surface`, `$success`, `$error`. | **USE** — all tokens and presets available |
| `lib/queryKeys.ts` | Has `quiz(quizId)` key factory. | **USE** as-is |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/TextInputAnswer.tsx` | Text input component for typed answers |
| `components/quiz/TextInputAnswer.test.tsx` | Unit tests for TextInputAnswer |
| `lib/pinyinNormalize.ts` | Pinyin tone mark ↔ tone number normalization |
| `lib/pinyinNormalize.test.ts` | Tests for pinyin normalization |

**What may need modification:**

| File | Purpose |
|------|---------|
| `types/quiz.ts` | Add `input_type` and `input_placeholder` fields to `QuizQuestion` |
| `app/quiz/play.tsx` | Add text input rendering branch alongside existing multiple choice |
| `lib/quizValidation.ts` | Add text answer validation (may already exist from Story 4.3 with `validateAnswer`) |

### TextInputAnswer Component Spec

```tsx
// components/quiz/TextInputAnswer.tsx
import { useState, useRef } from 'react'
import { Keyboard } from 'react-native'
import { YStack, XStack, Input, Button, Text, Theme, AnimatePresence } from 'tamagui'
import { Check, Send } from '@tamagui/lucide-icons'

interface TextInputAnswerProps {
  /** Placeholder text (e.g., "Type the pinyin...", "Type the meaning...") */
  placeholder: string
  /** The correct answer for display after incorrect submission */
  correctAnswer: string
  /** Whether this is a pinyin question (affects normalization) */
  questionType: 'pinyin' | 'meaning'
  /** Called when user submits their answer */
  onSubmit: (userAnswer: string, isCorrect: boolean) => void
  /** Whether the component is in feedback state (after submission) */
  disabled?: boolean
}

// Component renders:
// 1. Tamagui <Input> with focusStyle, autoCapitalize="none"
// 2. Submit <Button> with Send icon, disabled when empty
// 3. After submission: correct answer display (if incorrect)
```

**Tamagui Input styling:**

```tsx
<Input
  animation="quick"
  size="$5"
  minHeight={48}
  borderWidth={1}
  borderColor="$borderColor"
  focusStyle={{ borderColor: '$borderColorFocus', borderWidth: 2 }}
  placeholderTextColor="$placeholderColor"
  placeholder={placeholder}
  autoCapitalize="none"
  autoCorrect={false}
  spellCheck={false}
  returnKeyType="done"
  onSubmitEditing={handleSubmit}
  editable={!submitted}
  value={userInput}
  onChangeText={setUserInput}
/>
```

**Feedback state wrapping:**

```tsx
// After submission, wrap in Theme for automatic color resolution
{submitted && (
  <Theme name={isCorrect ? 'success' : 'error'}>
    <Input
      borderColor="$borderColor"
      borderWidth={2}
      editable={false}
      value={userInput}
    />
  </Theme>
)}
```

**Correct answer reveal (incorrect only):**

```tsx
<AnimatePresence>
  {submitted && !isCorrect && (
    <YStack
      key="correct-answer"
      animation="medium"
      enterStyle={{ opacity: 0, y: -10 }}
      opacity={1}
      y={0}
      paddingTop="$2"
    >
      <Text color="$colorSubtle" fontSize="$3">Correct answer:</Text>
      <Text fontWeight="600" fontSize="$5" color="$success">{correctAnswer}</Text>
    </YStack>
  )}
</AnimatePresence>
```

### Pinyin Normalization Logic

Pinyin can be written with tone marks (ā, á, ǎ, à) or tone numbers (a1, a2, a3, a4). The validation must treat both as equivalent.

**Tone mark → tone number mapping:**

```typescript
// lib/pinyinNormalize.ts

/** Map of tone-marked vowels to their base vowel + tone number */
const TONE_MARK_TO_NUMBER: Record<string, string> = {
  // a tones
  'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
  // e tones
  'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
  // i tones
  'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
  // o tones
  'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
  // u tones
  'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
  // ü tones
  'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4',
}

/**
 * Normalize pinyin to a canonical form for comparison.
 *
 * Converts tone marks to tone numbers, lowercases, strips extra spaces,
 * and normalizes ü to v for consistent comparison.
 *
 * Examples:
 *   "xué" → "xue2"
 *   "xue2" → "xue2"
 *   "Xué" → "xue2"
 *   "lǜ" → "lv4"
 *   "lv4" → "lv4"
 *   "nǚ" → "nv3"
 */
export function normalizePinyin(input: string): string {
  let result = input.toLowerCase().trim()

  // Replace ü with v (standard pinyin input convention)
  result = result.replace(/ü/g, 'v')

  // Replace tone-marked vowels with base vowel + tone number
  for (const [marked, numbered] of Object.entries(TONE_MARK_TO_NUMBER)) {
    result = result.replace(new RegExp(marked, 'g'), numbered)
  }

  // Collapse multiple spaces to single space
  result = result.replace(/\s+/g, ' ')

  return result
}
```

**Key normalization rules:**
- `ü` and `v` are equivalent (`lǜ` == `lv4` == `lü4`)
- Tone marks and tone numbers are equivalent (`xué` == `xue2`)
- Case-insensitive (`Xué` == `xué` == `xue2`)
- Whitespace-trimmed and collapsed
- Neutral tone (no mark, no number) is treated as tone 5 or unmarked — both `ma` and `ma5` match

### Text Validation Pattern

```typescript
// lib/quizValidation.ts (extend existing from Story 4.3)

import { normalizePinyin } from './pinyinNormalize'

/**
 * Validate a typed text answer against the correct answer.
 *
 * For pinyin: normalizes tone marks/numbers and compares.
 * For meaning: trims whitespace and compares case-insensitively.
 */
export function validateTextAnswer(
  userAnswer: string,
  correctAnswer: string,
  questionType: 'pinyin' | 'meaning'
): boolean {
  if (!userAnswer.trim()) return false

  if (questionType === 'pinyin') {
    return normalizePinyin(userAnswer) === normalizePinyin(correctAnswer)
  }

  // Meaning: case-insensitive, trimmed
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}
```

**Determining question type for validation:**
- If `question_text` contains "pinyin" → `questionType = 'pinyin'`
- If `question_text` contains "meaning" or "translate" → `questionType = 'meaning'`
- Default to `'meaning'` (case-insensitive exact match is safe for all types)
- The backend may also provide this via a future `answer_format` field

### Input Type Determination

The backend determines whether a question uses text input or multiple choice via the `input_type` field on each `QuizQuestion`:

```typescript
// In types/quiz.ts — extend QuizQuestion
export interface QuizQuestion {
  question_id: string
  exercise_type: ExerciseType
  question_text: string
  correct_answer: string
  explanation: string
  source_citation: string
  options?: string[]           // Present for multiple choice
  character?: string
  pinyin?: string
  input_type?: 'multiple_choice' | 'text_input'  // NEW
  input_placeholder?: string                       // NEW — e.g., "Type the pinyin..."
}
```

**Rendering logic in `play.tsx`:**

```typescript
const question = getCurrentQuestion()

// Determine input type — default to multiple_choice if not specified
const inputType = question.input_type ?? (question.options ? 'multiple_choice' : 'text_input')

// Render based on input type
if (inputType === 'text_input') {
  return <TextInputAnswer ... />
} else {
  return <AnswerOptionGrid ... />
}
```

**Fallback logic:** If `input_type` is not set by the backend:
- If `options` array is present and non-empty → render as multiple choice
- If `options` is absent or empty → render as text input
- This ensures backward compatibility with quiz data that doesn't include `input_type`

### Screen Layout (Text Input Variant)

```
┌─────────────────────────────────┐
│ ← Leave       Vocabulary Quiz    │
├─────────────────────────────────┤
│ ████████████░░░░░░░░  3/10       │  ← QuizProgress (reused)
├─────────────────────────────────┤
│                                  │
│     What is the pinyin for       │  ← Question type label
│     this character?              │
│                                  │
│              學                   │  ← 72px Chinese character
│                                  │     (QuizQuestionCard reused)
│                                  │
├─────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐    │
│  │ Type the pinyin...       │    │  ← TextInputAnswer (Input)
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────┐                    │
│  │  Submit  │                    │  ← Submit Button
│  └──────────┘                    │
│                                  │
└─────────────────────────────────┘

After incorrect submission:

┌─────────────────────────────────┐
│                                  │
│  ┌──────────────────────────┐    │
│  │ xue                      │    │  ← User's answer (orange border)
│  └──────────────────────────┘    │
│                                  │
│  Correct answer:                 │  ← Revealed correct answer
│  xué                             │     (green text, animated in)
│                                  │
│  ┌─────────────────────────────┐ │
│  │ 學 (xué) means to study.   │ │  ← FeedbackOverlay (from 4.9)
│  │ Book 2, Ch 12 - Vocabulary  │ │
│  └─────────────────────────────┘ │
│                                  │
└─────────────────────────────────┘
```

### Keyboard Management

```typescript
import { Keyboard } from 'react-native'

// In TextInputAnswer component:
const handleSubmit = useCallback(() => {
  if (!userInput.trim()) return

  // Dismiss keyboard FIRST for smooth UX
  Keyboard.dismiss()

  // Then validate and trigger feedback
  const isCorrect = validateTextAnswer(userInput, correctAnswer, questionType)
  setSubmitted(true)
  setIsCorrect(isCorrect)
  onSubmit(userInput, isCorrect)
}, [userInput, correctAnswer, questionType, onSubmit])
```

**Keyboard considerations:**
- `returnKeyType="done"` — shows "Done" on keyboard instead of "Return"
- `onSubmitEditing={handleSubmit}` — handles Enter/Done key press
- `Keyboard.dismiss()` on submit — prevents keyboard from blocking feedback
- `autoCapitalize="none"` — critical for pinyin input (don't capitalize first letter)
- `autoCorrect={false}` — prevent autocorrect from changing pinyin
- `spellCheck={false}` — prevent red underlines on pinyin
- For Chinese character input: the system keyboard handles IME automatically; no special config needed

### Tamagui Animation Patterns

**Input focus animation:**
```tsx
<Input
  animation="quick"
  focusStyle={{ borderColor: '$borderColorFocus', borderWidth: 2 }}
/>
```

**Feedback state transition:**
```tsx
// Wrap in Theme for automatic color resolution
<Theme name={isCorrect ? 'success' : 'error'}>
  <YStack animation="quick" borderColor="$borderColor" borderWidth={2} borderRadius="$4">
    <Input editable={false} value={userInput} />
  </YStack>
</Theme>
```

**Correct answer reveal:**
```tsx
<AnimatePresence>
  {showCorrectAnswer && (
    <YStack
      key="correct-answer-reveal"
      animation="medium"
      enterStyle={{ opacity: 0, y: -10 }}
      exitStyle={{ opacity: 0 }}
      opacity={1}
      y={0}
    >
      <Text>Correct answer: {correctAnswer}</Text>
    </YStack>
  )}
</AnimatePresence>
```

**Submit button:**
```tsx
<Button
  theme="primary"
  animation="quick"
  pressStyle={{ scale: 0.98 }}
  disabled={!userInput.trim() || submitted}
  opacity={!userInput.trim() || submitted ? 0.5 : 1}
  onPress={handleSubmit}
  icon={<Send size={18} />}
>
  Submit
</Button>
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$borderColorFocus`, `$placeholderColor`, `$surface`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts — not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle`/`focusStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on interactive elements
- **ALWAYS** use Tamagui `<Input>` component, not React Native `<TextInput>` directly

### Anti-Patterns to Avoid

1. **DO NOT** validate on blur — only validate on explicit submit (Enter key or Submit button tap)
2. **DO NOT** clear input on error — let user see what they typed vs the correct answer
3. **DO NOT** create separate validation logic from scratch — extend existing validation from Story 4.3 (`lib/quizValidation.ts`)
4. **DO NOT** hardcode hex colors — use Tamagui tokens (`$success`, `$error`, `$borderColorFocus`, etc.)
5. **DO NOT** use React Native `TextInput` directly — use Tamagui `Input` component
6. **DO NOT** skip keyboard management — call `Keyboard.dismiss()` on submit
7. **DO NOT** implement sound effects from scratch — reuse `useSound` hook from Story 4.9
8. **DO NOT** implement FeedbackOverlay from scratch — reuse `FeedbackOverlay` component from Story 4.9
9. **DO NOT** use `setInterval` without cleanup for feedback delay — use `setTimeout` inside `useEffect` with cleanup
10. **DO NOT** use `Animated` from React Native — use Tamagui declarative animations
11. **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file
12. **DO NOT** put quiz logic in the component — keep answer validation in `lib/quizValidation.ts`, state management in `useQuizStore`
13. **DO NOT** implement Chinese character IME handling — the system keyboard handles this automatically
14. Pinyin normalization MUST handle both tone marks (ā, é, ǐ, ò, ǖ) AND tone numbers (a1, e2, i3, o4, v1)
15. Pinyin normalization MUST handle ü/v equivalence (lü == lv)

### Dependencies on Other Stories

- **Depends on:** Story 4.3 (vocabulary quiz question display) — provides `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress`, `play.tsx` screen, `useQuizStore` extensions, answer validation pattern
- **Depends on:** Story 4.9 (immediate answer feedback) — provides `FeedbackOverlay` component, `useSound` hook (ding/bonk), feedback display timing, auto-advance logic
- **Depends on:** Story 1.1b (Tamagui theme) — provides sub-themes (`success`, `error`), animation presets, `$borderColorFocus`, `$placeholderColor` tokens
- **Depends on:** Story 1.5 (TanStack + Zustand) — provides `useQuizStore`
- **Enables:** Story 5.1 (chapter test) — text input questions can appear in mixed chapter tests
- **Enables:** Future exercise types that need typed answers (e.g., character writing practice)

**Stories 4.3 and 4.9 MUST be completed before this story.** The `play.tsx` screen, `FeedbackOverlay`, and `useSound` hook must exist. If they don't exist yet, this story cannot be implemented.

### Testing Approach

```bash
# Run tests for this story
npx jest lib/pinyinNormalize components/quiz/TextInputAnswer --verbose

# Type checking
npx tsc

# Linting
npx eslint lib/pinyinNormalize.ts lib/pinyinNormalize.test.ts components/quiz/TextInputAnswer.tsx components/quiz/TextInputAnswer.test.tsx --ext .ts,.tsx
```

**Pinyin normalization test cases (CRITICAL):**

```typescript
// lib/pinyinNormalize.test.ts
describe('normalizePinyin', () => {
  // Tone marks → tone numbers
  it('converts tone mark ā to a1', () => {
    expect(normalizePinyin('mā')).toBe('ma1')
  })
  it('converts tone mark á to a2', () => {
    expect(normalizePinyin('má')).toBe('ma2')
  })
  it('converts tone mark ǎ to a3', () => {
    expect(normalizePinyin('mǎ')).toBe('ma3')
  })
  it('converts tone mark à to a4', () => {
    expect(normalizePinyin('mà')).toBe('ma4')
  })

  // Multi-syllable
  it('normalizes multi-syllable pinyin with tone marks', () => {
    expect(normalizePinyin('xué')).toBe('xue2')
  })
  it('normalizes multi-syllable pinyin with tone numbers', () => {
    expect(normalizePinyin('xue2')).toBe('xue2')
  })

  // ü/v equivalence
  it('normalizes ü to v', () => {
    expect(normalizePinyin('lǜ')).toBe('lv4')
  })
  it('treats lv4 and lü4 as equivalent', () => {
    expect(normalizePinyin('lv4')).toBe(normalizePinyin('lǜ'))
  })
  it('normalizes nǚ to nv3', () => {
    expect(normalizePinyin('nǚ')).toBe('nv3')
  })

  // Case insensitivity
  it('lowercases input', () => {
    expect(normalizePinyin('Xué')).toBe('xue2')
  })
  it('lowercases all-caps', () => {
    expect(normalizePinyin('XUE2')).toBe('xue2')
  })

  // Whitespace handling
  it('trims leading/trailing whitespace', () => {
    expect(normalizePinyin('  xué  ')).toBe('xue2')
  })
  it('collapses multiple spaces', () => {
    expect(normalizePinyin('nǐ  hǎo')).toBe('ni3 ha3o')
  })

  // Neutral tone (no mark)
  it('leaves unmarked pinyin unchanged', () => {
    expect(normalizePinyin('ma')).toBe('ma')
  })

  // All vowels with tones
  it('handles e tones', () => {
    expect(normalizePinyin('hē')).toBe('he1')
  })
  it('handles i tones', () => {
    expect(normalizePinyin('chī')).toBe('chi1')
  })
  it('handles o tones', () => {
    expect(normalizePinyin('wǒ')).toBe('wo3')
  })
  it('handles u tones', () => {
    expect(normalizePinyin('shū')).toBe('shu1')
  })
})
```

**Text validation test cases:**

```typescript
// lib/quizValidation.test.ts (extend existing)
describe('validateTextAnswer', () => {
  describe('meaning type', () => {
    it('matches exact answer', () => {
      expect(validateTextAnswer('to study', 'to study', 'meaning')).toBe(true)
    })
    it('matches case-insensitively', () => {
      expect(validateTextAnswer('To Study', 'to study', 'meaning')).toBe(true)
    })
    it('trims whitespace', () => {
      expect(validateTextAnswer('  to study  ', 'to study', 'meaning')).toBe(true)
    })
    it('rejects wrong answer', () => {
      expect(validateTextAnswer('to teach', 'to study', 'meaning')).toBe(false)
    })
    it('rejects empty input', () => {
      expect(validateTextAnswer('', 'to study', 'meaning')).toBe(false)
    })
    it('rejects whitespace-only input', () => {
      expect(validateTextAnswer('   ', 'to study', 'meaning')).toBe(false)
    })
  })

  describe('pinyin type', () => {
    it('matches tone marks to tone numbers', () => {
      expect(validateTextAnswer('xué', 'xue2', 'pinyin')).toBe(true)
    })
    it('matches tone numbers to tone marks', () => {
      expect(validateTextAnswer('xue2', 'xué', 'pinyin')).toBe(true)
    })
    it('matches identical tone marks', () => {
      expect(validateTextAnswer('xué', 'xué', 'pinyin')).toBe(true)
    })
    it('matches ü and v equivalence', () => {
      expect(validateTextAnswer('lv4', 'lǜ', 'pinyin')).toBe(true)
    })
    it('is case-insensitive', () => {
      expect(validateTextAnswer('Xue2', 'xué', 'pinyin')).toBe(true)
    })
    it('rejects wrong pinyin', () => {
      expect(validateTextAnswer('xue1', 'xué', 'pinyin')).toBe(false)
    })
    it('rejects wrong tone', () => {
      expect(validateTextAnswer('xùe', 'xué', 'pinyin')).toBe(false)
    })
  })
})
```

**TextInputAnswer component test cases:**

```typescript
// components/quiz/TextInputAnswer.test.tsx
describe('TextInputAnswer', () => {
  it('renders input with placeholder text', () => { /* ... */ })
  it('renders submit button disabled when input is empty', () => { /* ... */ })
  it('enables submit button when input has text', () => { /* ... */ })
  it('calls onSubmit with user answer on button press', () => { /* ... */ })
  it('calls onSubmit on Enter key (onSubmitEditing)', () => { /* ... */ })
  it('makes input read-only after submission', () => { /* ... */ })
  it('shows correct answer when feedback is incorrect', () => { /* ... */ })
  it('does NOT show correct answer when feedback is correct', () => { /* ... */ })
  it('does NOT clear user input after submission', () => { /* ... */ })
  it('has autoCapitalize="none"', () => { /* ... */ })
  it('has autoCorrect={false}', () => { /* ... */ })
})
```

**Mock quiz data for text input tests:**

```typescript
const mockTextInputQuestion: QuizQuestion = {
  question_id: 'q-text-1',
  exercise_type: 'vocabulary',
  question_text: 'What is the pinyin for this character?',
  correct_answer: 'xué',
  explanation: '學 (xué) means to study/learn.',
  source_citation: 'Book 2, Chapter 12 - Vocabulary',
  character: '學',
  input_type: 'text_input',
  input_placeholder: 'Type the pinyin...',
}

const mockMeaningInputQuestion: QuizQuestion = {
  question_id: 'q-text-2',
  exercise_type: 'vocabulary',
  question_text: 'What does this character mean?',
  correct_answer: 'to study',
  explanation: '學 (xué) means to study/learn.',
  source_citation: 'Book 2, Chapter 12 - Vocabulary',
  character: '學',
  pinyin: 'xué',
  input_type: 'text_input',
  input_placeholder: 'Type the meaning...',
}
```

### File Structure

```
dangdai-mobile/
├── app/quiz/
│   └── play.tsx                        # MODIFY: add text_input rendering branch
├── components/quiz/
│   ├── TextInputAnswer.tsx             # CREATE: text input answer component
│   └── TextInputAnswer.test.tsx        # CREATE: unit tests
├── lib/
│   ├── pinyinNormalize.ts              # CREATE: pinyin normalization utility
│   ├── pinyinNormalize.test.ts         # CREATE: normalization tests
│   └── quizValidation.ts              # MODIFY or CREATE: add validateTextAnswer
└── types/
    └── quiz.ts                         # MODIFY: add input_type, input_placeholder to QuizQuestion
```

### Previous Story Intelligence

**From Story 4.3 (vocabulary quiz question display):**
- `play.tsx` renders questions inside `AnimatePresence` with `key={currentQuestionIndex}` for slide transitions.
- Answer validation uses `validateAnswer(userAnswer, correctAnswer)` — simple case-insensitive exact match.
- After validation: feedback delay (~1s) → `nextQuestion()` → advance.
- `QuizQuestionCard` handles character (72px), pinyin (24px), and meaning (20px) display variants.
- `AnswerOptionGrid` handles 2x2 grid and vertical list layouts for multiple choice.

**From Story 4.9 (immediate answer feedback):**
- `FeedbackOverlay` component shows explanation + source citation with `AnimatePresence` pop-in.
- `useSound` hook provides `playCorrect()` and `playIncorrect()` methods.
- Feedback displays for ~1 second before auto-advancing.
- Correct: `<Theme name="success">` + ding sound + points increment.
- Incorrect: `<Theme name="error">` + bonk sound + correct answer revealed.

**From Story 4.4 (fill-in-the-blank):**
- Demonstrates pattern for adding new exercise type rendering to `play.tsx` — add a case to the exercise type switch.
- Shows how to extend `useQuizStore` for exercise-type-specific state (though text input doesn't need store extensions).

**From Story 1.1b (Tamagui theme):**
- `$borderColorFocus` = `#06B6D4` (primary teal) — used for input focus state.
- `$placeholderColor` = `#78716C` — used for input placeholder text.
- Sub-themes `success` and `error` remap `$background`, `$color`, `$borderColor` automatically.
- Animation preset `quick` (damping: 20, stiffness: 250) — used for input interactions.
- Animation preset `medium` (damping: 15, stiffness: 150) — used for correct answer reveal.

**From `types/quiz.ts` (current state):**
- `QuizQuestion` has optional `options?: string[]` — when present, indicates multiple choice.
- `QuizQuestion` does NOT have `input_type` — this story adds it.
- Adding `input_type` is backward-compatible (optional field, existing data works via fallback logic).

### References

- [Source: epics.md#Story-4.12] — Story requirements and acceptance criteria
- [Source: architecture.md#Answer-Validation-Strategy] — Local validation for vocabulary/grammar (exact match), <100ms latency
- [Source: architecture.md#Implementation-Patterns] — Naming conventions, file structure, enforcement rules
- [Source: architecture.md#Project-Structure] — `components/quiz/TextInputAnswer.tsx` in planned structure
- [Source: ux-design-specification.md#TextInputAnswer] — `<Input>` spec with `focusStyle`, state table (Empty/Focused/Correct/Incorrect)
- [Source: ux-design-specification.md#Form-Patterns] — Text input states, validation on submit, don't clear on error
- [Source: ux-design-specification.md#Animation-Patterns] — Named presets (`quick`, `medium`), `AnimatePresence` for conditional rendering
- [Source: ux-design-specification.md#FeedbackOverlay] — Reuse for correct/incorrect feedback with explanation
- [Source: ux-design-specification.md#Sub-Theme-Strategy] — `<Theme name="success">` / `<Theme name="error">` for automatic color resolution
- [Source: prd.md#FR16] — Vocabulary quiz: character ↔ pinyin ↔ meaning (multiple choice, typed input)
- [Source: prd.md#FR23] — Immediate feedback per answer with correct answer shown
- [Source: prd.md#FR24] — Feedback includes explanation and source citation
- [Source: 4-3-vocabulary-quiz-question-display.md] — Existing code state, validation pattern, play.tsx structure
- [Source: 4-4-fill-in-the-blank-exercise.md] — Pattern for adding new exercise type to play.tsx

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
