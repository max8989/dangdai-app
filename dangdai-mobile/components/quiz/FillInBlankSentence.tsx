/**
 * FillInBlankSentence Component
 *
 * Displays a sentence with interactive blank slots for fill-in-the-blank exercises.
 * Parses `sentence_with_blanks` (blanks marked as `___`) into text segments and
 * interactive blank slot buttons.
 *
 * - Empty blanks show a dashed border with $primary color tint
 * - Filled blanks display the word with animation
 * - After validation, blanks show correct/incorrect feedback via Theme wrappers
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

import { XStack, YStack, Text, Button, Theme, styled } from 'tamagui'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlankState = 'empty' | 'filled' | 'correct' | 'incorrect'

interface FillInBlankSentenceProps {
  /** Sentence string with blanks marked as `___` */
  sentenceWithBlanks: string
  /** Map of blank index → filled word (null if not yet filled) */
  filledBlanks: Record<number, string | null>
  /** Per-blank feedback after validation */
  blankFeedback?: Record<number, 'correct' | 'incorrect'>
  /** Called when a filled blank is tapped (returns word to bank) */
  onBlankTap: (blankIndex: number) => void
  /** Disable blank interaction after validation */
  disabled?: boolean
  /** testID for the container */
  testID?: string
}

// ─── Styled Components ────────────────────────────────────────────────────────

/** Blank slot button for interactive fill-in-blank */
const BlankSlot = styled(Button, {
  animation: 'medium',
  minWidth: 60,
  minHeight: 48,
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    state: {
      empty: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '$primary',
        backgroundColor: '$backgroundPress',
      },
      filled: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '$borderColor',
        backgroundColor: '$surface',
      },
      correct: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '$success',
        backgroundColor: '$successBackground',
      },
      incorrect: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '$error',
        backgroundColor: '$errorBackground',
      },
    },
  } as const,

  defaultVariants: {
    state: 'empty',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Blank marker used in sentence strings */
const BLANK_MARKER = '___'

/**
 * Parse a sentence with blank markers into segments.
 * Returns an array of `{ type: 'text' | 'blank', content?, index? }`.
 */
function parseSentence(sentence: string): Array<{ type: 'text'; content: string } | { type: 'blank'; index: number }> {
  const parts = sentence.split(BLANK_MARKER)
  const result: Array<{ type: 'text'; content: string } | { type: 'blank'; index: number }> = []

  parts.forEach((part, i) => {
    if (part.length > 0) {
      result.push({ type: 'text', content: part })
    }
    // Insert a blank between text segments (not after the last segment)
    if (i < parts.length - 1) {
      result.push({ type: 'blank', index: i })
    }
  })

  return result
}

/** Determine blank slot state based on filled status and feedback */
function getBlankState(
  blankIndex: number,
  filledBlanks: Record<number, string | null>,
  blankFeedback?: Record<number, 'correct' | 'incorrect'>
): BlankState {
  const word = filledBlanks[blankIndex]
  if (!word) return 'empty'

  if (blankFeedback) {
    const feedback = blankFeedback[blankIndex]
    if (feedback === 'correct') return 'correct'
    if (feedback === 'incorrect') return 'incorrect'
  }

  return 'filled'
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FillInBlankSentence renders a Chinese sentence with interactive blank slots.
 * Empty slots prompt the user to tap a word from the word bank.
 * Filled slots display the word and can be tapped to return it to the bank.
 */
export function FillInBlankSentence({
  sentenceWithBlanks,
  filledBlanks,
  blankFeedback,
  onBlankTap,
  disabled = false,
  testID = 'fill-in-blank-sentence',
}: FillInBlankSentenceProps) {
  const segments = parseSentence(sentenceWithBlanks)

  return (
    <YStack testID={testID} gap="$2">
      <XStack flexWrap="wrap" alignItems="center" gap="$1">
        {segments.map((segment, segIndex) => {
          if (segment.type === 'text') {
            return (
              <Text
                key={`text-${segIndex}`}
                fontSize="$5"
                color="$color"
                testID={`sentence-text-${segIndex}`}
              >
                {segment.content}
              </Text>
            )
          }

          // Blank slot
          const blankIndex = segment.index
          const blankState = getBlankState(blankIndex, filledBlanks, blankFeedback)
          const filledWord = filledBlanks[blankIndex]
          const isFilled = !!filledWord && blankState !== 'empty'
          const isInteractive = isFilled && !disabled

          const slot = (
            <BlankSlot
              key={`blank-${blankIndex}`}
              testID={`blank-slot-${blankIndex}`}
              state={blankState}
              onPress={() => {
                if (isInteractive) {
                  onBlankTap(blankIndex)
                }
              }}
              disabled={!isInteractive}
              accessibilityState={{ disabled: !isInteractive }}
              pressStyle={isInteractive ? { scale: 0.95 } : undefined}
            >
              {filledWord ? (
                <Text
                  animation="medium"
                  enterStyle={{ opacity: 0, scale: 0.8 }}
                  fontSize="$4"
                  fontWeight="500"
                  testID={`blank-word-${blankIndex}`}
                >
                  {filledWord}
                </Text>
              ) : (
                <Text fontSize="$3" color="$primary" opacity={0.6} testID={`blank-placeholder-${blankIndex}`}>
                  {'  '}
                </Text>
              )}
            </BlankSlot>
          )

          // Wrap in Theme for contextual color feedback
          if (blankState === 'correct') {
            return (
              <Theme key={`blank-${blankIndex}`} name="success">
                {slot}
              </Theme>
            )
          }
          if (blankState === 'incorrect') {
            return (
              <Theme key={`blank-${blankIndex}`} name="error">
                {slot}
              </Theme>
            )
          }

          return slot
        })}
      </XStack>
    </YStack>
  )
}
