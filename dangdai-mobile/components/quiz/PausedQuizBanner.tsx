/**
 * PausedQuizBanner Component
 *
 * Banner shown on the Exercise Type Selection screen when the user has a paused quiz
 * for the selected exercise type. Displays pause info and provides Resume/Discard actions.
 *
 * If no paused quiz exists for the given chapter/exercise type, renders null.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 9
 */

import { YStack, XStack, Text, Button, Card } from 'tamagui'
import { Pause, Play, Trash2 } from '@tamagui/lucide-icons'

import { usePausedQuiz } from '../../hooks/usePausedQuiz'
import { usePauseQuiz } from '../../hooks/usePauseQuiz'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType } from '../../types/quiz'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a timestamp as a human-readable "X hours/minutes ago" string.
 * Simple implementation without date-fns dependency.
 */
function formatTimeAgo(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PausedQuizBannerProps {
  /** Chapter ID to check for paused quiz */
  chapterId: number
  /** Exercise type to check for paused quiz */
  exerciseType: string
  /** Called when user taps "Resume" */
  onResume: () => void
  /** Called after user discards the paused quiz */
  onDiscard: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PausedQuizBanner — shown when a paused quiz exists for the chapter/exercise type.
 *
 * Renders null when no paused quiz exists.
 * Shows pause icon, exercise type label, progress, timestamp, and Resume/Discard buttons.
 */
export function PausedQuizBanner({
  chapterId,
  exerciseType,
  onResume,
  onDiscard,
}: PausedQuizBannerProps) {
  const { data: pausedQuiz, isLoading } = usePausedQuiz(chapterId, exerciseType)
  const { deletePausedQuiz, deletePausedQuizMutation } = usePauseQuiz()

  // Don't render while loading or if no paused quiz exists
  if (isLoading || !pausedQuiz) return null

  const quizState = pausedQuiz.quiz_state
  const answeredCount = Object.keys(quizState.answers).length
  const totalCount = quizState.questions.length
  const exerciseLabel =
    EXERCISE_TYPE_LABELS[exerciseType as ExerciseType] ?? exerciseType
  const timeAgo = formatTimeAgo(pausedQuiz.paused_at)

  const handleDiscard = async () => {
    try {
      await deletePausedQuiz({ chapterId, exerciseType })
      onDiscard()
    } catch (err) {
      console.warn('[PausedQuizBanner] Failed to discard paused quiz:', err)
    }
  }

  return (
    <Card
      animation="quick"
      enterStyle={{ y: -100, opacity: 0 }}
      bordered
      padding="$4"
      marginBottom="$4"
      borderRadius="$4"
      backgroundColor="$blue2"
      borderColor="$blue6"
      testID="paused-quiz-banner"
    >
      <YStack gap="$3">
        {/* Header row: icon + title */}
        <XStack alignItems="center" gap="$2">
          <Pause size={20} color="$blue10" testID="paused-quiz-banner-icon" />
          <YStack flex={1}>
            <Text fontSize="$5" fontWeight="600" color="$blue11" testID="paused-quiz-banner-title">
              Paused {exerciseLabel} quiz
            </Text>
            <Text fontSize="$3" color="$blue9" testID="paused-quiz-banner-progress">
              {answeredCount}/{totalCount} complete • {timeAgo}
            </Text>
          </YStack>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$3">
          {/* Resume button — primary action */}
          <Button
            flex={1}
            size="$4"
            theme="blue"
            icon={<Play size={16} />}
            onPress={onResume}
            pressStyle={{ scale: 0.98 }}
            animation="quick"
            testID="paused-quiz-resume-button"
          >
            Resume
          </Button>

          {/* Discard button — ghost/chromeless */}
          <Button
            size="$4"
            chromeless
            icon={<Trash2 size={16} color="$colorSubtle" />}
            onPress={() => { void handleDiscard() }}
            disabled={deletePausedQuizMutation.isPending}
            pressStyle={{ scale: 0.98 }}
            animation="quick"
            testID="paused-quiz-discard-button"
          >
            Discard
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
