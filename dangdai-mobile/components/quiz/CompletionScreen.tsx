/**
 * CompletionScreen Component
 *
 * Main quiz results/celebration screen shown after the last question is answered.
 * Rendered conditionally inside play.tsx when useQuizStore.isComplete === true.
 * NOT a separate route — it's a component toggled via AnimatePresence.
 *
 * Screen anatomy (per UX spec):
 * 1. 🎉 Celebration emoji — bouncy entrance animation
 * 2. "Exercise Complete!" title — medium animation
 * 3. PointsCounter — count-up from 0 to earned points (~1.5s)
 * 4. Stats card — score (X/Y correct, Z%) and time taken
 * 5. "CHAPTER X PROGRESS" — ExerciseTypeProgressList for all 7 types
 * 6. "FOCUS AREAS UPDATE" — weakness summary (pre vs post quiz accuracy)
 * 7. "YOU STRUGGLED WITH:" — missed items (only when incorrect answers exist)
 * 8. "Continue" button — navigates back to exercise type selection or dashboard
 *
 * On mount: calls updateExerciseTypeProgress mutation to upsert the just-completed
 * exercise type's progress in Supabase. Query refetch shows updated progress bars.
 *
 * Tamagui patterns:
 * - AnimatePresence wraps the screen for enter/exit animation
 * - All colors use token references ($primary, $success, $secondary, $colorSubtle)
 * - Named animation presets only (bouncy, medium, slow)
 * - <Theme name="success"> for improvements, neutral for declines
 * - NEVER <Theme name="error"> for weakness areas (encouraging framing always)
 *
 * Story 4.11: Quiz Results Screen — Task 5
 */

import { useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'
import {
  AnimatePresence,
  YStack,
  XStack,
  Text,
  Button,
  Theme,
  Card,
  Separator,
} from 'tamagui'

import type { ExerciseType } from '../../types/quiz'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import { PointsCounter } from './PointsCounter'
import { ExerciseTypeProgressList } from './ExerciseTypeProgressList'
import { useExerciseTypeProgress, useUpdateExerciseTypeProgress } from '../../hooks/useExerciseTypeProgress'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncorrectItem {
  /** The question text */
  questionText: string
  /** The user's answer */
  userAnswer: string
  /** The correct answer */
  correctAnswer: string
  /** Optional Chinese character context */
  character?: string
}

export interface WeaknessData {
  item: string
  previousAccuracy: number
}

export interface PostQuizWeaknessData {
  item: string
  currentAccuracy: number
}

export interface CompletionScreenProps {
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
  /** Points earned this quiz (correctCount * pointsPerCorrect) */
  pointsEarned: number
  /** Quiz duration in minutes (from useQuizStore.getQuizDuration()) */
  durationMinutes: number
  /** Incorrect answer details for "You struggled with" section */
  incorrectItems: IncorrectItem[]
  /** Pre-quiz weakness data for comparison */
  preQuizWeaknesses?: WeaknessData[]
  /** Post-quiz weakness data (computed after quiz) */
  postQuizWeaknesses?: PostQuizWeaknessData[]
  /** Called when user taps Continue */
  onContinue: () => void
  /** testID for testing */
  testID?: string
}

// ─── Internal sub-components ──────────────────────────────────────────────────

interface WeaknessChange {
  item: string
  previousAccuracy: number
  currentAccuracy: number
  trend: 'improving' | 'stable' | 'declining'
  message: string
}

/** Compute weakness changes from pre/post quiz data */
function computeWeaknessChanges(
  preQuiz: WeaknessData[],
  postQuiz: PostQuizWeaknessData[]
): WeaknessChange[] {
  return postQuiz.map((post) => {
    const pre = preQuiz.find((p) => p.item === post.item)
    const curr = post.currentAccuracy

    // If no pre-quiz data exists for this item, we have no baseline to compare against.
    // Treat as 'stable' (no trend) rather than computing a delta from an assumed 0%,
    // which would misleadingly show "Getting stronger!" for any non-zero score.
    if (!pre) {
      return {
        item: post.item,
        previousAccuracy: curr,
        currentAccuracy: curr,
        trend: 'stable',
        message: 'First attempt — keep going!',
      }
    }

    const prev = pre.previousAccuracy
    const delta = curr - prev

    let trend: WeaknessChange['trend']
    let message: string

    if (delta > 5) {
      trend = 'improving'
      message = 'Getting stronger!'
    } else if (delta < -5) {
      trend = 'declining'
      message = 'Keep practicing!' // Encouraging, not harsh
    } else {
      trend = 'stable'
      message = 'Holding steady'
    }

    return { item: post.item, previousAccuracy: prev, currentAccuracy: curr, trend, message }
  })
}

/** Stats card: score and time */
function StatsCard({
  correctCount,
  totalQuestions,
  scorePercent,
  durationMinutes,
}: {
  correctCount: number
  totalQuestions: number
  scorePercent: number
  durationMinutes: number
}) {
  return (
    <Card
      animation="medium"
      enterStyle={{ opacity: 0 }}
      padding="$4"
      borderRadius="$4"
      backgroundColor="$background"
      borderColor="$borderColor"
      borderWidth={1}
      width="100%"
      testID="stats-card"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" color="$color" testID="stats-score">
          {correctCount}/{totalQuestions} correct — {scorePercent}%
        </Text>
        <Text fontSize="$3" color="$colorSubtle" testID="stats-time">
          {durationMinutes} min
        </Text>
      </XStack>
    </Card>
  )
}

/** Weakness summary update section */
function WeaknessSummary({
  preQuiz,
  postQuiz,
}: {
  preQuiz?: WeaknessData[]
  postQuiz?: PostQuizWeaknessData[]
}) {
  if (!preQuiz || !postQuiz || preQuiz.length === 0 || postQuiz.length === 0) {
    return null
  }

  const changes = computeWeaknessChanges(preQuiz, postQuiz)
  if (changes.length === 0) return null

  return (
    <YStack gap="$2" width="100%" testID="weakness-summary">
      <Text
        fontSize="$3"
        fontWeight="600"
        color="$colorSubtle"
        letterSpacing={1}
        textTransform="uppercase"
      >
        Focus Areas Update
      </Text>

      {changes.map((change) => {
        const isImproving = change.trend === 'improving'

        const content = (
          <XStack
            key={change.item}
            gap="$2"
            alignItems="center"
            animation="medium"
            enterStyle={{ opacity: 0, y: 10 }}
            testID={`weakness-item-${change.item.replace(/\s/g, '-')}`}
          >
            <Text fontSize="$3" color="$color">
              {change.item}: {change.previousAccuracy}% → {change.currentAccuracy}%
            </Text>
            <Text fontSize="$3">
              {change.trend === 'improving' ? '↑' : change.trend === 'declining' ? '↓' : '→'}
            </Text>
            <Text fontSize="$3" color={isImproving ? '$success' : '$colorSubtle'}>
              {change.message}
            </Text>
          </XStack>
        )

        if (isImproving) {
          return (
            <Theme key={change.item} name="success">
              {content}
            </Theme>
          )
        }

        return content
      })}
    </YStack>
  )
}

/** "You struggled with" section — only shown when there are incorrect answers */
function StruggledWithSection({ items }: { items: IncorrectItem[] }) {
  if (items.length === 0) return null

  return (
    <YStack gap="$2" width="100%" testID="struggled-with-section">
      <Text
        fontSize="$3"
        fontWeight="600"
        color="$colorSubtle"
        letterSpacing={1}
        textTransform="uppercase"
      >
        You struggled with:
      </Text>

      {items.map((item, index) => (
        <Card
          key={`${item.questionText}-${index}`}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          padding="$3"
          testID={`struggled-item-${index}`}
        >
          <Text fontSize="$3" color="$color" fontWeight="500">
            • {item.questionText}
          </Text>
          <XStack gap="$2" marginTop="$1">
            <Text fontSize="$2" color="$colorSubtle">
              Your answer: {item.userAnswer}
            </Text>
          </XStack>
          <XStack gap="$2">
            <Theme name="success">
              <Text fontSize="$2" color="$color">
                Correct: {item.correctAnswer}
              </Text>
            </Theme>
          </XStack>
        </Card>
      ))}
    </YStack>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * CompletionScreen — the quiz results and celebration screen.
 *
 * Rendered inside play.tsx via AnimatePresence when isComplete === true.
 * On mount, upserts exercise_type_progress in Supabase.
 */
export function CompletionScreen({
  chapterId,
  bookId,
  exerciseType,
  correctCount,
  totalQuestions,
  pointsEarned,
  durationMinutes,
  incorrectItems,
  preQuizWeaknesses,
  postQuizWeaknesses,
  onContinue,
  testID,
}: CompletionScreenProps) {
  const scorePercent = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0

  const { data: exerciseTypeProgress } = useExerciseTypeProgress(chapterId)
  const { mutate: updateProgress } = useUpdateExerciseTypeProgress()

  const exerciseTypeLabel = EXERCISE_TYPE_LABELS[exerciseType] ?? exerciseType
  const chapterNumber = chapterId % 100

  // Capture mount-time values in refs so the upsert useEffect always uses
  // the values that were current when the CompletionScreen first rendered,
  // even if props somehow change before the effect fires (e.g. StrictMode double-invoke).
  const mountParamsRef = useRef({ chapterId, bookId, exerciseType, score: scorePercent })

  // Upsert exercise_type_progress on mount (Task 5.12)
  // Intentionally fires once — progress is recorded for the quiz just completed.
  useEffect(() => {
    updateProgress(mountParamsRef.current)
  }, [updateProgress])

  return (
    <ScrollView
      testID={testID ?? 'completion-screen'}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <AnimatePresence>
        <YStack
          key="completion"
          animation="medium"
          enterStyle={{ opacity: 0, y: 50 }}
          exitStyle={{ opacity: 0, y: 50 }}
          padding="$4"
          gap="$4"
          alignItems="center"
        >
          {/* 1. Celebration emoji */}
          <Text
            fontSize={64}
            animation="bouncy"
            enterStyle={{ scale: 0, rotate: '-20deg' }}
            testID="celebration-emoji"
          >
            🎉
          </Text>

          {/* 2. "Exercise Complete!" title */}
          <Text
            fontSize="$8"
            fontWeight="bold"
            animation="medium"
            textAlign="center"
            color="$color"
            testID="completion-title"
          >
            Exercise Complete!
          </Text>

          {/* 3. Points count-up */}
          <PointsCounter
            points={pointsEarned}
            size="celebration"
            testID="points-counter"
          />

          {/* 4. Stats row: score and time */}
          <StatsCard
            correctCount={correctCount}
            totalQuestions={totalQuestions}
            scorePercent={scorePercent}
            durationMinutes={durationMinutes}
          />

          <Separator width="100%" />

          {/* 5. Per-exercise-type chapter progress */}
          <YStack gap="$2" width="100%">
            <Text
              fontSize="$3"
              fontWeight="600"
              color="$colorSubtle"
              letterSpacing={1}
              textTransform="uppercase"
              testID="chapter-progress-header"
            >
              Chapter {chapterNumber} Progress — {exerciseTypeLabel}
            </Text>

            <ExerciseTypeProgressList
              progress={exerciseTypeProgress}
              highlightType={exerciseType}
              testID="exercise-type-progress-list"
            />
          </YStack>

          {/* 6. Focus Areas Update / Weakness Summary */}
          <WeaknessSummary
            preQuiz={preQuizWeaknesses}
            postQuiz={postQuizWeaknesses}
          />

          {/* 7. "You Struggled With" section (only if incorrect answers) */}
          <StruggledWithSection items={incorrectItems} />

          {/* 8. Continue button */}
          <Button
            size="$5"
            theme="primary"
            animation="medium"
            enterStyle={{ opacity: 0, y: 10 }}
            focusStyle={{ borderColor: '$borderColorFocus' }}
            onPress={onContinue}
            width="100%"
            testID="continue-button"
          >
            Continue
          </Button>
        </YStack>
      </AnimatePresence>
    </ScrollView>
  )
}
