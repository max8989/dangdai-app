/**
 * QuizQuestionCard Component
 *
 * Displays a quiz question with Chinese character, pinyin, and question type label.
 * Uses Tamagui styled(Card) with display and feedback variants.
 *
 * Display variants:
 * - character: 72px Chinese character with optional pinyin below
 * - pinyin: 24px pinyin display
 * - meaning: 20px English meaning/question text
 *
 * Feedback variants:
 * - none: default (no border)
 * - correct: green border ($success)
 * - incorrect: orange/error border ($error)
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import { Card, YStack, Text, styled } from 'tamagui'

// ─── Styled Components ────────────────────────────────────────────────────────

const StyledCard = styled(Card, {
  animation: 'medium',
  enterStyle: { opacity: 0, scale: 0.95, y: 10 },
  exitStyle: { opacity: 0, x: -20 },
  padding: '$4',
  borderRadius: '$4',
  backgroundColor: '$surface',
  borderWidth: 2,
  borderColor: 'transparent',

  variants: {
    feedback: {
      none: {
        borderColor: 'transparent',
      },
      correct: {
        borderColor: '$success',
      },
      incorrect: {
        borderColor: '$error',
      },
    },
  } as const,

  defaultVariants: {
    feedback: 'none',
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizDisplayVariant = 'character' | 'pinyin' | 'meaning'
export type QuizFeedbackVariant = 'none' | 'correct' | 'incorrect'

interface QuizQuestionCardProps {
  /** Label describing the question type (e.g. "What does this mean?") */
  questionTypeLabel: string
  /** Primary content: Chinese character, pinyin, or question text */
  primaryContent: string
  /** Secondary content: pinyin shown below character (optional) */
  secondaryContent?: string
  /** Controls font size of primary content */
  display: QuizDisplayVariant
  /** Controls border color feedback state */
  feedback: QuizFeedbackVariant
  /** testID for testing */
  testID?: string
}

// ─── Font size map for display variants ──────────────────────────────────────

const PRIMARY_FONT_SIZE: Record<QuizDisplayVariant, number> = {
  character: 72, // 72px minimum for Chinese characters (AC #1)
  pinyin: 24,    // Clear pinyin display
  meaning: 20,   // English meaning text
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * QuizQuestionCard renders the question area of a quiz exercise.
 * Handles character/pinyin/meaning display modes and correct/incorrect feedback.
 */
export function QuizQuestionCard({
  questionTypeLabel,
  primaryContent,
  secondaryContent,
  display,
  feedback,
  testID = 'quiz-question-card',
}: QuizQuestionCardProps) {
  const primaryFontSize = PRIMARY_FONT_SIZE[display]

  return (
    <StyledCard feedback={feedback} testID={testID}>
      <YStack alignItems="center" gap="$3" paddingVertical="$2">
        {/* Question type label */}
        <Text
          fontSize="$4"
          color="$colorSubtle"
          textAlign="center"
          testID="question-type-label"
        >
          {questionTypeLabel}
        </Text>

        {/* Primary content: character / pinyin / question text */}
        <Text
          fontSize={primaryFontSize}
          fontWeight="600"
          textAlign="center"
          color="$color"
          testID="primary-content"
        >
          {primaryContent}
        </Text>

        {/* Secondary content: pinyin below character */}
        {secondaryContent ? (
          <Text
            fontSize={20}
            color="$colorSubtle"
            textAlign="center"
            testID="secondary-content"
          >
            {secondaryContent}
          </Text>
        ) : null}
      </YStack>
    </StyledCard>
  )
}
