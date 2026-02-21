/**
 * AnswerOptionGrid Component
 *
 * Renders answer options for a multiple choice quiz question.
 * Supports two layouts:
 * - grid (2x2): for short answers (all options ≤15 chars) — typical vocabulary
 * - list (vertical stack): for long answers (any option >15 chars) — typical grammar
 *
 * Each option has minimum 48px touch target (AC #1).
 * All options are disabled after an answer is selected (AC #2).
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import { Button, XStack, YStack, Text, styled } from 'tamagui'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnswerOptionState = 'default' | 'correct' | 'incorrect' | 'disabled'
export type AnswerLayoutVariant = 'grid' | 'list'

interface AnswerOptionGridProps {
  /** The answer option strings to display */
  options: string[]
  /** Currently selected answer (null if none selected yet) */
  selectedOption: string | null
  /** The correct answer (null until answered, to avoid revealing before selection) */
  correctAnswer: string | null
  /** Called with the selected answer text when user taps an option */
  onSelect: (answer: string) => void
  /** Whether all options are disabled (post-answer) */
  disabled: boolean
  /** testID for the container */
  testID?: string
}

// ─── Styled Components ────────────────────────────────────────────────────────

const AnswerOption = styled(Button, {
  pressStyle: { scale: 0.98 },
  focusStyle: { borderColor: '$borderColorFocus' },
  minHeight: 48,
  borderWidth: 1,
  borderRadius: '$3',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    state: {
      // Pre-answer: no option selected yet
      default: {
        borderColor: '$borderColor',
        backgroundColor: '$surface',
      },
      // Post-answer: this option is the correct answer
      correct: {
        borderColor: '$success',
        backgroundColor: '$successBackground',
      },
      // Post-answer: this option was selected but is wrong
      incorrect: {
        borderColor: '$error',
        backgroundColor: '$errorBackground',
      },
      // Post-answer: this option is neither selected nor correct
      disabled: {
        opacity: 0.5,
        borderColor: '$borderColor',
        backgroundColor: '$surface',
      },
    },
    layout: {
      grid: {
        // Width is set per-instance (48% for 2-column layout — see usage below)
      },
      list: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    state: 'default',
    layout: 'grid',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Determine layout variant: grid for short answers, list for long answers */
function getLayout(options: string[]): AnswerLayoutVariant {
  const hasLongAnswer = options.some((opt) => opt.length > 15)
  return hasLongAnswer ? 'list' : 'grid'
}

/** Determine the state variant for a single option */
function getOptionState(
  option: string,
  selectedOption: string | null,
  correctAnswer: string | null,
  disabled: boolean
): AnswerOptionState {
  // Post-answer states
  if (selectedOption !== null) {
    if (option === correctAnswer) return 'correct'
    if (option === selectedOption) return 'incorrect'
    return 'disabled'
  }

  // Pre-answer state
  if (disabled) return 'disabled'
  return 'default'
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AnswerOptionGrid renders multiple choice answer buttons.
 * Automatically chooses grid or list layout based on answer length.
 */
export function AnswerOptionGrid({
  options,
  selectedOption,
  correctAnswer,
  onSelect,
  disabled,
  testID = 'answer-option-grid',
}: AnswerOptionGridProps) {
  const layout = getLayout(options)

  const handlePress = (option: string) => {
    if (!disabled && selectedOption === null) {
      onSelect(option)
    }
  }

  if (layout === 'grid') {
    // 2x2 grid layout: wrap options in pairs
    return (
      <XStack
        testID={testID}
        flexWrap="wrap"
        gap="$3"
        justifyContent="space-between"
      >
        {options.map((option, index) => {
          const state = getOptionState(option, selectedOption, correctAnswer, disabled)
          const isDisabled = disabled || selectedOption !== null

          return (
            <AnswerOption
              key={option}
              testID={`answer-option-${index}`}
              state={state}
              layout="grid"
              onPress={() => handlePress(option)}
              disabled={isDisabled}
              accessibilityState={{ disabled: isDisabled }}
              // 48% gives two columns with gap="$3" (~12px) between them.
              // Tamagui does not support calc(), so this percentage is intentional.
              width="48%"
            >
              <Text fontSize="$3" textAlign="center" numberOfLines={2}>
                {option}
              </Text>
            </AnswerOption>
          )
        })}
      </XStack>
    )
  }

  // Vertical list layout
  return (
    <YStack testID={testID} gap="$3">
      {options.map((option, index) => {
        const state = getOptionState(option, selectedOption, correctAnswer, disabled)
        const isDisabled = disabled || selectedOption !== null

        return (
          <AnswerOption
            key={option}
            testID={`answer-option-${index}`}
            state={state}
            layout="list"
            onPress={() => handlePress(option)}
            disabled={isDisabled}
            accessibilityState={{ disabled: isDisabled }}
          >
            <Text fontSize="$3" textAlign="center" numberOfLines={3}>
              {option}
            </Text>
          </AnswerOption>
        )
      })}
    </YStack>
  )
}
