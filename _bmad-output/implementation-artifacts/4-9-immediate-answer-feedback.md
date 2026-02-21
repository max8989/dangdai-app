# Story 4.9: Immediate Answer Feedback (Visual + Sound + Explanation)

Status: review

## Story

As a user,
I want to receive immediate visual and audio feedback with explanations on my answer,
So that I know instantly if I was correct and learn from the explanation.

## Acceptance Criteria

1. **Given** I have submitted a correct answer (any exercise type) **When** feedback is displayed **Then** the answer shows success theme (green border, checkmark) **And** a satisfying "ding" sound plays **And** points increment is shown **And** the pre-generated explanation is displayed (e.g., "This uses the 把 construction because...") **And** source citation is shown (e.g., "From Book 2, Chapter 12 - Grammar") **And** feedback displays for ~1 second before auto-advancing

2. **Given** I have submitted an incorrect answer **When** feedback is displayed **Then** the answer shows error theme (gentle orange border, not harsh red) **And** the correct answer is highlighted in green **And** a gentle "bonk" sound plays **And** the pre-generated explanation is displayed **And** feedback displays for ~1 second before auto-advancing

## Tasks / Subtasks

- [x] Task 1: Create `useSound` hook with expo-av preloading and mute toggle (AC: #1, #2)
  - [x] 1.1 Create `hooks/useSound.ts` that imports `Audio` from `expo-av`
  - [x] 1.2 Define `SoundName` type: `'correct' | 'incorrect' | 'celebration'`
  - [x] 1.3 Implement `preloadSounds()` function that loads all three sound assets (`assets/sounds/correct.mp3`, `assets/sounds/incorrect.mp3`, `assets/sounds/celebration.mp3`) into `Audio.Sound` instances and caches them in a module-level `Map<SoundName, Audio.Sound>`
  - [x] 1.4 Call `Audio.setAudioModeAsync({ playsInSilentModeIOS: false })` to respect device silent mode
  - [x] 1.5 Implement `playSound(name: SoundName)` function that checks `useSettingsStore.soundEnabled` before playing; rewinds sound to position 0 before each play
  - [x] 1.6 Implement `unloadSounds()` cleanup function that calls `.unloadAsync()` on all cached sounds
  - [x] 1.7 Export hook `useSound()` that returns `{ playSound, preloadSounds, unloadSounds }` and reads `soundEnabled` from `useSettingsStore`
  - [x] 1.8 Write co-located test `hooks/useSound.test.ts` with mocked `expo-av`

- [x] Task 2: Create placeholder sound asset files (AC: #1, #2)
  - [x] 2.1 Create `assets/sounds/correct.mp3` placeholder (short silent or minimal "ding" MP3)
  - [x] 2.2 Create `assets/sounds/incorrect.mp3` placeholder (short silent or minimal "bonk" MP3)
  - [x] 2.3 Create `assets/sounds/celebration.mp3` placeholder (short silent or minimal chime MP3 -- used by Story 4.11 CompletionScreen)

- [x] Task 3: Create `FeedbackOverlay` component (AC: #1, #2)
  - [x] 3.1 Create `components/quiz/FeedbackOverlay.tsx` with props: `isCorrect: boolean`, `explanation: string`, `sourceCitation: string`, `correctAnswer?: string`, `pointsEarned?: number`, `visible: boolean`
  - [x] 3.2 Wrap content in `AnimatePresence` with `<Theme name={isCorrect ? 'success' : 'error'}>` for automatic color resolution
  - [x] 3.3 Render icon: `Check` (from `@tamagui/lucide-icons`) for correct, `X` for incorrect
  - [x] 3.4 Render explanation text from the pre-generated `explanation` field
  - [x] 3.5 Render source citation text (e.g., "From Book 2, Chapter 12 - Grammar") in `$colorSubtle`
  - [x] 3.6 For incorrect answers: render correct answer highlighted with `<Theme name="success">` inline
  - [x] 3.7 For correct answers: render points earned (e.g., "+10 pts") with `animation="bouncy"`
  - [x] 3.8 Use `enterStyle={{ opacity: 0, scale: 0.8 }}` and `exitStyle={{ opacity: 0 }}` with `animation="quick"`
  - [x] 3.9 Apply `pointerEvents="none"` on the overlay container to prevent user taps during feedback
  - [x] 3.10 Write co-located test `components/quiz/FeedbackOverlay.test.tsx`

- [x] Task 4: Add feedback state to `useQuizStore` (AC: #1, #2)
  - [x] 4.1 Add `showFeedback: boolean` to `QuizState` interface (default: `false`)
  - [x] 4.2 Add `feedbackIsCorrect: boolean | null` to `QuizState` interface (default: `null`)
  - [x] 4.3 Add `showFeedback(isCorrect: boolean)` action that sets `showFeedback: true` and `feedbackIsCorrect: isCorrect` (named `triggerShowFeedback` to avoid conflict with state field name)
  - [x] 4.4 Add `hideFeedback()` action that sets `showFeedback: false` and `feedbackIsCorrect: null`
  - [x] 4.5 Reset feedback state in `resetQuiz()` and `nextQuestion()` actions
  - [x] 4.6 Write unit tests for new feedback state in `stores/useQuizStore.test.ts`

- [x] Task 5: Integrate FeedbackOverlay + useSound into `app/quiz/play.tsx` (AC: #1, #2)
  - [x] 5.1 Import and call `useSound()` hook; call `preloadSounds()` in a `useEffect` on mount with `unloadSounds()` cleanup
  - [x] 5.2 Import `FeedbackOverlay` and render it at the bottom of the screen layout, reading `showFeedback` and `feedbackIsCorrect` from `useQuizStore`
  - [x] 5.3 Modify the answer submission handler for ALL exercise types: after local/hybrid validation, call `useQuizStore.triggerShowFeedback(isCorrect)` and `playSound(isCorrect ? 'correct' : 'incorrect')` simultaneously
  - [x] 5.4 Pass current question's `explanation`, `source_citation`, `correct_answer`, and points earned to `FeedbackOverlay`
  - [x] 5.5 Implement auto-advance timer: after `showFeedback` becomes true, start a 1-second `setTimeout` that calls `hideFeedback()` then `nextQuestion()` (or navigates to completion if last question)
  - [x] 5.6 Disable all answer interaction while `showFeedback` is true (pass `disabled` prop to exercise components)
  - [x] 5.7 Ensure feedback integration works for vocabulary/grammar (AnswerOptionGrid), fill-in-blank (WordBankSelector + FillInBlankSentence), dialogue completion (DialogueCard), sentence construction (SentenceBuilder). Note: MatchingExercise (Story 4.5) not yet implemented — will integrate when 4.5 is completed.

- [x] Task 6: Write integration tests (AC: #1, #2)
  - [x] 6.1 Test: FeedbackOverlay renders with success theme and checkmark for correct answer
  - [x] 6.2 Test: FeedbackOverlay renders with error theme and X icon for incorrect answer
  - [x] 6.3 Test: FeedbackOverlay displays explanation text from question data
  - [x] 6.4 Test: FeedbackOverlay displays source citation
  - [x] 6.5 Test: FeedbackOverlay shows correct answer when incorrect
  - [x] 6.6 Test: FeedbackOverlay shows points earned when correct
  - [x] 6.7 Test: useSound plays correct sound on correct answer (mock expo-av)
  - [x] 6.8 Test: useSound plays incorrect sound on incorrect answer
  - [x] 6.9 Test: useSound does NOT play when soundEnabled is false
  - [x] 6.10 Test: useSound preloads all three sounds on mount
  - [x] 6.11 Test: useSound unloads sounds on cleanup
  - [x] 6.12 Test: play.tsx shows FeedbackOverlay after answer submission
  - [x] 6.13 Test: play.tsx auto-advances after ~1 second feedback display
  - [x] 6.14 Test: play.tsx disables answer interaction during feedback
  - [x] 6.15 Test: feedback works for vocabulary exercise type
  - [x] 6.16 Test: feedback works for matching exercise type (per-pair) — N/A: MatchingExercise (Story 4.5) not yet implemented

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Action |
|------|-------|--------|
| `stores/useQuizStore.ts` | Has `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Stories 4.3-4.8 extend it with `quizPayload`, `getCurrentQuestion`, `isLastQuestion`, `placedTileIds`, `blankAnswers`, `selectedLeft`, `matchedPairs`, etc. | **EXTEND** with `showFeedback`, `feedbackIsCorrect`, `showFeedback()`, `hideFeedback()` -- do NOT rewrite existing fields |
| `stores/useSettingsStore.ts` | Has `soundEnabled: boolean` (default `true`) and `toggleSound()` action. Already wired for sound mute toggle. | **USE** -- read `soundEnabled` in `useSound` hook |
| `types/quiz.ts` | Full types: `ExerciseType` (8 types), `QuizQuestion` with `explanation: string` and `source_citation: string` fields, `QuizResponse`, `QuizGenerationError`. | **USE** as-is -- `explanation` and `source_citation` already exist on every question |
| `app/quiz/play.tsx` | Created by Story 4.3, extended by 4.4-4.8. Handles all 7 exercise types via switch/conditional rendering. Uses `AnimatePresence`, `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress`. Each exercise type has its own answer submission handler that calls `setAnswer()`, `addScore()`, and `nextQuestion()` after a delay. | **MODIFY** -- replace per-type feedback delays with unified FeedbackOverlay + useSound integration |
| `components/quiz/QuizQuestionCard.tsx` | Created by Story 4.3. Question display with `display` and `feedback` variants. | **REUSE** -- the `feedback` variant (`correct`/`incorrect` border) still applies; FeedbackOverlay adds the explanation layer on top |
| `components/quiz/AnswerOptionGrid.tsx` | Created by Story 4.3. Has `state` variant on `AnswerOption`: `default`, `selected`, `correct`, `incorrect`, `disabled`. | **USE** -- set options to `disabled` state during feedback |
| `components/quiz/MatchingExercise.tsx` | Created by Story 4.5. Has `// TODO: Story 4.9 -- play "ding" sound here` and `// TODO: Story 4.9 -- play "bonk" sound here` comments at trigger points. | **MODIFY** -- replace TODO comments with actual `playSound()` calls |
| `components/quiz/SentenceBuilder.tsx` | Created by Story 4.7. Per-tile correct/incorrect feedback already implemented. | **MODIFY** -- add FeedbackOverlay integration after tile validation |
| `components/quiz/DialogueCard.tsx` | Created by Story 4.6. Has success/error theme on filled bubble after validation. | **MODIFY** -- add FeedbackOverlay integration after validation |
| `components/quiz/WordBankSelector.tsx` | Created by Story 4.4. Per-blank correct/incorrect coloring. | **MODIFY** -- add FeedbackOverlay integration after all blanks validated |
| `tamagui.config.ts` | Full theme with `light`/`dark` + sub-themes `primary`, `success` (green), `error` (gentle orange), `warning`. Animation presets: `quick`, `bouncy`, `medium`, `slow`, `lazy`. Tokens: `$surface`, `$borderColor`, `$primary`, `$success`, `$error`, `$successBackground`, `$errorBackground`, `$colorSubtle`. | **USE** -- all tokens and presets available |
| `lib/supabase.ts` | Supabase client initialized. | **USE** as-is |

**What does NOT exist yet (must create):**

| File | Purpose |
|------|---------|
| `components/quiz/FeedbackOverlay.tsx` | Unified feedback overlay for all exercise types (correct/incorrect + explanation + citation) |
| `components/quiz/FeedbackOverlay.test.tsx` | Unit tests for FeedbackOverlay |
| `hooks/useSound.ts` | Sound effect hook using expo-av with preloading and mute toggle |
| `hooks/useSound.test.ts` | Unit tests for useSound hook |
| `assets/sounds/correct.mp3` | "Ding" sound effect (placeholder) |
| `assets/sounds/incorrect.mp3` | "Bonk" sound effect (placeholder) |
| `assets/sounds/celebration.mp3` | Celebration chime (placeholder, used by Story 4.11) |

### FeedbackOverlay Component Spec

The FeedbackOverlay is a **single component** used by ALL exercise types. It renders as an overlay at the bottom of the quiz screen, showing the result of the user's answer with explanation and source citation.

```tsx
// components/quiz/FeedbackOverlay.tsx
import { AnimatePresence, Theme, YStack, XStack, Text } from 'tamagui'
import { Check, X } from '@tamagui/lucide-icons'

interface FeedbackOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean
  /** Whether the answer was correct */
  isCorrect: boolean
  /** Pre-generated explanation from quiz payload */
  explanation: string
  /** Source citation (e.g., "Book 2, Chapter 12 - Grammar") */
  sourceCitation: string
  /** The correct answer (shown when incorrect) */
  correctAnswer?: string
  /** Points earned (shown when correct) */
  pointsEarned?: number
}

export function FeedbackOverlay({
  visible,
  isCorrect,
  explanation,
  sourceCitation,
  correctAnswer,
  pointsEarned,
}: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <Theme name={isCorrect ? 'success' : 'error'}>
          <YStack
            key="feedback-overlay"
            animation="quick"
            enterStyle={{ opacity: 0, scale: 0.8 }}
            exitStyle={{ opacity: 0 }}
            opacity={1}
            scale={1}
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={2}
            borderRadius={12}
            padding="$4"
            gap="$2"
            marginHorizontal="$4"
            marginBottom="$4"
            pointerEvents="none"
            testID="feedback-overlay"
          >
            {/* Icon + Result Header */}
            <XStack alignItems="center" gap="$2">
              {isCorrect ? (
                <Check size={24} color="$color" testID="feedback-check-icon" />
              ) : (
                <X size={24} color="$color" testID="feedback-x-icon" />
              )}
              <Text fontWeight="600" fontSize="$5" color="$color" testID="feedback-result-text">
                {isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
              {isCorrect && pointsEarned != null && (
                <Text
                  animation="bouncy"
                  enterStyle={{ scale: 0.5, opacity: 0 }}
                  fontWeight="700"
                  fontSize="$4"
                  color="$color"
                  marginLeft="auto"
                  testID="feedback-points"
                >
                  +{pointsEarned} pts
                </Text>
              )}
            </XStack>

            {/* Correct answer (shown when incorrect) */}
            {!isCorrect && correctAnswer && (
              <Theme name="success">
                <XStack
                  backgroundColor="$background"
                  borderRadius={8}
                  padding="$2"
                  testID="feedback-correct-answer"
                >
                  <Text fontSize="$4" color="$color" fontWeight="600">
                    {correctAnswer}
                  </Text>
                </XStack>
              </Theme>
            )}

            {/* Explanation */}
            <Text fontSize="$3" color="$color" testID="feedback-explanation">
              {explanation}
            </Text>

            {/* Source Citation */}
            <Text fontSize="$2" color="$colorPress" opacity={0.7} testID="feedback-citation">
              {sourceCitation}
            </Text>
          </YStack>
        </Theme>
      )}
    </AnimatePresence>
  )
}
```

**Key design decisions:**
- Uses `<Theme name="success">` / `<Theme name="error">` so all `$background`, `$color`, `$borderColor` tokens resolve automatically to the correct sub-theme values (green for success, gentle orange for error)
- `pointerEvents="none"` prevents accidental taps on the overlay during the 1-second display
- Correct answer is shown inside a nested `<Theme name="success">` block even when the outer theme is `error`, so it always appears green
- Points earned uses `animation="bouncy"` with `enterStyle` for a satisfying pop-in effect
- The overlay is positioned at the bottom of the quiz layout, not as a full-screen modal

### Explanation Display Pattern

Every `QuizQuestion` in the quiz payload already has `explanation` and `source_citation` fields pre-generated by the LangGraph agent:

```typescript
// From types/quiz.ts -- already exists
interface QuizQuestion {
  question_id: string
  exercise_type: ExerciseType
  question_text: string
  correct_answer: string
  explanation: string        // <-- Pre-generated by LLM, e.g., "This uses the 把 construction because..."
  source_citation: string    // <-- e.g., "Book 2, Chapter 12 - Grammar"
  options?: string[]
  character?: string
  pinyin?: string
}
```

The FeedbackOverlay reads these fields directly from the current question. No additional API calls are needed for explanations -- they are pre-generated during quiz generation (Story 4.1).

**Explanation examples by exercise type:**
- Vocabulary: "咖啡 (kāfēi) means 'coffee'. It's a loanword from the English word 'coffee'."
- Grammar: "This uses the 把 construction because the object is being acted upon directly."
- Fill-in-blank: "The correct word is 很 because adverbs of degree precede adjectives in Chinese."
- Matching: "你好 (nǐ hǎo) literally means 'you good' and is the standard greeting."
- Dialogue: "In this context, 沒關係 is the appropriate response to an apology."
- Sentence Construction: "The adverb 很 comes before the verb 喜歡 in Chinese word order."
- Reading Comprehension: "The passage states that the character went to the library, making option B correct."

### useSound Hook Pattern (expo-av)

```typescript
// hooks/useSound.ts
import { Audio } from 'expo-av'
import { useSettingsStore } from '../stores/useSettingsStore'

/** Available sound effect names */
export type SoundName = 'correct' | 'incorrect' | 'celebration'

/** Map of sound names to their asset require paths */
const SOUND_ASSETS: Record<SoundName, number> = {
  correct: require('../assets/sounds/correct.mp3'),
  incorrect: require('../assets/sounds/incorrect.mp3'),
  celebration: require('../assets/sounds/celebration.mp3'),
}

/** Module-level cache for loaded Audio.Sound instances */
const soundCache = new Map<SoundName, Audio.Sound>()

/**
 * Preload all sound assets into memory.
 * Call once on app/quiz screen mount. Non-blocking -- errors are logged, not thrown.
 */
export async function preloadSounds(): Promise<void> {
  // Respect device silent mode (do not override)
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
  })

  const entries = Object.entries(SOUND_ASSETS) as [SoundName, number][]
  await Promise.all(
    entries.map(async ([name, asset]) => {
      try {
        if (soundCache.has(name)) return
        const { sound } = await Audio.Sound.createAsync(asset)
        soundCache.set(name, sound)
      } catch (err) {
        console.warn(`Failed to preload sound "${name}":`, err)
      }
    }),
  )
}

/**
 * Play a named sound effect.
 * Checks soundEnabled setting before playing. Rewinds to start before each play.
 */
export async function playSound(name: SoundName): Promise<void> {
  const soundEnabled = useSettingsStore.getState().soundEnabled
  if (!soundEnabled) return

  const sound = soundCache.get(name)
  if (!sound) return

  try {
    await sound.setPositionAsync(0)
    await sound.playAsync()
  } catch (err) {
    console.warn(`Failed to play sound "${name}":`, err)
  }
}

/**
 * Unload all cached sounds to free memory.
 * Call on quiz screen unmount.
 */
export async function unloadSounds(): Promise<void> {
  const entries = Array.from(soundCache.entries())
  await Promise.all(
    entries.map(async ([name, sound]) => {
      try {
        await sound.unloadAsync()
        soundCache.delete(name)
      } catch (err) {
        console.warn(`Failed to unload sound "${name}":`, err)
      }
    }),
  )
}

/**
 * Hook for sound effect management in quiz screens.
 *
 * Usage:
 * ```tsx
 * function QuizPlayScreen() {
 *   const { playSound } = useSound()
 *
 *   useEffect(() => {
 *     preloadSounds()
 *     return () => { unloadSounds() }
 *   }, [])
 *
 *   const handleAnswer = (isCorrect: boolean) => {
 *     playSound(isCorrect ? 'correct' : 'incorrect')
 *   }
 * }
 * ```
 */
export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  return {
    playSound,
    preloadSounds,
    unloadSounds,
    soundEnabled,
  }
}
```

**Key design decisions:**
- `preloadSounds()` and `unloadSounds()` are exported as standalone functions (not just from the hook) so they can be called in `useEffect` without dependency issues
- `playSound()` reads `soundEnabled` from `useSettingsStore.getState()` (non-reactive) at call time -- this is correct because we want the check at play time, not at render time
- `playsInSilentModeIOS: false` respects the device silent mode switch -- sounds will NOT play when the iPhone is on silent
- Module-level `soundCache` avoids re-creating `Audio.Sound` instances on every render
- All async operations are wrapped in try/catch with `console.warn` -- sound failures must never crash the quiz

### Sound Asset Management

| Sound | File | Character | Duration | Notes |
|-------|------|-----------|----------|-------|
| Correct | `assets/sounds/correct.mp3` | Bright, satisfying "ding" | ~200ms | Short, clear, positive |
| Incorrect | `assets/sounds/incorrect.mp3` | Soft, gentle "bonk" | ~200ms | Not harsh, not punitive |
| Celebration | `assets/sounds/celebration.mp3` | Celebratory chime | ~500ms | Used by Story 4.11 CompletionScreen |

**Placeholder strategy:** For initial development, create minimal valid MP3 files (can be silent or very short tones). Replace with proper sound design assets before release. The code structure supports hot-swapping assets without code changes.

**Sound events mapping:**

| Event | Sound | Trigger Point |
|-------|-------|---------------|
| Correct answer (any type) | `correct` | `play.tsx` answer handler, after `showFeedback(true)` |
| Incorrect answer (any type) | `incorrect` | `play.tsx` answer handler, after `showFeedback(false)` |
| Correct match pair (matching) | `correct` | `MatchingExercise` on correct pair |
| Incorrect match pair (matching) | `incorrect` | `MatchingExercise` on incorrect pair |
| Quiz completion | `celebration` | Story 4.11 CompletionScreen (not this story) |

### Feedback Integration Per Exercise Type

The FeedbackOverlay is rendered ONCE in `play.tsx` and works for all exercise types. Each type's existing answer handler is modified to trigger the overlay instead of handling feedback independently.

| Exercise Type | Current Feedback (Stories 4.3-4.8) | New Feedback (This Story) | What Changes |
|---------------|-------------------------------------|---------------------------|--------------|
| Vocabulary/Grammar | `AnswerOption` state changes to `correct`/`incorrect` + 1s delay before `nextQuestion()` | **Keep** option state changes + **Add** FeedbackOverlay with explanation + sound | Replace `setTimeout(nextQuestion, 1000)` with `showFeedback()` + sound + 1s auto-advance |
| Fill-in-the-Blank | Per-blank `correct`/`incorrect` coloring on `FillInBlankSentence` + 1s delay | **Keep** per-blank coloring + **Add** FeedbackOverlay with explanation + sound | Replace delay with unified feedback flow |
| Matching | Per-pair `matched`/`incorrect` state + `// TODO: Story 4.9` comments | **Keep** per-pair visual feedback + **Add** sound on each pair + FeedbackOverlay after all pairs matched | Replace TODO comments with `playSound()` calls; add overlay on completion |
| Dialogue Completion | Filled bubble success/error theme + explanation display | **Keep** bubble theme + **Add** FeedbackOverlay with explanation + sound | Unify explanation display into FeedbackOverlay |
| Sentence Construction | Per-tile `correct`/`incorrect` state + correct sentence shown | **Keep** per-tile feedback + **Add** FeedbackOverlay with explanation + sound | Unify explanation display into FeedbackOverlay |
| Reading Comprehension | Same as Vocabulary/Grammar (multiple choice) | Same as Vocabulary/Grammar | Same changes |

**Matching exercise special case:** Matching has per-pair feedback (sound on each pair match/mismatch) AND a final FeedbackOverlay when all pairs are matched. The per-pair sounds play immediately on each pair evaluation. The FeedbackOverlay appears only after all pairs are matched, showing the overall explanation.

### Auto-Advance Logic

```typescript
// In app/quiz/play.tsx -- unified answer handler pattern
const FEEDBACK_DISPLAY_MS = 1_000 // 1 second

function handleAnswerResult(isCorrect: boolean) {
  // 1. Update quiz store
  setAnswer(currentQuestion, userAnswer)
  if (isCorrect) addScore(POINTS_PER_CORRECT)

  // 2. Show feedback overlay + play sound (simultaneously)
  showFeedback(isCorrect)
  playSound(isCorrect ? 'correct' : 'incorrect')

  // 3. Auto-advance after 1 second
  const timer = setTimeout(() => {
    hideFeedback()
    if (isLastQuestion) {
      // Navigate to completion (Story 4.11 placeholder)
      router.replace('/quiz/results')
    } else {
      nextQuestion()
    }
  }, FEEDBACK_DISPLAY_MS)

  // Cleanup on unmount
  return () => clearTimeout(timer)
}
```

**Timing requirements:**
- Feedback appears <100ms after tap (synchronous state update + sound play)
- Sound plays simultaneously with visual feedback (both triggered in same handler)
- 1-second hold before auto-advance to next question
- User cannot tap during feedback animation (`pointerEvents="none"` on overlay + `disabled` prop on exercise components)
- Points increment visible on correct answer (rendered in FeedbackOverlay with `animation="bouncy"`)

**Auto-advance cleanup:** The `setTimeout` must be cleaned up if the component unmounts during the feedback period (e.g., user force-quits). Use a `useRef` to store the timer ID and clear it in a `useEffect` cleanup.

```typescript
// Pattern for safe auto-advance timer
const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if (showFeedbackState) {
    feedbackTimerRef.current = setTimeout(() => {
      hideFeedback()
      if (isLastQuestion) {
        router.replace('/quiz/results')
      } else {
        nextQuestion()
      }
    }, FEEDBACK_DISPLAY_MS)
  }

  return () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
  }
}, [showFeedbackState])
```

### Tamagui Animation Patterns

**FeedbackOverlay entrance:**

```tsx
<AnimatePresence>
  {visible && (
    <Theme name={isCorrect ? 'success' : 'error'}>
      <YStack
        key="feedback-overlay"
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.8 }}
        exitStyle={{ opacity: 0 }}
        // ... rest of overlay
      />
    </Theme>
  )}
</AnimatePresence>
```

**Points earned pop-in:**

```tsx
{isCorrect && pointsEarned != null && (
  <Text
    animation="bouncy"
    enterStyle={{ scale: 0.5, opacity: 0 }}
    fontWeight="700"
    fontSize="$4"
    color="$color"
  >
    +{pointsEarned} pts
  </Text>
)}
```

**Correct answer reveal (inside error-themed overlay):**

```tsx
{!isCorrect && correctAnswer && (
  <Theme name="success">
    <XStack
      backgroundColor="$background"
      borderRadius={8}
      padding="$2"
    >
      <Text fontSize="$4" color="$color" fontWeight="600">
        {correctAnswer}
      </Text>
    </XStack>
  </Theme>
)}
```

### Tamagui Rules (MUST follow)

- **NEVER** hardcode hex values. Use `$tokenName` references (`$primary`, `$background`, `$success`, `$error`, `$borderColor`, `$surface`, `$successBackground`, `$errorBackground`, `$colorSubtle`, etc.)
- **ALWAYS** use `<Theme name="success">` or `<Theme name="error">` for contextual color contexts -- not manual color props
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="bouncy"`, `animation="medium"`) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations (FeedbackOverlay show/hide)
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs={{ fontSize: 14 }}`) not `Dimensions.get('window')`
- **NEVER** use `Animated` from React Native -- use Tamagui declarative animations
- **NEVER** create barrel `index.ts` files -- import directly from each component file

### Anti-Patterns to Avoid

1. **DO NOT** create separate feedback screens per exercise type -- ONE `FeedbackOverlay` for all types, rendered once in `play.tsx`
2. **DO NOT** use raw Reanimated for the overlay -- use Tamagui `AnimatePresence` with `enterStyle`/`exitStyle`
3. **DO NOT** skip sound on incorrect answers -- always play the "bonk" sound (unless muted via `soundEnabled`)
4. **DO NOT** use red for incorrect -- use gentle orange (`$error` = `#FB923C`). The `<Theme name="error">` sub-theme already resolves to orange, not red
5. **DO NOT** block the main thread with sound loading -- preload sounds asynchronously on quiz screen mount, not on app start
6. **DO NOT** save quiz results to Supabase -- that's Story 4.10 (Quiz Progress Saving)
7. **DO NOT** create a CompletionScreen -- that's Story 4.11 (Quiz Results Screen)
8. **DO NOT** use `setInterval` for the auto-advance timer -- use `setTimeout` with `useRef` cleanup
9. **DO NOT** play sounds synchronously -- all `expo-av` calls are async; fire-and-forget with error handling
10. **DO NOT** create a `SoundManager` class -- use the functional `useSound` hook pattern with module-level cache
11. **DO NOT** hardcode hex colors anywhere in FeedbackOverlay -- use Tamagui tokens exclusively
12. **DO NOT** use `React.useState` for feedback visibility -- use `useQuizStore` (Zustand) so all exercise type handlers can trigger it
13. **DO NOT** render FeedbackOverlay inside each exercise component -- render it ONCE in `play.tsx` above all exercise types
14. **DO NOT** override `playsInSilentModeIOS: true` -- respect the device silent mode switch

### Dependencies on Other Stories

- **Depends on:** Story 4.3 (Vocabulary Quiz) -- creates `play.tsx`, `QuizQuestionCard`, `AnswerOptionGrid`, `QuizProgress`, extends `useQuizStore` with `quizPayload`. **Status: ready-for-dev**
- **Depends on:** Story 4.4 (Fill-in-the-Blank) -- creates `WordBankSelector`, `FillInBlankSentence`. **Status: ready-for-dev**
- **Depends on:** Story 4.5 (Matching) -- creates `MatchingExercise` with TODO comments for sound. **Status: ready-for-dev**
- **Depends on:** Story 4.6 (Dialogue Completion) -- creates `DialogueCard`, `useAnswerValidation`. **Status: ready-for-dev**
- **Depends on:** Story 4.7 (Sentence Construction) -- creates `SentenceBuilder`. **Status: ready-for-dev**
- **Depends on:** Story 4.8 (Reading Comprehension) -- creates `ReadingPassageCard`. **Status: (no story file yet)**
- **Depends on:** Story 4.2 (Loading Screen) -- `lib/api.ts`, `types/quiz.ts`, `hooks/useQuizGeneration.ts`. **Status: done**
- **Depends on:** Story 1.1b (Tamagui Theme) -- sub-themes `success`, `error` for feedback colors. **Status: review**
- **Depends on:** Story 1.5 (TanStack + Zustand) -- state management infrastructure. **Status: done**
- **Enables:** Story 4.10 (Progress Saving) -- saves per-question results to Supabase after feedback
- **Enables:** Story 4.11 (Results Screen) -- uses `celebration` sound, builds on feedback patterns

**All exercise type stories (4.3-4.8) MUST be implemented before this story.** This story modifies `play.tsx` to add the unified feedback layer across all exercise types. If any exercise type is missing from `play.tsx`, the feedback integration for that type will be incomplete.

### Testing Approach

```bash
# Run tests for this story
npx jest components/quiz/FeedbackOverlay hooks/useSound stores/useQuizStore --verbose

# Type checking
npx tsc

# Linting
npx eslint components/quiz/FeedbackOverlay.tsx hooks/useSound.ts stores/useQuizStore.ts --ext .ts,.tsx
```

**Mock expo-av for tests:**

```typescript
// In test setup or at top of test file
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          setPositionAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}))
```

**Mock quiz data for tests:**

```typescript
const mockCorrectQuestion: QuizQuestion = {
  question_id: 'vocab-1',
  exercise_type: 'vocabulary',
  question_text: 'What does 咖啡 mean?',
  correct_answer: 'coffee',
  explanation: '咖啡 (kāfēi) is a loanword from English meaning "coffee".',
  source_citation: 'Book 1, Chapter 8 - Vocabulary',
  options: ['coffee', 'tea', 'water', 'juice'],
  character: '咖啡',
  pinyin: 'kāfēi',
}

const mockIncorrectFeedback = {
  visible: true,
  isCorrect: false,
  explanation: 'The adverb 很 comes before the verb 喜歡 in Chinese.',
  sourceCitation: 'Book 2, Chapter 12 - Grammar',
  correctAnswer: '我很喜歡咖啡。',
}

const mockCorrectFeedback = {
  visible: true,
  isCorrect: true,
  explanation: '咖啡 (kāfēi) is a loanword from English meaning "coffee".',
  sourceCitation: 'Book 1, Chapter 8 - Vocabulary',
  pointsEarned: 10,
}
```

**Key test scenarios:**

1. **FeedbackOverlay renders correct state:** success theme, checkmark icon, explanation, citation, points
2. **FeedbackOverlay renders incorrect state:** error theme, X icon, explanation, citation, correct answer in green
3. **FeedbackOverlay hidden when `visible` is false:** nothing rendered
4. **FeedbackOverlay uses AnimatePresence:** enter/exit animations triggered
5. **useSound preloads all sounds:** `Audio.Sound.createAsync` called 3 times
6. **useSound plays correct sound:** `playAsync` called on correct sound instance
7. **useSound respects mute:** when `soundEnabled` is false, `playAsync` is NOT called
8. **useSound handles errors gracefully:** failed `playAsync` logs warning, doesn't throw
9. **useSound unloads on cleanup:** `unloadAsync` called on all cached sounds
10. **useQuizStore feedback state:** `showFeedback(true)` sets `showFeedback: true` and `feedbackIsCorrect: true`
11. **useQuizStore hideFeedback:** resets `showFeedback: false` and `feedbackIsCorrect: null`
12. **useQuizStore resetQuiz clears feedback:** feedback state reset when quiz resets
13. **play.tsx integration:** answer submission triggers FeedbackOverlay + sound
14. **play.tsx auto-advance:** after 1 second, feedback hides and next question loads
15. **play.tsx disables interaction:** exercise components receive `disabled` during feedback

### File Structure

```
dangdai-mobile/
├── app/quiz/
│   └── play.tsx                              # MODIFY: integrate FeedbackOverlay + useSound for all exercise types
├── assets/sounds/
│   ├── correct.mp3                           # CREATE: "ding" sound placeholder
│   ├── incorrect.mp3                         # CREATE: "bonk" sound placeholder
│   └── celebration.mp3                       # CREATE: celebration chime placeholder (for Story 4.11)
├── components/quiz/
│   ├── FeedbackOverlay.tsx                   # CREATE: unified feedback overlay component
│   ├── FeedbackOverlay.test.tsx              # CREATE: unit tests
│   ├── MatchingExercise.tsx                  # MODIFY: replace TODO comments with playSound() calls
│   ├── SentenceBuilder.tsx                   # MODIFY: integrate FeedbackOverlay trigger
│   ├── DialogueCard.tsx                      # MODIFY: integrate FeedbackOverlay trigger
│   └── WordBankSelector.tsx                  # MODIFY: integrate FeedbackOverlay trigger
├── hooks/
│   ├── useSound.ts                           # CREATE: sound effect hook with expo-av
│   └── useSound.test.ts                      # CREATE: unit tests
└── stores/
    └── useQuizStore.ts                       # MODIFY: add showFeedback, feedbackIsCorrect, showFeedback(), hideFeedback()
```

### Previous Story Intelligence

**From Story 4.3 (Vocabulary Quiz -- ready-for-dev):**
- Creates `app/quiz/play.tsx` with exercise type switching and `AnimatePresence` for question transitions
- Answer handler pattern: tap option -> validate locally -> set `correct`/`incorrect` state on option -> `setTimeout(nextQuestion, 1000)` -- this story replaces the `setTimeout` with the unified feedback flow
- `QuizQuestionCard` has `feedback` variant (`correct`/`incorrect` border) -- keep this, FeedbackOverlay adds explanation on top
- `AnswerOptionGrid` has `disabled` state variant -- use this to disable options during feedback

**From Story 4.4 (Fill-in-the-Blank -- ready-for-dev):**
- Per-blank validation with `correct`/`incorrect` coloring -- keep this visual feedback
- Auto-submit when all blanks filled, then 1s delay before advance -- replace delay with FeedbackOverlay

**From Story 4.5 (Matching -- ready-for-dev):**
- Has `// TODO: Story 4.9 -- play "ding" sound here` and `// TODO: Story 4.9 -- play "bonk" sound here` comments
- Per-pair feedback is immediate (not deferred to overlay) -- add `playSound()` at these TODO points
- FeedbackOverlay appears only after ALL pairs are matched, showing overall explanation

**From Story 4.6 (Dialogue Completion -- ready-for-dev):**
- Uses `useAnswerValidation` hook for hybrid local + LLM validation
- Shows explanation inline after validation -- migrate explanation display to FeedbackOverlay
- Has `// TODO: Story 4.9` comment for sound integration

**From Story 4.7 (Sentence Construction -- ready-for-dev):**
- Per-tile `correct`/`incorrect` feedback after validation -- keep this
- Shows correct sentence below answer area when incorrect -- keep this, FeedbackOverlay adds explanation
- Has `// TODO: Story 4.9` comment for sound integration

**From architecture.md:**
- `expo-av` is listed as a required dependency for sound playback
- `hooks/useSound.ts` is in the planned project structure
- `components/quiz/FeedbackOverlay.tsx` is in the planned project structure
- Sub-themes `success` and `error` are designed specifically for FeedbackOverlay usage

**From UX spec:**
- FeedbackOverlay uses `AnimatePresence` with `enterStyle: { opacity: 0, scale: 0.8 }` for pop-in
- Sound integration: correct = "ding", incorrect = "bonk" (not harsh)
- Feedback appears <100ms after tap, 1-second hold before auto-advance
- User cannot tap during feedback animation
- Points increment visible on correct answer
- All exercise types share common feedback patterns (sound, color, animation timing)

### References

- [Source: epics.md#Story-4.9] - Story requirements and acceptance criteria
- [Source: architecture.md#Sound] - `expo-av` for quiz feedback sounds
- [Source: architecture.md#Sub-Theme-Architecture] - `success` and `error` sub-themes for FeedbackOverlay
- [Source: architecture.md#Declarative-Animation-Pattern] - AnimatePresence for FeedbackOverlay appearance/disappearance
- [Source: architecture.md#Project-Structure] - `FeedbackOverlay.tsx` and `useSound.ts` planned locations
- [Source: ux-design-specification.md#FeedbackOverlay] - Component anatomy, animation spec, sound integration
- [Source: ux-design-specification.md#Feedback-Patterns] - Answer feedback table (correct/incorrect visual + sound + duration)
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Common patterns across all types (100ms feedback, 1s hold, sound, progress bar)
- [Source: ux-design-specification.md#AnimatePresence-for-Conditional-Rendering] - FeedbackOverlay entrance/exit animation spec
- [Source: ux-design-specification.md#Reduced-Motion] - Respect prefers-reduced-motion, sound still works
- [Source: 4-3-vocabulary-quiz-question-display.md] - Play screen structure, answer handler pattern, AnswerOptionGrid disabled state
- [Source: 4-4-fill-in-the-blank-exercise.md] - "DO NOT implement sound effects -- that's Story 4.9"
- [Source: 4-5-matching-exercise.md] - TODO comments for sound at trigger points
- [Source: 4-6-dialogue-completion-exercise.md] - "Enables Story 4.9 -- will add sound effects and FeedbackOverlay"
- [Source: 4-7-sentence-construction-exercise.md] - "DO NOT implement sound effects -- that's Story 4.9"
- [Source: stores/useSettingsStore.ts] - `soundEnabled` boolean and `toggleSound()` action
- [Source: stores/useQuizStore.ts] - Current quiz state structure to extend
- [Source: tamagui.config.ts] - Animation presets, sub-theme definitions, color tokens
- [Source: prd.md#FR23] - User receives immediate feedback per answer with correct answer shown
- [Source: prd.md#FR24] - Feedback includes explanation and source citation (pre-generated)
- [Source: prd.md#NFR2] - 500ms screen navigation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
