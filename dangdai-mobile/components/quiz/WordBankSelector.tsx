/**
 * WordBankSelector Component
 *
 * Horizontal scrollable word bank for fill-in-the-blank exercises.
 * Displays pill-shaped word buttons that users tap to fill blanks.
 *
 * - Used words are shown at 0.4 opacity and disabled
 * - After validation, words show correct/incorrect feedback states
 * - All words disabled after validation (disabled prop)
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

import { ScrollView } from 'react-native'
import { XStack, Text, styled, Button } from 'tamagui'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WordBankItemState = 'available' | 'selected' | 'correct' | 'incorrect' | 'used'

interface WordBankSelectorProps {
  /** All words in the word bank */
  words: string[]
  /** Words currently placed in blanks */
  usedWords: Set<string>
  /** Per-word feedback after validation */
  feedbackState?: Record<string, 'correct' | 'incorrect'>
  /** Called when user taps an available word */
  onWordSelect: (word: string) => void
  /** Disable all interaction after validation */
  disabled?: boolean
  /** testID for the container */
  testID?: string
}

// ─── Styled Components ────────────────────────────────────────────────────────

const WordBankItem = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.95 },
  focusStyle: { borderColor: '$borderColorFocus' },
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: 20,
  minHeight: 48,

  variants: {
    state: {
      available: {
        backgroundColor: '$surface',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
      selected: {
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
      correct: {
        backgroundColor: '$successBackground',
        borderColor: '$success',
        borderWidth: 1,
      },
      incorrect: {
        backgroundColor: '$errorBackground',
        borderColor: '$error',
        borderWidth: 1,
      },
      used: {
        opacity: 0.4,
        backgroundColor: '$surface',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
    },
  } as const,

  defaultVariants: {
    state: 'available',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Determine the visual state for a word bank item */
function getWordState(
  word: string,
  isUsed: boolean,
  feedbackState?: Record<string, 'correct' | 'incorrect'>
): WordBankItemState {
  if (isUsed) {
    const feedback = feedbackState?.[word]
    if (feedback === 'correct') return 'correct'
    if (feedback === 'incorrect') return 'incorrect'
    return 'used'
  }
  return 'available'
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WordBankSelector renders a horizontal scrollable list of word bank items.
 * Each item is a pill-shaped button. Used words are semi-transparent and disabled.
 */
export function WordBankSelector({
  words,
  usedWords,
  feedbackState,
  onWordSelect,
  disabled = false,
  testID = 'word-bank-selector',
}: WordBankSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      <XStack gap="$2" paddingVertical="$2">
        {words.map((word, index) => {
          const isUsed = usedWords.has(word)
          const wordState = getWordState(word, isUsed, feedbackState)
          const isDisabled = disabled || isUsed

          return (
            <WordBankItem
              key={`${word}-${index}`}
              testID={`word-bank-item-${index}`}
              state={wordState}
              onPress={() => {
                if (!isDisabled) {
                  onWordSelect(word)
                }
              }}
              disabled={isDisabled}
              accessibilityState={{ disabled: isDisabled }}
            >
              <Text fontSize="$4" color={isUsed && !feedbackState?.[word] ? '$colorSubtle' : '$color'}>
                {word}
              </Text>
            </WordBankItem>
          )
        })}
      </XStack>
    </ScrollView>
  )
}
