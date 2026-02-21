# Story 4.11: Quiz Results Screen with Per-Type Breakdown

Status: review

## Story

As a user,
I want to see my quiz results with score, per-exercise-type chapter progress, and weakness update,
So that I know how well I performed and how it fits into my overall chapter mastery.

## Acceptance Criteria

1. **Given** I have answered all quiz questions
   **When** the quiz completes
   **Then** I see a completion screen with celebration animation
   **And** my score is displayed (e.g., "8/10 correct - 80%")
   **And** points earned are shown with count-up animation
   **And** per-exercise-type progress bars for the chapter are shown (which types done, in progress, new)
   **And** the just-completed type is highlighted
   **And** weakness summary update section shows changes to weakness profile (e.g., "會 vs 可以: 60% → 80% - Improving!")
   **And** "You struggled with:" section shows missed items (if any)
   **And** a "Continue" button returns to Exercise Type Selection or dashboard
   **And** `exercise_type_progress` is updated in Supabase

## Tasks / Subtasks

- [x] Task 1: Extend `useQuizStore` with completion state (AC: #1)
  - [x] 1.1 Add `isComplete: boolean` to `QuizState` interface (default `false`)
  - [x] 1.2 Add `quizStartTime: number | null` to track quiz duration (set in `startQuiz()`)
  - [x] 1.3 Add `completeQuiz: () => void` action that sets `isComplete: true`
  - [x] 1.4 Add `getQuizDuration: () => number` derived getter (returns elapsed minutes from `quizStartTime`)
  - [x] 1.5 Add `getIncorrectAnswers: () => { questionIndex: number; userAnswer: string; correctAnswer: string }[]` derived getter
  - [x] 1.6 Reset `isComplete` and `quizStartTime` in `resetQuiz()`
  - [x] 1.7 Write unit tests for new completion state fields and actions

- [x] Task 2: Create `PointsCounter` component with Reanimated count-up (AC: #1)
  - [x] 2.1 Create `components/quiz/PointsCounter.tsx` with Tamagui `styled(XStack)` wrapper and `size` variant (`inline`, `celebration`)
  - [x] 2.2 Implement count-up animation using Reanimated `useSharedValue` + `withTiming` (0 → earned points over ~1.5s)
  - [x] 2.3 Display interpolated value via `useDerivedValue` + `runOnJS` callback to update displayed text
  - [x] 2.4 Add end-of-count scale bounce via Tamagui `animation="bouncy"` with state change (`counting` → `done`)
  - [x] 2.5 Integrate `useSound` hook from Story 4.9 for "tick" sound during count-up — stubbed with `// TODO: Story 4.9` placeholder (useSound not yet implemented)
  - [x] 2.6 Use `$secondary` token color for points text (warm orange per UX spec)
  - [x] 2.7 Write co-located test `PointsCounter.test.tsx`

- [x] Task 3: Create `ExerciseTypeProgressList` component (AC: #1)
  - [x] 3.1 Create `components/quiz/ExerciseTypeProgressList.tsx` showing all 7 exercise types for a chapter
  - [x] 3.2 For each type, render: label (from `EXERCISE_TYPE_LABELS`), progress bar (animated with `animation="slow"`), percentage, status icon (✓ mastered, in-progress indicator, "New" label)
  - [x] 3.3 Highlight the just-completed exercise type with `<Theme name="primary">` wrapper and a subtle left border accent
  - [x] 3.4 Progress bars use Tamagui `YStack` with animated width (`animation="slow"`, `enterStyle={{ scaleX: 0 }}`)
  - [x] 3.5 Status logic: mastered = `best_score >= 80`, in-progress = `attempts_count > 0 && best_score < 80`, new = `attempts_count === 0`
  - [x] 3.6 Use `$success` token for mastered types, `$primary` for in-progress, `$colorSubtle` for new
  - [x] 3.7 Accept `exerciseTypeProgress` data array and `highlightType` prop
  - [x] 3.8 Write co-located test `ExerciseTypeProgressList.test.tsx` (11 tests pass)

- [x] Task 4: Create `useExerciseTypeProgress` hook (AC: #1)
  - [x] 4.1 Create `hooks/useExerciseTypeProgress.ts` using TanStack `useQuery` to fetch from `exercise_type_progress` table
  - [x] 4.2 Query: `supabase.from('exercise_type_progress').select('*').eq('chapter_id', chapterId).eq('user_id', userId)`
  - [x] 4.3 Add `exerciseTypeProgress` key to `lib/queryKeys.ts`: `exerciseTypeProgress: (chapterId: number) => ['exerciseTypeProgress', chapterId] as const`
  - [x] 4.4 Return typed array of `ExerciseTypeProgressRow` (mapped from Supabase generated types)
  - [x] 4.5 Include `updateExerciseTypeProgress` mutation: upsert `best_score`, increment `attempts_count`, set `mastered_at` if score ≥ 80%
  - [x] 4.6 Invalidate `exerciseTypeProgress`, `chapterProgress`, and `userProgress` query keys on mutation success
  - [x] 4.7 Write co-located test `useExerciseTypeProgress.test.ts` (5 tests pass)

- [x] Task 5: Create `CompletionScreen` component (AC: #1)
  - [x] 5.1 Create `components/quiz/CompletionScreen.tsx` as the main results view
  - [x] 5.2 Wrap entire screen in `AnimatePresence` with `key="completion"` and `enterStyle={{ opacity: 0, y: 50 }}` on outer `YStack`
  - [x] 5.3 Render celebration emoji/icon with `animation="bouncy"` and `enterStyle={{ scale: 0, rotate: '-20deg' }}`
  - [x] 5.4 Render "Exercise Complete!" title with `animation="medium"`
  - [x] 5.5 Render `<PointsCounter>` with `size="celebration"` — count-up triggers on mount
  - [x] 5.6 Render stats row: score (e.g., "8/10 correct - 80%"), time (e.g., "8 minutes") with `animation="medium"` and `enterStyle={{ opacity: 0 }}`
  - [x] 5.7 Render "CHAPTER X PROGRESS" section header
  - [x] 5.8 Render `<ExerciseTypeProgressList>` with fetched data and `highlightType` set to current exercise type
  - [x] 5.9 Render "FOCUS AREAS UPDATE" section with weakness summary (improvements shown with `<Theme name="success">`, still-weak/declining with neutral styling — never `<Theme name="error">`)
  - [x] 5.10 Render "You struggled with:" section listing missed items (only if there are incorrect answers)
  - [x] 5.11 Render "Continue" button with `animation="medium"` and `enterStyle={{ opacity: 0, y: 10 }}` — calls `onContinue` callback
  - [x] 5.12 On mount: call `updateExerciseTypeProgress` mutation to upsert the just-completed exercise type's progress in Supabase
  - [x] 5.13 Use `ScrollView` wrapper for content that may exceed viewport height
  - [x] 5.14 Write co-located test `CompletionScreen.test.tsx` (17 tests pass)

- [x] Task 6: Integrate CompletionScreen into `app/quiz/play.tsx` (AC: #1)
  - [x] 6.1 Import `CompletionScreen` and `useQuizStore.isComplete`
  - [x] 6.2 When `isComplete === true`, render `<CompletionScreen>` instead of the quiz question UI
  - [x] 6.3 Wrap the quiz/completion toggle in `AnimatePresence` so the quiz exits and completion enters
  - [x] 6.4 On last question answered (after feedback delay): call `useQuizStore.completeQuiz()`
  - [x] 6.5 Pass required props to `CompletionScreen`: `chapterId`, `bookId`, `exerciseType`, `score`, `totalQuestions`, `incorrectItems` (derived from `getIncorrectAnswers()`)

- [x] Task 7: Write integration tests (AC: all)
  - [x] 7.1 Test: `CompletionScreen` renders score, points counter, exercise type progress, continue button
  - [x] 7.2 Test: `PointsCounter` animates from 0 to target value (verify final displayed value)
  - [x] 7.3 Test: `ExerciseTypeProgressList` renders all 7 types with correct status (mastered/in-progress/new)
  - [x] 7.4 Test: just-completed exercise type is visually highlighted
  - [x] 7.5 Test: weakness summary shows improvement indicators with encouraging framing
  - [x] 7.6 Test: "You struggled with" section only appears when there are incorrect answers
  - [x] 7.7 Test: "Continue" button calls `onContinue` prop (navigates to `/(tabs)/books` from play.tsx)
  - [x] 7.8 Test: `play.tsx` renders `CompletionScreen` when `isComplete` is true; quiz UI shows when `isComplete` is false
  - [x] 7.9 Test: `useExerciseTypeProgress` hook fetches and returns typed data
  - [x] 7.10 Test: `updateExerciseTypeProgress` mutation upserts correctly and invalidates cache

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score`, `quizPayload` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`, `setQuizPayload`). Wired into AuthProvider for cleanup on sign-out. | **EXTEND** with `isComplete`, `quizStartTime`, `completeQuiz()`, derived getters — do NOT rewrite existing fields/actions |
| `types/quiz.ts` | Full types: `ExerciseType` (7 types + `'mixed'`), `QuizQuestion`, `QuizResponse`, `QuizGenerationError`, `EXERCISE_TYPE_LABELS`. | **USE** as-is — `EXERCISE_TYPE_LABELS` provides display names for all 7 types |
| `lib/supabase.ts` | Typed Supabase client `SupabaseClient<Database>` with auth persistence. | **USE** for `exercise_type_progress` queries |
| `lib/queryKeys.ts` | Has `quiz`, `progress`, `chapterProgress`, `userProgress` keys. Does NOT have `exerciseTypeProgress` key yet. | **EXTEND** — add `exerciseTypeProgress: (chapterId: number) => ['exerciseTypeProgress', chapterId] as const` |
| `hooks/useQuizGeneration.ts` | TanStack `useMutation` wrapper with `retry: 0`. | **DO NOT MODIFY** |
| `hooks/useSound.ts` | **EXPECTED** from Story 4.9 — provides `useSound` hook with `playCorrect()`, `playIncorrect()`, `playTick()` methods using expo-av. | **USE** for count-up tick sound. If not yet implemented, add `// TODO: Story 4.9 — useSound hook` placeholder |
| `hooks/useQuizPersistence.ts` | **EXPECTED** from Story 4.10 — handles writing `question_results` and `quiz_attempts` to Supabase. | **USE** if available. The completion screen triggers the final persistence flush. If not yet implemented, add placeholder comment |
| `app/quiz/play.tsx` | **EXPECTED** from Story 4.3 — main quiz playing screen with exercise type switch, reads `quizPayload` from store. | **MODIFY** — add completion state check, render `CompletionScreen` when `isComplete === true` |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success`, `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. | **USE** — all tokens and presets available |
| `types/supabase.ts` | Generated types for `chapter_progress` and `users` tables. Does NOT include `exercise_type_progress` or `question_results` tables yet. | **NOTE** — `exercise_type_progress` table may not exist in generated types. Use manual typing until schema migration is applied and types regenerated. |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/CompletionScreen.tsx` | Main results/celebration screen |
| `components/quiz/CompletionScreen.test.tsx` | Unit tests for completion screen |
| `components/quiz/PointsCounter.tsx` | Animated points count-up component |
| `components/quiz/PointsCounter.test.tsx` | Unit tests for points counter |
| `components/quiz/ExerciseTypeProgressList.tsx` | Per-exercise-type progress bars for a chapter |
| `hooks/useExerciseTypeProgress.ts` | TanStack Query hook for `exercise_type_progress` table |

**Dependency note:** Stories 4.3 (vocabulary quiz / play.tsx), 4.9 (sound feedback / useSound), and 4.10 (quiz persistence / useQuizPersistence) should ideally be completed before this story. If they are not:
- **4.3 not done:** Create a minimal `play.tsx` that supports the completion flow, or wait for 4.3.
- **4.9 not done:** Add `// TODO: Story 4.9` placeholder comments where sound calls would go. The PointsCounter tick sound is a key feature — stub it with a no-op.
- **4.10 not done:** The `exercise_type_progress` upsert can be implemented directly in this story's hook. Per-question `question_results` writes are 4.10's responsibility.

### CompletionScreen Component Spec

```tsx
// components/quiz/CompletionScreen.tsx
import { AnimatePresence } from 'tamagui'
import { YStack, XStack, Text, Button, ScrollView, Theme, Card } from 'tamagui'

interface CompletionScreenProps {
  /** Chapter ID (e.g., 212 for Book 2 Chapter 12) */
  chapterId: number
  /** Book ID (e.g., 2) */
  bookId: number
  /** The exercise type just completed */
  exerciseType: ExerciseType
  /** Number of correct answers */
  correctCount: number
  /** Total number of questions */
  totalQuestions: number
  /** Points earned this quiz */
  pointsEarned: number
  /** Quiz duration in minutes */
  durationMinutes: number
  /** Incorrect answer details for "You struggled with" section */
  incorrectItems: Array<{
    questionText: string
    userAnswer: string
    correctAnswer: string
    character?: string
  }>
  /** Pre-quiz weakness data for comparison (from quiz payload or cached) */
  preQuizWeaknesses?: Array<{
    item: string
    previousAccuracy: number
  }>
  /** Post-quiz weakness data (computed after quiz) */
  postQuizWeaknesses?: Array<{
    item: string
    currentAccuracy: number
  }>
  /** Called when user taps Continue */
  onContinue: () => void
}
```

**Component structure:**

```tsx
export function CompletionScreen({
  chapterId, bookId, exerciseType, correctCount, totalQuestions,
  pointsEarned, durationMinutes, incorrectItems, onContinue,
  preQuizWeaknesses, postQuizWeaknesses,
}: CompletionScreenProps) {
  const scorePercent = Math.round((correctCount / totalQuestions) * 100)
  const { data: exerciseTypeProgress } = useExerciseTypeProgress(chapterId)
  const { mutate: updateProgress } = useUpdateExerciseTypeProgress()

  // Upsert exercise_type_progress on mount
  useEffect(() => {
    updateProgress({
      chapterId,
      exerciseType,
      score: scorePercent,
    })
  }, [])

  return (
    <ScrollView>
      <AnimatePresence>
        <YStack key="completion" animation="medium"
          enterStyle={{ opacity: 0, y: 50 }}
          padding="$4" gap="$4" alignItems="center">

          {/* 1. Celebration emoji */}
          <Text fontSize={64} animation="bouncy"
            enterStyle={{ scale: 0, rotate: '-20deg' }}>
            🎉
          </Text>

          {/* 2. Title */}
          <Text fontSize="$8" fontWeight="bold" animation="medium">
            Exercise Complete!
          </Text>

          {/* 3. Points count-up */}
          <PointsCounter points={pointsEarned} size="celebration" />

          {/* 4. Stats row */}
          <StatsCard score={correctCount} total={totalQuestions}
            percent={scorePercent} duration={durationMinutes} />

          {/* 5. Per-exercise-type progress */}
          <ExerciseTypeProgressList
            progress={exerciseTypeProgress}
            highlightType={exerciseType}
            chapterId={chapterId}
          />

          {/* 6. Focus areas update */}
          <WeaknessSummary
            preQuiz={preQuizWeaknesses}
            postQuiz={postQuizWeaknesses}
          />

          {/* 7. Struggled with section */}
          {incorrectItems.length > 0 && (
            <StruggledWithSection items={incorrectItems} />
          )}

          {/* 8. Continue button */}
          <Button size="$5" theme="primary"
            animation="medium" enterStyle={{ opacity: 0, y: 10 }}
            onPress={onContinue}>
            Continue
          </Button>
        </YStack>
      </AnimatePresence>
    </ScrollView>
  )
}
```

### PointsCounter Animation (Reanimated useSharedValue)

The points count-up is the ONE place where raw Reanimated is used. Tamagui's declarative animation system handles spring-based property transitions but cannot interpolate a displayed numeric text value over time.

```tsx
// components/quiz/PointsCounter.tsx
import { useEffect } from 'react'
import { useSharedValue, withTiming, runOnJS, useDerivedValue } from 'react-native-reanimated'
import { styled, XStack, Text } from 'tamagui'

const PointsCounterContainer = styled(XStack, {
  animation: 'bouncy',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',

  variants: {
    size: {
      inline: { paddingHorizontal: '$2', paddingVertical: '$1' },
      celebration: { paddingHorizontal: '$4', paddingVertical: '$3' },
    },
    bounceState: {
      counting: {},
      done: { scale: 1.1 },  // Triggers bouncy spring overshoot
    },
  } as const,

  defaultVariants: {
    size: 'celebration',
    bounceState: 'counting',
  },
})

interface PointsCounterProps {
  /** Target points to count up to */
  points: number
  /** Display size variant */
  size?: 'inline' | 'celebration'
}

export function PointsCounter({ points, size = 'celebration' }: PointsCounterProps) {
  const animatedValue = useSharedValue(0)
  const [displayValue, setDisplayValue] = useState(0)
  const [isDone, setIsDone] = useState(false)
  // const { playTick } = useSound()  // TODO: Story 4.9 — uncomment when useSound exists

  // Update displayed value from animated value
  useDerivedValue(() => {
    const rounded = Math.round(animatedValue.value)
    runOnJS(setDisplayValue)(rounded)
    // runOnJS(playTick)()  // TODO: Story 4.9 — tick sound on each threshold
  })

  useEffect(() => {
    animatedValue.value = withTiming(points, {
      duration: 1500,  // 1.5 seconds count-up
    }, (finished) => {
      if (finished) {
        runOnJS(setIsDone)(true)
      }
    })
  }, [points])

  return (
    <PointsCounterContainer size={size} bounceState={isDone ? 'done' : 'counting'}>
      <Text fontSize={size === 'celebration' ? '$9' : '$6'}
        fontWeight="bold" color="$secondary">
        +{displayValue}
      </Text>
      <Text fontSize={size === 'celebration' ? '$6' : '$4'}
        color="$colorSubtle">
        points
      </Text>
    </PointsCounterContainer>
  )
}
```

**Key implementation details:**
- `useSharedValue(0)` starts at 0, `withTiming(points, { duration: 1500 })` animates to target
- `useDerivedValue` + `runOnJS` bridges the UI thread animated value to React state for text display
- When count-up finishes, `bounceState` changes from `'counting'` to `'done'`, triggering the Tamagui `animation="bouncy"` spring on the `scale: 1.1` variant — this creates the satisfying end-bounce
- Sound tick: call `playTick()` via `runOnJS` on each value change (throttle to every ~5-10 point increment to avoid audio overload)

### Celebration Animation Sequence

The completion screen uses Tamagui's declarative `enterStyle` props to create a staggered entrance. Because all children mount simultaneously inside `AnimatePresence`, the stagger effect comes from different animation presets (bouncy vs medium vs slow) which have different spring parameters and thus different settling times.

**Sequence:**

1. **Screen slides up** — Outer `YStack` with `animation="medium"`, `enterStyle={{ opacity: 0, y: 50 }}`
2. **Trophy/emoji bounces in** — `animation="bouncy"`, `enterStyle={{ scale: 0, rotate: '-20deg' }}` (bouncy spring overshoots, creating a playful entrance)
3. **Points count up** — `PointsCounter` starts its Reanimated `withTiming` animation on mount (~1.5s)
4. **Stats row fades in** — `animation="medium"`, `enterStyle={{ opacity: 0 }}`
5. **Per-exercise-type progress bars animate** — `animation="slow"`, bars grow from `scaleX: 0` to their target width
6. **Focus areas update fades in** — `animation="medium"`, `enterStyle={{ opacity: 0, y: 10 }}`
7. **Continue button appears last** — `animation="medium"`, `enterStyle={{ opacity: 0, y: 10 }}`

**Note:** Tamagui does not support explicit stagger delays. The visual stagger is achieved by:
- Using different animation presets (bouncy settles faster than medium, medium faster than slow)
- Children further down the tree naturally render slightly later
- The `slow` preset on progress bars (`damping: 20, stiffness: 60, mass: 1.2`) takes longer to settle, creating a natural delay effect

### Per-Exercise-Type Progress Display

This is the key differentiator of the completion screen. It shows the user's progress across ALL 7 exercise types for the current chapter, not just the one they completed.

**Data source:** `exercise_type_progress` table in Supabase.

**Schema (from architecture.md):**
```sql
exercise_type_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  chapter_id INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  best_score INTEGER DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  mastered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

**Display logic for each of the 7 types:**

| Condition | Status | Visual |
|-----------|--------|--------|
| `attempts_count === 0` | New | Gray empty bar, "New" label in `$colorSubtle` |
| `attempts_count > 0 && best_score < 80` | In Progress | Partially filled bar in `$primary`, percentage shown |
| `best_score >= 80` | Mastered | Full bar in `$success`, ✓ checkmark icon |

**Just-completed type highlighting:**
- Wrap the row for the just-completed type in `<Theme name="primary">` for accent coloring
- Add a left border accent (`borderLeftWidth: 3, borderLeftColor: '$primary'`)
- Show the updated score (not the old one) — the upsert happens on mount, and the query refetches

**All 7 exercise types (always shown, in this order):**
1. Vocabulary
2. Grammar
3. Fill-in-the-Blank
4. Matching
5. Dialogue Completion
6. Sentence Construction
7. Reading Comprehension

Types not yet attempted show as "New" with an empty progress bar — this encourages the user to try other types.

### Weakness Summary Update Logic

The weakness summary compares pre-quiz and post-quiz weakness data to show the user how their focus areas changed.

**Data flow:**
1. Before quiz generation, the backend queries `question_results` for the user's weakness profile
2. The quiz payload may include weakness targeting info (which items were targeted)
3. After quiz completion, the mobile app can compute updated accuracy from `question_results`
4. The completion screen shows the delta

**Comparison logic:**

```typescript
interface WeaknessChange {
  item: string              // e.g., "會 vs 可以"
  previousAccuracy: number  // e.g., 60
  currentAccuracy: number   // e.g., 80
  trend: 'improving' | 'stable' | 'declining'
  message: string           // e.g., "Getting stronger!"
}

function computeWeaknessChanges(
  preQuiz: Array<{ item: string; previousAccuracy: number }>,
  postQuiz: Array<{ item: string; currentAccuracy: number }>
): WeaknessChange[] {
  return postQuiz.map(post => {
    const pre = preQuiz.find(p => p.item === post.item)
    const prev = pre?.previousAccuracy ?? 0
    const curr = post.currentAccuracy
    const delta = curr - prev

    let trend: 'improving' | 'stable' | 'declining'
    let message: string

    if (delta > 5) {
      trend = 'improving'
      message = 'Getting stronger!'
    } else if (delta < -5) {
      trend = 'declining'
      message = 'Keep practicing!'  // Encouraging, not harsh
    } else {
      trend = 'stable'
      message = 'Holding steady'
    }

    return { item: post.item, previousAccuracy: prev, currentAccuracy: curr, trend, message }
  })
}
```

**Visual treatment:**
- Improving items: `<Theme name="success">` wrapper, ↑ arrow icon, green text
- Stable items: Neutral styling, → arrow icon, `$colorSubtle` text
- Declining items: Neutral styling (NOT `<Theme name="error">`), ↓ arrow icon, `$colorSubtle` text, encouraging message
- **NEVER** use red/error theme for weakness areas — per UX spec, framing is always encouraging

**Emotional design rules (from UX spec):**
- Improvements always highlighted before regressions
- No items labeled "bad" — use "focus area," "needs practice," "improving"
- Trend arrows: up = green, stable = amber, down = gentle orange (same as `$error` which is `#FB923C`, a warm orange)

### Supabase exercise_type_progress Update

On completion screen mount, upsert the `exercise_type_progress` record for the just-completed exercise type.

**Upsert logic:**

```typescript
async function upsertExerciseTypeProgress(
  userId: string,
  chapterId: number,
  exerciseType: ExerciseType,
  newScore: number
) {
  // Fetch existing record
  const { data: existing } = await supabase
    .from('exercise_type_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .eq('exercise_type', exerciseType)
    .single()

  const bestScore = existing
    ? Math.max(existing.best_score, newScore)
    : newScore
  const attemptsCount = existing
    ? existing.attempts_count + 1
    : 1
  const masteredAt = bestScore >= 80
    ? (existing?.mastered_at ?? new Date().toISOString())
    : null

  const { error } = await supabase
    .from('exercise_type_progress')
    .upsert({
      user_id: userId,
      chapter_id: chapterId,
      exercise_type: exerciseType,
      best_score: bestScore,
      attempts_count: attemptsCount,
      mastered_at: masteredAt,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,chapter_id,exercise_type',
    })

  if (error) throw error
}
```

**After upsert:**
- Invalidate `queryKeys.exerciseTypeProgress(chapterId)` to refetch progress bars
- Invalidate `queryKeys.chapterProgress(userId, bookId)` since chapter completion is derived from exercise type progress
- Invalidate `queryKeys.userProgress(userId)` for dashboard updates

### Screen Layout

```
┌─────────────────────────────────┐
│            🎉                   │
│     Exercise Complete!          │
│         +85 points              │
│  ┌───────────────────────────┐  │
│  │ Score: 8/10 (80%)         │  │
│  │ Time: 8 minutes           │  │
│  └───────────────────────────┘  │
│                                 │
│  CHAPTER 12 PROGRESS            │
│  Vocabulary    ████████░░ 85% ✓ │
│  Grammar       ██████░░░░ 65%   │
│  Matching      █████████░ 88%   │ ← Just completed (highlighted)
│  Fill-in-Blank ░░░░░░░░░░ New   │
│  Dialogue      ░░░░░░░░░░ New   │
│  Sent. Constr. ░░░░░░░░░░ New   │
│  Reading       ░░░░░░░░░░ New   │
│                                 │
│  FOCUS AREAS UPDATE             │
│  ┌───────────────────────────┐  │
│  │ 會 vs 可以: 60% → 80% ↑  │  │
│  │ Getting stronger!         │  │
│  └───────────────────────────┘  │
│                                 │
│  YOU STRUGGLED WITH:            │
│  ┌───────────────────────────┐  │
│  │ • 把 construction         │  │
│  │   Your answer: 我放書把... │  │
│  │   Correct: 我把書放在...   │  │
│  └───────────────────────────┘  │
│                                 │
│     [ Continue ]                │
└─────────────────────────────────┘
```

### Tamagui Animation Patterns

**CompletionScreen entrance (AnimatePresence):**

```tsx
<AnimatePresence>
  {isComplete && (
    <YStack key="completion" animation="medium"
      enterStyle={{ opacity: 0, y: 50 }}
      exitStyle={{ opacity: 0, y: 50 }}
      flex={1}>
      {/* All children animate with their own enterStyle */}
    </YStack>
  )}
</AnimatePresence>
```

**Progress bar fill animation:**

```tsx
const ProgressBarFill = styled(YStack, {
  animation: 'slow',
  height: 8,
  borderRadius: '$1',
  backgroundColor: '$primary',
})

// Usage: width is set as a percentage
<ProgressBarFill
  width={`${percent}%`}
  enterStyle={{ scaleX: 0 }}
  transformOrigin="left"
/>
```

**Stats card fade-in:**

```tsx
<Card animation="medium" enterStyle={{ opacity: 0 }}
  padding="$4" borderRadius="$4" backgroundColor="$surface">
  <XStack justifyContent="space-between">
    <Text>Score: {correctCount}/{totalQuestions} ({scorePercent}%)</Text>
    <Text color="$colorSubtle">Time: {durationMinutes} min</Text>
  </XStack>
</Card>
```

**Weakness improvement indicator:**

```tsx
<Theme name="success">
  <XStack gap="$2" alignItems="center" animation="medium"
    enterStyle={{ opacity: 0, y: 10 }}>
    <Text>會 vs 可以: 60% → 80%</Text>
    <Text color="$success">↑</Text>
    <Text color="$success" fontSize="$3">Getting stronger!</Text>
  </XStack>
</Theme>
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, `$secondary`, `$colorSubtle`, etc.)
- **ALWAYS** use `<Theme name="success">` for improvement indicators — not manual `color="green"`
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="bouncy"`, `animation="medium"`, `animation="slow"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for the completion screen entrance (conditional rendering with enter/exit animations)
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code (except PointsCounter count-up)
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **ALWAYS** use `focusStyle={{ borderColor: '$borderColorFocus' }}` for focused states on the Continue button
- **NEVER** use `react-native` `Animated` API — use Tamagui declarative animations (Reanimated only for PointsCounter numeric interpolation)

### Anti-Patterns to Avoid

- **DO NOT** use raw Reanimated for anything except the PointsCounter number animation — all other animations use Tamagui declarative props
- **DO NOT** use harsh red (`<Theme name="error">`) for weakness areas — use encouraging framing with neutral or success theming only
- **DO NOT** skip per-exercise-type progress — this is the key differentiator of the completion screen and the primary value proposition
- **DO NOT** hardcode hex colors — `$tokenName` only (e.g., `$success`, `$primary`, `$secondary`, `$colorSubtle`)
- **DO NOT** create a separate results screen route file — the `CompletionScreen` is a component rendered conditionally inside `play.tsx` when `isComplete === true`
- **DO NOT** skip the count-up sound — the tick sound during PointsCounter count-up is a key UX element. Use `useSound` from Story 4.9 or stub it.
- **DO NOT** use `React.useState` for quiz completion state — use `useQuizStore.isComplete` (Zustand) so it persists across component re-renders and is accessible from `play.tsx`
- **DO NOT** create `components/quiz/index.ts` barrel files — import directly from each component file
- **DO NOT** put Supabase upsert logic directly in the component — extract it into the `useExerciseTypeProgress` hook's mutation
- **DO NOT** use `setInterval` for the count-up — use Reanimated `withTiming` which runs on the UI thread
- **DO NOT** label weakness items as "bad" or "weak" — use "focus area," "needs practice," "improving"
- **DO NOT** show weakness decline with `<Theme name="error">` — use neutral styling with gentle orange arrow

### Dependencies on Other Stories

- **Depends on:** Story 1.1 (mobile scaffold) — DONE
- **Depends on:** Story 1.1b (Tamagui theme + sub-themes + animation presets) — DONE/REVIEW
- **Depends on:** Story 1.3 (Supabase schema — `exercise_type_progress` table must exist) — DONE (table exists in schema spec; verify migration applied)
- **Depends on:** Story 1.5 (TanStack Query + Zustand) — DONE
- **Depends on:** Story 4.3 (vocabulary quiz — creates `play.tsx`, extends `useQuizStore` with `quizPayload`) — READY-FOR-DEV (**should be completed before 4.11**)
- **Depends on:** Story 4.9 (immediate feedback — creates `useSound` hook for tick/ding/bonk sounds) — READY-FOR-DEV (**stub if not done**)
- **Depends on:** Story 4.10 (quiz persistence — creates `useQuizPersistence` for `question_results` writes) — READY-FOR-DEV (**stub if not done**)
- **Enables:** Story 5.1 (chapter test — reuses CompletionScreen with multi-type breakdown)
- **Enables:** Story 5.2 (chapter mastery calculation — reads `exercise_type_progress` data)
- **Enables:** Story 3.5 (exercise type selection screen — reads `exercise_type_progress` for per-type status)

**Note on Story 4.3 dependency:** Story 4.3 creates `app/quiz/play.tsx` with the exercise type switch and extends `useQuizStore` with `quizPayload`. This story (4.11) adds the completion flow to that screen. If 4.3 is not yet complete, the dev agent should implement 4.3 first or create a minimal `play.tsx` that supports the completion toggle.

**Note on `exercise_type_progress` table:** The table is defined in the architecture spec (Story 1.3 migration) but may not yet exist in the Supabase project or in the generated `types/supabase.ts`. If the table doesn't exist:
1. Apply the migration via Supabase MCP `apply_migration`
2. Regenerate types via `generate_typescript_types`
3. Or use manual TypeScript types as a temporary measure

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/CompletionScreen components/quiz/PointsCounter components/quiz/ExerciseTypeProgressList hooks/useExerciseTypeProgress stores/useQuizStore --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/CompletionScreen.tsx components/quiz/PointsCounter.tsx components/quiz/ExerciseTypeProgressList.tsx hooks/useExerciseTypeProgress.ts stores/useQuizStore.ts --ext .ts,.tsx
```

**Mock data for tests:**

```typescript
import type { ExerciseType } from '../../types/quiz'

// Mock exercise type progress data (from Supabase)
const mockExerciseTypeProgress = [
  { exercise_type: 'vocabulary', best_score: 85, attempts_count: 3, mastered_at: '2026-02-19T10:00:00Z' },
  { exercise_type: 'grammar', best_score: 65, attempts_count: 2, mastered_at: null },
  { exercise_type: 'matching', best_score: 88, attempts_count: 1, mastered_at: '2026-02-20T14:00:00Z' },
  { exercise_type: 'fill_in_blank', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'dialogue_completion', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'sentence_construction', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'reading_comprehension', best_score: 0, attempts_count: 0, mastered_at: null },
]

// Mock weakness changes
const mockPreQuizWeaknesses = [
  { item: '會 vs 可以', previousAccuracy: 60 },
  { item: '把 construction', previousAccuracy: 45 },
]

const mockPostQuizWeaknesses = [
  { item: '會 vs 可以', currentAccuracy: 80 },
  { item: '把 construction', currentAccuracy: 50 },
]

// Mock incorrect answers for "You struggled with" section
const mockIncorrectItems = [
  {
    questionText: 'Which sentence correctly uses the 把 construction?',
    userAnswer: '我放書把桌子上了',
    correctAnswer: '我把書放在桌子上了',
    character: '把',
  },
  {
    questionText: 'What does 可以 mean in this context?',
    userAnswer: 'will',
    correctAnswer: 'can / may',
  },
]
```

**Key test scenarios:**

1. **CompletionScreen renders all sections:** celebration emoji, title, points counter, stats card, exercise type progress, weakness summary, continue button
2. **Score display:** "8/10 correct - 80%" renders correctly from props
3. **PointsCounter:** Starts at 0, ends at target value (test final state after animation)
4. **ExerciseTypeProgressList:** Renders all 7 types; mastered types show ✓; in-progress show percentage; new types show "New"
5. **Highlight just-completed type:** The `highlightType` prop causes visual differentiation (primary theme wrapper)
6. **Weakness summary:** Improving items show success theme; declining items show neutral (not error)
7. **Struggled with section:** Only renders when `incorrectItems.length > 0`; hidden when all answers correct
8. **Continue button:** Calls `onContinue` callback on press
9. **play.tsx integration:** When `useQuizStore.isComplete === true`, renders `CompletionScreen` instead of quiz UI
10. **Supabase upsert:** `useExerciseTypeProgress` mutation is called on mount with correct params

### File Structure

```
dangdai-mobile/
├── components/quiz/
│   ├── CompletionScreen.tsx              # CREATE: main results/celebration screen
│   ├── CompletionScreen.test.tsx         # CREATE: unit + integration tests
│   ├── PointsCounter.tsx                 # CREATE: animated count-up component
│   ├── PointsCounter.test.tsx            # CREATE: unit tests
│   └── ExerciseTypeProgressList.tsx      # CREATE: per-type progress bars
├── hooks/
│   └── useExerciseTypeProgress.ts        # CREATE: TanStack Query hook for exercise_type_progress
├── stores/
│   └── useQuizStore.ts                   # MODIFY: add isComplete, quizStartTime, completeQuiz()
├── lib/
│   └── queryKeys.ts                      # MODIFY: add exerciseTypeProgress key
└── app/quiz/
    └── play.tsx                          # MODIFY: render CompletionScreen when isComplete
```

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- Backend generates quiz payloads with `exercise_type` field matching the 7 types.
- `exercise_type_progress` table is referenced in the architecture but may not yet be migrated.
- The quiz payload includes `explanation` and `source_citation` per question — useful for the "struggled with" section.

**From Story 4.2 (loading screen):**
- `lib/api.ts` has complete `api.generateQuiz()` — no changes needed.
- `types/quiz.ts` defines `ExerciseType` with all 7 types + `'mixed'` and `EXERCISE_TYPE_LABELS` for display names.
- `QuizResponse` includes `chapter_id`, `book_id`, `exercise_type` — all needed by CompletionScreen.

**From Story 4.3 (vocabulary quiz):**
- Creates `app/quiz/play.tsx` with exercise type switch — completion flow will be added here.
- Extends `useQuizStore` with `quizPayload`, `setQuizPayload`, `getCurrentQuestion`, `isLastQuestion`.
- Establishes the pattern: on last question answered, navigate to results (placeholder for this story).
- `play.tsx` reads `quizPayload` from store — CompletionScreen can access `chapterId`, `bookId`, `exerciseType` from it.

**From Story 4.5 (matching exercise):**
- Demonstrates component-local interaction state vs store-level session state pattern.
- Shows how exercise-type-specific components integrate into `play.tsx` via the exercise type switch.
- Matching score is tracked in `useQuizStore.matchingScore` — CompletionScreen reads final score from store.

**From Story 4.9 (immediate feedback — expected):**
- Creates `hooks/useSound.ts` with `playCorrect()`, `playIncorrect()`, `playTick()` methods.
- Uses `expo-av` for audio playback with preloaded sounds.
- The `playTick()` method is needed by PointsCounter for the count-up sound.
- If not yet implemented, stub with `// TODO: Story 4.9` comments.

**From Story 4.10 (quiz persistence — expected):**
- Creates `hooks/useQuizPersistence.ts` for writing `question_results` and `quiz_attempts` to Supabase.
- Per-question results are written during the quiz (not on completion).
- On completion, the persistence hook may flush any remaining writes.
- The `exercise_type_progress` upsert in this story (4.11) is separate from 4.10's per-question writes.

**From architecture.md:**
- `exercise_type_progress` schema: `id, user_id, chapter_id, exercise_type, best_score, attempts_count, mastered_at, updated_at`
- Chapter mastery requires ≥4 of 7 types attempted with ≥80% average (Story 5.2 concern, not this story)
- Weakness profile is computed from `question_results` via SQL aggregation — this story displays the delta, not computes it
- TanStack Query key pattern: `exerciseTypeProgress: (chapterId: number) => ['exerciseTypeProgress', chapterId]`

**From ux-design-specification.md:**
- CompletionScreen anatomy: celebration icon, title, points (animated), stats row, per-exercise-type breakdown, weakness summary, improvement indicators, continue button
- Animation sequence: slide up → bounce in → count up → fade in → progress bars → weakness → button
- PointsCounter uses Reanimated `useSharedValue` + `withTiming` for numeric interpolation, Tamagui `animation="bouncy"` for end-bounce
- Encouraging framing: "Getting stronger!" not "Still weak"; `<Theme name="success">` for improved areas, neutral for still-weak
- Reduced motion: respect `prefers-reduced-motion`, disable animations but keep feedback

### References

- [Source: epics.md#Story-4.11] - Story requirements and acceptance criteria
- [Source: architecture.md#Data-Architecture] - `exercise_type_progress` table schema (id, user_id, chapter_id, exercise_type, best_score, attempts_count, mastered_at)
- [Source: architecture.md#State-Management] - Zustand for quiz state, TanStack Query for server state
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets (quick, bouncy, medium, slow), sub-themes, declarative animation props, raw Reanimated only for numeric interpolation
- [Source: architecture.md#Data-Flow-Quiz-Generation] - Step 13: exercise_type_progress update on quiz completion; Step 14: CompletionScreen shows score, per-type breakdown, weakness update
- [Source: architecture.md#Communication-Patterns] - TanStack Query key factory including `exerciseTypeProgress`
- [Source: ux-design-specification.md#CompletionScreen] - Component anatomy, animation sequence, per-exercise-type breakdown, weakness summary
- [Source: ux-design-specification.md#PointsCounter] - `styled(XStack)` with `size` variant, Reanimated count-up, bouncy end-bounce, tick sound
- [Source: ux-design-specification.md#Adaptive-Quiz-Feedback-Pattern] - Post-quiz weakness summary framing: encouraging, `<Theme name="success">` for improved, neutral for still-weak
- [Source: ux-design-specification.md#Weakness-Dashboard-Update-Pattern] - Accuracy bars animate with `animation="medium"`, trend arrows, emotional design rules
- [Source: ux-design-specification.md#Animation-Patterns] - AnimatePresence for completion screen entrance, named presets, reduced motion support
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - All 7 types listed with interaction models
- [Source: prd.md#FR25] - Quiz results with score, per-exercise-type progress, weakness update
- [Source: prd.md#FR37-FR40] - Per-exercise-type scores, chapter completion factoring type coverage
- [Source: prd.md#NFR2] - 500ms screen navigation
- [Source: prd.md#NFR12] - Progress synced within 5 seconds
- [Source: 4-3-vocabulary-quiz-question-display.md] - play.tsx structure, useQuizStore extensions, exercise type switch pattern, completion placeholder
- [Source: 4-5-matching-exercise.md] - Exercise type integration pattern, component-local vs store state, onComplete callback pattern

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6 (Claude Code)

### Debug Log References

None — implementation proceeded cleanly without major blockers.

### Completion Notes List

- **Story 4.9 dependency (useSound):** Not yet implemented. Stubbed in `PointsCounter.tsx` with `// TODO: Story 4.9 — useSound hook` comment at both the import site and the `runOnJS(playTick)()` call site inside `useDerivedValue`.
- **Story 4.10 dependency (useQuizPersistence):** Not required for this story — `exercise_type_progress` upsert is handled directly in `useExerciseTypeProgress` hook's mutation. Per-question `question_results` writes are 4.10's responsibility.
- **Supabase migration applied:** `create_exercise_type_progress` migration applied to project `qhsjaybldyqsavjimxes`. Table includes RLS policies (users can only read/write their own rows). `types/supabase.ts` regenerated with generated types.
- **Pre-existing test failure:** `hooks/useChapters.test.ts:102` fails with a chapter title mismatch ("Dates" vs "Beef Noodles Are Delicious") — this was introduced in Story 3.2 (git log confirms last touch was `9d79521 dev us 3.2`). Not a regression from this story.
- **ESLint fixes applied:** Replaced `@ts-ignore` with `@ts-expect-error` in `ExerciseTypeProgressList.tsx`; removed spurious `// eslint-disable-line react-hooks/exhaustive-deps` comment in `PointsCounter.tsx` (the `react-hooks` plugin is not installed in this project's ESLint config).
- **`transformOrigin` on progress bars:** Used `@ts-expect-error` to suppress the TypeScript error on `style={{ transformOrigin: 'left' }}` on the Tamagui-styled `ProgressBarFill` component — this prop is valid at runtime in React Native/Tamagui but not in the type definition.
- **Score calculation for points:** Points earned = `score * 10` (each correct answer = 10 points), computed in `play.tsx` before passing to `CompletionScreen`.
- **`onContinue` navigation:** Routes to `/(tabs)/books` (the books/dashboard tab). Can be updated to route to exercise type selection once that screen exists (Story 3.5).

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-02-20 | Extended useQuizStore with isComplete, quizStartTime, completeQuiz, getQuizDuration, getIncorrectAnswers | `stores/useQuizStore.ts`, `stores/useQuizStore.test.ts` |
| 2026-02-20 | Created PointsCounter component with Reanimated count-up and Tamagui bouncy end-bounce | `components/quiz/PointsCounter.tsx`, `components/quiz/PointsCounter.test.tsx` |
| 2026-02-20 | Created ExerciseTypeProgressList showing all 7 types with mastered/in-progress/new status and progress bars | `components/quiz/ExerciseTypeProgressList.tsx`, `components/quiz/ExerciseTypeProgressList.test.tsx` |
| 2026-02-20 | Applied Supabase migration for exercise_type_progress table with RLS; regenerated TypeScript types | Supabase project `qhsjaybldyqsavjimxes`, `types/supabase.ts` |
| 2026-02-20 | Created useExerciseTypeProgress hook with TanStack Query fetch and upsert mutation | `hooks/useExerciseTypeProgress.ts`, `hooks/useExerciseTypeProgress.test.ts`, `lib/queryKeys.ts` |
| 2026-02-20 | Created CompletionScreen with celebration animation, stats, progress list, weakness summary, struggled-with section | `components/quiz/CompletionScreen.tsx`, `components/quiz/CompletionScreen.test.tsx` |
| 2026-02-20 | Integrated CompletionScreen into play.tsx — completeQuiz() on last answer, conditional render when isComplete | `app/quiz/play.tsx`, `app/quiz/play.test.tsx` |
| 2026-02-20 | ESLint fixes: @ts-ignore → @ts-expect-error, removed invalid eslint-disable comment | `components/quiz/ExerciseTypeProgressList.tsx`, `components/quiz/PointsCounter.tsx` |

### File List

**Created:**
- `dangdai-mobile/components/quiz/PointsCounter.tsx`
- `dangdai-mobile/components/quiz/PointsCounter.test.tsx`
- `dangdai-mobile/components/quiz/ExerciseTypeProgressList.tsx`
- `dangdai-mobile/components/quiz/ExerciseTypeProgressList.test.tsx`
- `dangdai-mobile/components/quiz/CompletionScreen.tsx`
- `dangdai-mobile/components/quiz/CompletionScreen.test.tsx`
- `dangdai-mobile/hooks/useExerciseTypeProgress.ts`
- `dangdai-mobile/hooks/useExerciseTypeProgress.test.ts`

**Modified:**
- `dangdai-mobile/stores/useQuizStore.ts`
- `dangdai-mobile/stores/useQuizStore.test.ts`
- `dangdai-mobile/lib/queryKeys.ts`
- `dangdai-mobile/types/supabase.ts`
- `dangdai-mobile/app/quiz/play.tsx`
- `dangdai-mobile/app/quiz/play.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Supabase migrations applied:**
- `create_exercise_type_progress` (project `qhsjaybldyqsavjimxes`)
