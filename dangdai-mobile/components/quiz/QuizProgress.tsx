/**
 * QuizProgress Component
 *
 * Displays quiz progress with:
 * - Animated progress bar (width transitions with "slow" animation)
 * - "X/Y" text counter showing current question position
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import { YStack, XStack, Text } from 'tamagui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizProgressProps {
  /** Current question number (1-based for display) */
  currentQuestion: number
  /** Total number of questions in the quiz */
  totalQuestions: number
  /** testID for the container */
  testID?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * QuizProgress renders a progress bar and question counter.
 * The progress bar uses "slow" animation for smooth transitions between questions.
 */
export function QuizProgress({
  currentQuestion,
  totalQuestions,
  testID = 'quiz-progress',
}: QuizProgressProps) {
  const progressPercent =
    totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0

  return (
    <YStack testID={testID} gap="$2" width="100%">
      <XStack justifyContent="space-between" alignItems="center">
        {/* Progress text: "X/Y" */}
        <Text
          fontSize="$3"
          color="$colorSubtle"
          fontWeight="500"
          testID="progress-text"
        >
          {currentQuestion}/{totalQuestions}
        </Text>
      </XStack>

      {/* Progress bar */}
      <YStack
        width="100%"
        height={6}
        backgroundColor="$borderColor"
        borderRadius={3}
        overflow="hidden"
        testID="progress-bar-container"
      >
        <YStack
          backgroundColor="$primary"
          height={6}
          borderRadius={3}
          animation="slow"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          width={`${progressPercent}%` as any}
          testID="progress-bar-fill"
        />
      </YStack>
    </YStack>
  )
}
