/**
 * FeedbackOverlay Component
 *
 * Unified feedback overlay shown after every quiz answer submission.
 * Appears at the bottom of the quiz screen for all exercise types.
 *
 * Design decisions:
 * - Uses <Theme name="success"> / <Theme name="error"> so all color tokens
 *   resolve automatically to the correct sub-theme values
 * - pointerEvents="none" prevents accidental taps on the overlay during 1s display
 * - Correct answer is shown inside nested <Theme name="success"> even within error theme
 * - Points earned uses animation="bouncy" for a satisfying pop-in effect
 * - AnimatePresence with enterStyle/exitStyle for smooth appearance/disappearance
 *
 * Story 4.9: Immediate Answer Feedback — Task 3
 */

import { AnimatePresence, Theme, YStack, XStack, Text } from 'tamagui'
import { Check, X } from '@tamagui/lucide-icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackOverlayProps {
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

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FeedbackOverlay renders the answer feedback for all exercise types.
 * Rendered ONCE in play.tsx, not inside individual exercise components.
 */
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
