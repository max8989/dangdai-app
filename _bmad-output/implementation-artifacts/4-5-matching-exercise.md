# Story 4.5: Matching Exercise (Tap-to-Pair)

Status: ready-for-dev

## Story

As a user,
I want to connect matching items (character ↔ pinyin, question ↔ response) by tapping pairs,
So that I can practice recognizing character relationships.

## Acceptance Criteria

1. **Given** a matching exercise has loaded
   **When** I view the exercise
   **Then** I see two columns: left items (e.g., characters) and right items (e.g., pinyin), shuffled independently
   **And** a progress indicator shows "X/Y paired"
   **And** Chinese characters are displayed at 72px minimum

2. **Given** I tap an item in the left column
   **When** the item is selected
   **Then** it highlights with primary theme border

3. **Given** I tap an item in the right column after selecting a left item
   **When** the pair is evaluated locally against the answer key
   **Then** if correct: both items show success theme + connection line + "ding" sound + items become non-interactive
   **Then** if incorrect: both items shake + error theme flash + "bonk" sound + selection resets

4. **Given** all pairs are matched
   **When** the exercise completes
   **Then** the completion flow triggers with score

## Tasks / Subtasks

- [ ] Task 1: Extend quiz types for matching exercise data (AC: #1)
  - [ ] 1.1 Add `MatchingPair` interface to `types/quiz.ts`: `{ left: string; right: string }`
  - [ ] 1.2 Add matching-specific optional fields to `QuizQuestion`: `pairs?: MatchingPair[]`, `left_items?: string[]`, `right_items?: string[]`
  - [ ] 1.3 Ensure `ExerciseType` already includes `'matching'` (it does — verify only)

- [ ] Task 2: Create `MatchingExercise` component (AC: #1, #2, #3, #4)
  - [ ] 2.1 Create `components/quiz/MatchingExercise.tsx` with `MatchItem` using `styled(Button)` with `state` variant (`default`, `selected`, `matched`, `incorrect`) and `column` variant (`left`, `right`)
  - [ ] 2.2 Render two columns: left items and right items from `left_items` / `right_items` arrays (pre-shuffled by backend)
  - [ ] 2.3 Display Chinese characters at 72px minimum font size in left column items
  - [ ] 2.4 Implement tap-to-select on left column: set `selectedLeft` state, highlight with `<Theme name="primary">` border
  - [ ] 2.5 Implement tap-to-pair on right column: when a left item is selected and a right item is tapped, evaluate the pair locally against the `pairs` answer key
  - [ ] 2.6 On correct pair: transition both items to `matched` state (`<Theme name="success">`, opacity 0.7, non-interactive), render connection line between them, add `// TODO: Story 4.9 — play "ding" sound` comment
  - [ ] 2.7 On incorrect pair: apply shake animation (`animation="quick"`) + `<Theme name="error">` flash on both items, reset selection after ~500ms, add `// TODO: Story 4.9 — play "bonk" sound` comment
  - [ ] 2.8 Track `matchedPairs` set and `incorrectAttempts` count for scoring
  - [ ] 2.9 When all pairs matched: call completion callback with score (correct pairs / total pairs, minus penalty for incorrect attempts)
  - [ ] 2.10 Enforce minimum 48px touch targets on all `MatchItem` buttons
  - [ ] 2.11 Add `focusStyle={{ borderColor: '$borderColorFocus' }}` on interactive items

- [ ] Task 3: Create `MatchingExercise.test.tsx` (AC: all)
  - [ ] 3.1 Create `components/quiz/MatchingExercise.test.tsx` with mock matching data
  - [ ] 3.2 Test: renders two columns with correct number of items
  - [ ] 3.3 Test: tapping left item highlights it (selected state)
  - [ ] 3.4 Test: tapping right item after left selection evaluates pair
  - [ ] 3.5 Test: correct pair transitions to matched state (non-interactive)
  - [ ] 3.6 Test: incorrect pair resets selection
  - [ ] 3.7 Test: all pairs matched triggers completion callback with score
  - [ ] 3.8 Test: matched items are non-interactive (cannot be re-tapped)
  - [ ] 3.9 Test: Chinese characters render at 72px minimum
  - [ ] 3.10 Test: progress indicator shows correct "X/Y paired" count

- [ ] Task 4: Extend `useQuizStore` for matching state (AC: #1, #2, #3, #4)
  - [ ] 4.1 Add `selectedLeft: string | null` to quiz state
  - [ ] 4.2 Add `matchedPairs: string[]` (array of matched left-item values) to quiz state
  - [ ] 4.3 Add `matchingScore: { correct: number; incorrect: number }` to quiz state
  - [ ] 4.4 Add actions: `selectLeftItem(item: string)`, `clearSelection()`, `addMatchedPair(leftItem: string)`, `addIncorrectAttempt()`, `resetMatchingState()`
  - [ ] 4.5 Clear matching state in `resetQuiz()` action
  - [ ] 4.6 Write unit tests for new matching state actions in existing store test file

- [ ] Task 5: Integrate into `app/quiz/play.tsx` (AC: #1, #4)
  - [ ] 5.1 Add `'matching'` case to the exercise type switch/conditional in `play.tsx`
  - [ ] 5.2 Render `<MatchingExercise>` when `exercise_type === 'matching'`, passing question data (pairs, left_items, right_items) and completion callback
  - [ ] 5.3 On matching completion: trigger the same completion flow as other exercise types (navigate to results placeholder per Story 4.11 boundary)
  - [ ] 5.4 Reuse `<QuizProgress>` component for "X/Y paired" display (pass `matchedPairs.length` as current and `pairs.length` as total)

- [ ] Task 6: Write integration tests for matching in play.tsx (AC: all)
  - [ ] 6.1 Test: play.tsx renders MatchingExercise when exercise_type is 'matching'
  - [ ] 6.2 Test: QuizProgress shows paired count for matching exercises
  - [ ] 6.3 Test: completion callback triggers navigation/completion flow
  - [ ] 6.4 Test: matching exercise with mock data renders full interaction flow

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Wired into AuthProvider for cleanup on sign-out. | **EXTEND** with matching-specific state — do NOT rewrite existing fields/actions |
| `types/quiz.ts` | Full types: `ExerciseType` (includes `'matching'`), `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. `QuizQuestion` has optional `options`, `character`, `pinyin` fields but NO matching-specific fields yet. | **EXTEND** — add `MatchingPair` interface and matching fields to `QuizQuestion` |
| `app/quiz/play.tsx` | **DOES NOT EXIST YET** — Story 4.3 is `ready-for-dev`. This file will be created by Story 4.3 with vocabulary/grammar rendering. | **MODIFY** when it exists — add matching case to exercise type switch. If 4.3 is not done yet, this story MUST wait or create the file with matching support only. |
| `components/quiz/QuizProgress.tsx` | **DOES NOT EXIST YET** — Story 4.3 creates it. Shows "X/Y" text + animated progress bar. | **REUSE** for "X/Y paired" display. If 4.3 is not done, create a minimal version. |
| `components/quiz/QuizQuestionCard.tsx` | **DOES NOT EXIST YET** — Story 4.3 creates it. | **NOT NEEDED** for matching — matching uses its own `MatchItem` component, not `QuizQuestionCard` |
| `components/quiz/AnswerOptionGrid.tsx` | **DOES NOT EXIST YET** — Story 4.3 creates it. | **NOT NEEDED** for matching — matching uses two-column tap-to-pair, not answer grid |
| `lib/api.ts` | Complete `api.generateQuiz()` with JWT auth, timeout, typed errors. | **USE** as-is — no changes needed |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **USE** as-is — no changes needed |
| `app/quiz/loading.tsx` | Full loading screen with tip rotation, error handling, cancel. Navigates to play screen on success. | **DO NOT MODIFY** |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. | **USE** — all tokens and presets available |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/MatchingExercise.tsx` | Two-column tap-to-pair matching component |
| `components/quiz/MatchingExercise.test.tsx` | Unit tests for matching component |

**Dependency note:** Story 4.3 creates `app/quiz/play.tsx`, `QuizProgress.tsx`, and extends `useQuizStore` with `quizPayload`. If 4.3 is completed first (expected), this story modifies those files. If 4.3 is NOT done, the dev agent must either:
1. Wait for 4.3 to complete, OR
2. Create minimal versions of `play.tsx` and `QuizProgress.tsx` that 4.3 will later extend (not recommended — creates merge conflicts)

**Recommended approach:** Implement 4.3 first, then 4.5.

### Quiz Data Flow for Matching

```
Backend generates matching quiz
  ↓
QuizResponse.questions[0] = {
  question_id: "m1",
  exercise_type: "matching",
  question_text: "Match the characters with their pinyin",
  correct_answer: "",  // Not used for matching — pairs array is the answer key
  explanation: "Practice character-pinyin recognition",
  source_citation: "Book 2, Chapter 12 - Vocabulary",
  pairs: [
    { left: "她", right: "tā" },
    { left: "喜歡", right: "xǐhuān" },
    { left: "咖啡", right: "kāfēi" },
    { left: "吃", right: "chī" },
    { left: "學生", right: "xuéshēng" },
    { left: "老師", right: "lǎoshī" },
  ],
  left_items: ["她", "咖啡", "喜歡", "吃", "學生", "老師"],     // Shuffled
  right_items: ["kāfēi", "tā", "chī", "xǐhuān", "lǎoshī", "xuéshēng"],  // Shuffled independently
}
  ↓
useQuizStore stores quiz payload
  ↓
play.tsx detects exercise_type === 'matching'
  ↓
Renders <MatchingExercise question={currentQuestion} onComplete={handleComplete} />
  ↓
MatchingExercise manages internal pairing state:
  - selectedLeft: string | null
  - matchedPairs: Set<string>  (left items that have been matched)
  - incorrectAttempts: number
  ↓
User taps left item → selectedLeft = "喜歡"
User taps right item → evaluate("喜歡", "xǐhuān") against pairs array
  ↓
Correct → add to matchedPairs, show success theme
Incorrect → shake + error flash, reset selection
  ↓
All pairs matched → onComplete({ score, incorrectAttempts })
```

### MatchingExercise Component Spec

```tsx
// components/quiz/MatchingExercise.tsx
import { styled, Button, XStack, YStack, Text, Theme } from 'tamagui'
import { AnimatePresence } from 'tamagui'

/**
 * MatchItem — styled button for each item in the matching columns.
 * Uses Tamagui styled() with state and column variants.
 */
const MatchItem = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.98 },
  focusStyle: { borderColor: '$borderColorFocus' },
  minHeight: 48,
  borderWidth: 2,
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    state: {
      default: { borderColor: '$borderColor', backgroundColor: '$surface' },
      selected: { borderColor: '$primary', backgroundColor: '$backgroundPress' },
      matched: { borderColor: '$success', backgroundColor: '$successBackground', opacity: 0.7 },
      incorrect: { borderColor: '$error', backgroundColor: '$errorBackground' },
    },
    column: {
      left: { alignItems: 'center' },
      right: { alignItems: 'center' },
    },
  } as const,

  defaultVariants: {
    state: 'default',
    column: 'left',
  },
})

/**
 * ConnectionLine — visual line between matched pairs.
 * Rendered as a simple horizontal bar between the two columns.
 */
const ConnectionLine = styled(YStack, {
  height: 2,
  backgroundColor: '$success',
  animation: 'quick',
  enterStyle: { opacity: 0, scaleX: 0 },
  opacity: 1,
  scaleX: 1,
})
```

**Props interface:**

```tsx
interface MatchingExerciseProps {
  /** The matching question data from the quiz payload */
  question: QuizQuestion
  /** Called when all pairs are matched */
  onComplete: (result: { score: number; incorrectAttempts: number }) => void
}
```

**Internal state (component-local, NOT in Zustand):**

```tsx
// These are UI-interaction state, appropriate for useState
const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
const [incorrectAttempts, setIncorrectAttempts] = useState(0)
const [incorrectFlash, setIncorrectFlash] = useState<{ left: string; right: string } | null>(null)
```

**Why component-local state instead of Zustand:** The matching interaction state (which item is selected, which pairs are matched) is ephemeral UI state that only matters during the active exercise. It doesn't need to persist across screens or survive navigation. Per architecture: "Zustand for quiz session state" (score, answers, progress) but component-local state for transient interaction state.

### Matching State Management

**In `useQuizStore` — add only what's needed for session-level tracking:**

```typescript
interface QuizState {
  // ... existing fields (keep all) ...

  // NEW: Matching exercise session tracking
  matchingScore: { correct: number; incorrect: number }

  // NEW: Matching actions
  addMatchedPairScore: () => void
  addIncorrectAttempt: () => void
  resetMatchingScore: () => void
}
```

**Rationale for minimal store extension:** The detailed interaction state (selectedLeft, matchedPairs set, incorrectFlash) lives in the `MatchingExercise` component. The store only tracks the aggregate score for the session, which is needed by the completion flow (Story 4.11) and progress saving (Story 4.10).

### Pair Validation Logic

Matching uses **LOCAL validation only** — compare the selected pair against the `pairs` array in the question payload. No LLM call needed.

```typescript
/**
 * Validate a matching pair against the answer key.
 * @param leftItem - The selected left column item
 * @param rightItem - The selected right column item
 * @param pairs - The answer key pairs from the quiz payload
 * @returns true if the pair is correct
 */
function validateMatchingPair(
  leftItem: string,
  rightItem: string,
  pairs: MatchingPair[]
): boolean {
  return pairs.some(
    (pair) => pair.left === leftItem && pair.right === rightItem
  )
}
```

**Scoring formula:**
- Base score: `matchedPairs / totalPairs` (e.g., 6/6 = 100%)
- Penalty: Each incorrect attempt reduces score by a small amount (e.g., -5% per incorrect, minimum 0%)
- Final score: `Math.max(0, Math.round((matchedPairs / totalPairs) * 100 - incorrectAttempts * 5))`

### Screen Layout

```
┌─────────────────────────────────┐
│ Matching - Ch. 12    3/6 paired │  ← Header with QuizProgress
│ ████████░░░░░░░░░░░░            │  ← Progress bar (reuse QuizProgress)
├─────────────────────────────────┤
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │   她   │    │  tā    │       │  ← Matched (green border, dimmed, non-interactive)
│  └────────┘    └────────┘       │
│       ─────────────             │  ← ConnectionLine (success color)
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │  喜歡  │    │ kāfēi  │       │  ← Left selected (primary border)
│  └────────┘    └────────┘       │
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │  咖啡  │    │ xǐhuān │       │  ← Default state
│  └────────┘    └────────┘       │
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │   吃   │    │  chī   │       │  ← Default state
│  └────────┘    └────────┘       │
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │  學生  │    │ lǎoshī │       │  ← Default state
│  └────────┘    └────────┘       │
│                                 │
│  ┌────────┐    ┌────────┐       │
│  │  老師  │    │xuéshēng│       │  ← Default state
│  └────────┘    └────────┘       │
│                                 │
└─────────────────────────────────┘
```

**Layout implementation:**

```tsx
<YStack flex={1} padding="$4">
  {/* Header + Progress */}
  <QuizProgress
    current={matchedPairs.size}
    total={question.pairs?.length ?? 0}
    label="paired"
  />

  {/* Matching columns */}
  <YStack flex={1} gap="$3" paddingTop="$4">
    {question.left_items?.map((leftItem, index) => {
      const rightItem = question.right_items?.[index] ?? ''
      const isLeftMatched = matchedPairs.has(leftItem)
      // Find which right item this left item is matched with
      const matchedRight = isLeftMatched
        ? question.pairs?.find(p => p.left === leftItem)?.right
        : null

      return (
        <XStack key={`row-${index}`} gap="$3" alignItems="center">
          {/* Left column item */}
          <MatchItem
            state={getLeftItemState(leftItem)}
            column="left"
            flex={1}
            disabled={isLeftMatched}
            onPress={() => handleLeftTap(leftItem)}
          >
            <Text fontSize={isChineseCharacter(leftItem) ? 72 : 16}>
              {leftItem}
            </Text>
          </MatchItem>

          {/* Connection line (shown for matched pairs) */}
          {isLeftMatched && <ConnectionLine flex={0.3} />}
          {!isLeftMatched && <YStack flex={0.3} />}

          {/* Right column item */}
          <MatchItem
            state={getRightItemState(rightItem)}
            column="right"
            flex={1}
            disabled={isRightMatched(rightItem)}
            onPress={() => handleRightTap(rightItem)}
          >
            <Text fontSize={16}>{rightItem}</Text>
          </MatchItem>
        </XStack>
      )
    })}
  </YStack>
</YStack>
```

**Note on layout:** Left and right items are rendered in rows by index, but they are shuffled independently by the backend. This means row 0's left item does NOT necessarily match row 0's right item — the user must find the correct pairs across rows.

### Tamagui Animation Patterns

**Shake on incorrect pair:**

Use a brief `animation="quick"` with a transform that resets. Since Tamagui doesn't have a built-in "shake" animation, implement it as a rapid x-offset that resets:

```tsx
// Approach: Use state-driven animation with quick reset
// When incorrectFlash is set, items get error state + slight offset
// After 500ms timeout, clear incorrectFlash → items animate back to default

<MatchItem
  state={incorrectFlash?.left === item ? 'incorrect' : getItemState(item)}
  animation="quick"
  // The state change from 'incorrect' back to 'default' triggers
  // the quick spring animation on borderColor and backgroundColor
>
```

**Alternative shake approach using x transform:**

```tsx
// If a more visible shake is needed, use a brief x offset:
<MatchItem
  x={incorrectFlash?.left === item ? 4 : 0}  // Offset right briefly
  animation="quick"  // Springs back quickly
  state={incorrectFlash?.left === item ? 'incorrect' : 'default'}
>
```

The `animation="quick"` preset (`damping: 20, stiffness: 250, mass: 1.2`) creates a fast spring that naturally overshoots slightly, producing a subtle shake effect when the x value changes from 4 → 0.

**Success highlight with connection line:**

```tsx
<AnimatePresence>
  {isLeftMatched && (
    <ConnectionLine
      key={`line-${leftItem}`}
      animation="quick"
      enterStyle={{ opacity: 0, scaleX: 0 }}
      // Animates from scaleX: 0 to scaleX: 1 (grows from center)
    />
  )}
</AnimatePresence>
```

**Matched item dimming:**

```tsx
// The 'matched' variant includes opacity: 0.7
// Combined with animation="quick", the transition from default → matched
// smoothly animates borderColor, backgroundColor, and opacity
<MatchItem
  state="matched"
  animation="quick"
  disabled={true}  // Non-interactive
/>
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, `$successBackground`, `$errorBackground`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts — not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations (connection lines appearing)
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on interactive elements
- **NEVER** use `react-native` `Animated` API — use Tamagui declarative animations only

### Anti-Patterns to Avoid

- **DO NOT** implement sound effects — Story 4.9 handles "ding" and "bonk" sounds. Add `// TODO: Story 4.9 — play "ding" sound here` and `// TODO: Story 4.9 — play "bonk" sound here` comments at the trigger points.
- **DO NOT** save results to Supabase — Story 4.10 handles per-question result persistence. The matching component only tracks score locally.
- **DO NOT** create a CompletionScreen — Story 4.11 handles the results/celebration screen. On completion, call the `onComplete` callback and let `play.tsx` handle navigation.
- **DO NOT** use React Native `Animated` API or `useSharedValue` — use Tamagui declarative animations.
- **DO NOT** use `Dimensions` API — use Tamagui media queries (`$xs`, `$sm`).
- **DO NOT** validate via LLM — matching uses LOCAL validation only (compare against `pairs` array).
- **DO NOT** create a separate screen for matching — integrate into `play.tsx` exercise type switch alongside vocabulary/grammar.
- **DO NOT** implement drag-and-drop — the UX spec specifies tap-to-pair interaction (tap left, then tap right).
- **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file.
- **DO NOT** put matching validation logic inside the component — extract `validateMatchingPair()` as a pure function for testability.
- **DO NOT** store transient interaction state (selectedLeft, incorrectFlash) in Zustand — use component-local `useState` for ephemeral UI state.

### Dependencies on Other Stories

- **Depends on:** Story 1.1 (mobile scaffold) — DONE
- **Depends on:** Story 1.1b (Tamagui theme + sub-themes + animation presets) — DONE/REVIEW
- **Depends on:** Story 1.5 (TanStack Query + Zustand) — DONE
- **Depends on:** Story 4.1 (quiz generation API — backend generates matching payloads) — READY-FOR-DEV
- **Depends on:** Story 4.2 (loading screen — navigates to play screen with quiz data) — DONE
- **Depends on:** Story 4.3 (vocabulary quiz — creates `play.tsx`, `QuizProgress.tsx`, extends `useQuizStore` with `quizPayload`) — READY-FOR-DEV (**should be completed before 4.5**)
- **Enables:** Story 4.9 (immediate feedback with sound — adds ding/bonk to matching)
- **Enables:** Story 4.10 (progress saving — saves matching results to Supabase)
- **Enables:** Story 4.11 (results screen — displays matching score in completion screen)

**Note on Story 4.3 dependency:** Story 4.3 creates `app/quiz/play.tsx` with the exercise type switch, `QuizProgress.tsx`, and extends `useQuizStore` with `quizPayload`. This story (4.5) adds the `'matching'` case to that switch. If 4.3 is not yet complete, the dev agent should implement 4.3 first or coordinate to avoid conflicts.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/MatchingExercise.test.tsx stores/useQuizStore.test.ts --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/MatchingExercise.tsx stores/useQuizStore.ts types/quiz.ts --ext .ts,.tsx
```

**Mock matching data for tests:**

```typescript
import type { QuizQuestion, QuizResponse } from '../../types/quiz'

const mockMatchingQuestion: QuizQuestion = {
  question_id: 'match-1',
  exercise_type: 'matching',
  question_text: 'Match the characters with their pinyin',
  correct_answer: '',
  explanation: 'Practice character-pinyin recognition from Chapter 12 vocabulary.',
  source_citation: 'Book 2, Chapter 12 - Vocabulary',
  pairs: [
    { left: '她', right: 'tā' },
    { left: '喜歡', right: 'xǐhuān' },
    { left: '咖啡', right: 'kāfēi' },
    { left: '吃', right: 'chī' },
    { left: '學生', right: 'xuéshēng' },
    { left: '老師', right: 'lǎoshī' },
  ],
  left_items: ['她', '咖啡', '喜歡', '吃', '學生', '老師'],
  right_items: ['kāfēi', 'tā', 'chī', 'xǐhuān', 'lǎoshī', 'xuéshēng'],
}

const mockMatchingQuiz: QuizResponse = {
  quiz_id: 'test-matching-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'matching',
  question_count: 1,
  questions: [mockMatchingQuestion],
}
```

**Key test scenarios:**

1. **Rendering:** Two columns render with 6 items each; Chinese characters at 72px; progress shows "0/6 paired"
2. **Left selection:** Tapping a left item highlights it with selected state; tapping another left item switches selection
3. **Correct pair:** Tapping left "她" then right "tā" → both transition to matched state, connection line appears, progress updates to "1/6 paired"
4. **Incorrect pair:** Tapping left "她" then right "kāfēi" → both flash error state, selection resets after delay
5. **Non-interactive matched:** Matched items cannot be tapped again (disabled prop)
6. **Completion:** After all 6 pairs matched, `onComplete` is called with score
7. **Score calculation:** 6/6 correct with 0 incorrect = 100%; 6/6 correct with 2 incorrect = 90%
8. **Edge cases:** Single pair exercise; tapping right column without selecting left first (no-op)

### File Structure

```
dangdai-mobile/
├── components/quiz/
│   ├── MatchingExercise.tsx          # CREATE: two-column tap-to-pair matching component
│   └── MatchingExercise.test.tsx     # CREATE: unit tests
├── types/
│   └── quiz.ts                       # MODIFY: add MatchingPair interface, matching fields to QuizQuestion
├── stores/
│   └── useQuizStore.ts               # MODIFY: add matchingScore tracking
└── app/quiz/
    └── play.tsx                       # MODIFY: add 'matching' case to exercise type switch
                                       #   (file created by Story 4.3 — must exist first)
```

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- Backend generates matching payloads with `pairs`, `left_items`, `right_items` fields.
- `exercise_type: "matching"` is a supported type in the API contract.
- RAG filters by `exercise_type="matching"` to retrieve workbook matching exercises.
- Backend shuffles `left_items` and `right_items` independently before sending.

**From Story 4.2 (loading screen):**
- `lib/api.ts` has complete `api.generateQuiz()` — works for matching type.
- `types/quiz.ts` defines `ExerciseType` including `'matching'` and `EXERCISE_TYPE_LABELS` with `matching: 'Matching'`.
- `QuizQuestion` interface exists but lacks matching-specific fields (`pairs`, `left_items`, `right_items`) — must be extended.
- Loading screen handles all exercise types generically — no matching-specific changes needed.

**From Story 4.3 (vocabulary quiz):**
- Creates `app/quiz/play.tsx` with exercise type switch — matching case will be added here.
- Creates `QuizProgress.tsx` — reusable for "X/Y paired" display.
- Extends `useQuizStore` with `quizPayload`, `setQuizPayload`, `getCurrentQuestion` — matching will use these.
- Establishes the pattern: `play.tsx` reads `quizPayload` from store, renders exercise-type-specific component.
- Local validation pattern: `validateAnswer(userAnswer, correctAnswer)` — matching uses similar but pair-based.

**From Story 4.4 (fill-in-the-blank):**
- If completed, establishes the pattern for adding new exercise types to `play.tsx`.
- Shows how to extend `QuizQuestion` with type-specific optional fields.
- Demonstrates component-local interaction state (word bank selection) vs store-level session state.

### References

- [Source: epics.md#Story-4.5] - Story requirements and acceptance criteria
- [Source: architecture.md#Answer-Validation-Strategy] - Local validation for matching (compare against answer key)
- [Source: architecture.md#State-Management] - Zustand for quiz session state, component-local for transient UI
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets, sub-themes, declarative animation props
- [Source: architecture.md#Quiz-Generation-Data-Flow] - Matching exercise flow from RAG to mobile rendering
- [Source: architecture.md#types/exercise.ts] - MatchingPair type definition location
- [Source: ux-design-specification.md#MatchingExercise] - `styled(Button)` spec with `state` and `column` variants
- [Source: ux-design-specification.md#Matching-Exercise-Interaction] - Full screen layout wireframe, interaction pattern
- [Source: ux-design-specification.md#Animation-Patterns] - Named presets (quick, bouncy, medium, slow), enterStyle/exitStyle patterns
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Matching tap-to-pair flow, shake on error, success highlight
- [Source: ux-design-specification.md#Accessibility] - 48px touch targets, 72px Chinese characters, color + icon indicators
- [Source: prd.md#FR19] - Matching exercise requirement: connect related items (character ↔ pinyin, question ↔ response)
- [Source: prd.md#FR23] - Immediate feedback per answer with correct answer shown
- [Source: 4-2-quiz-loading-screen-with-tips.md] - Existing code state (lib/api.ts, types/quiz.ts, hooks/useQuizGeneration.ts)
- [Source: 4-3-vocabulary-quiz-question-display.md] - play.tsx structure, QuizProgress, useQuizStore extensions, exercise type switch pattern

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
