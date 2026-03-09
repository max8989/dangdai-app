/**
 * DialogueBubble Component
 *
 * Displays a single dialogue line (speaker turn) as a chat bubble.
 * This is a READ-ONLY browse component — NOT the quiz DialogueCard.
 *
 * Layout:
 * - Alternate speakers are aligned left/right for visual conversation flow
 * - Speaker A (isAlternate=false): bubble aligned left with label above
 * - Speaker B (isAlternate=true): bubble aligned right with label above
 *
 * Primary content: traditional Chinese (large font ≥20px), always visible.
 * Toggleable sections: simplified, pinyin, English — controlled by parent screen.
 *
 * Uses Tamagui theme tokens only (no hardcoded colors).
 * Includes accessibilityRole and accessibilityLabel for screen readers.
 *
 * Story 11.7: Dialogue Browse Screen — Task 3
 */

import { Card, YStack, Text } from 'tamagui'

import type { DialogueLine } from '../../hooks/useDialogues'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DialogueBubbleProps {
  /** The dialogue line data (speaker + text fields) */
  line: DialogueLine
  /** Whether to show pinyin below the traditional text */
  showPinyin: boolean
  /** Whether to show English translation below */
  showEnglish: boolean
  /** Whether to show simplified Chinese below the traditional text */
  showSimplified: boolean
  /**
   * Alternate alignment for different speakers.
   * false = left-aligned (Speaker A), true = right-aligned (Speaker B)
   */
  isAlternate: boolean
  /** Optional testID suffix for targeting in tests */
  testID?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a single dialogue line as a chat bubble.
 * Traditional Chinese is always visible; simplified, pinyin, and English
 * are conditionally shown based on toggle props from the parent screen.
 */
export function DialogueBubble({
  line,
  showPinyin,
  showEnglish,
  showSimplified,
  isAlternate,
  testID,
}: DialogueBubbleProps) {
  const { speaker, traditional, simplified, pinyin, english } = line

  // Build a descriptive accessibility label for screen readers
  const pinyinLabel = pinyin ? `, ${pinyin}` : ''
  const englishLabel = english ? `, ${english}` : ''
  const a11yLabel = `${speaker}: ${traditional}${pinyinLabel}${englishLabel}`

  return (
    <YStack
      alignItems={isAlternate ? 'flex-end' : 'flex-start'}
      marginVertical="$2"
      testID={testID ?? `dialogue-bubble-${speaker}`}
    >
      {/* Speaker label above the bubble */}
      <Text
        fontSize="$2"
        color="$colorSubtle"
        marginBottom="$1"
        marginHorizontal="$1"
        testID={`dialogue-speaker-${speaker}`}
      >
        {speaker}
      </Text>

      {/* Chat bubble card */}
      <Card
        backgroundColor={isAlternate ? '$backgroundHover' : '$background'}
        borderRadius="$4"
        padding="$3"
        maxWidth="85%"
        alignSelf={isAlternate ? 'flex-end' : 'flex-start'}
        bordered
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
        testID={`dialogue-bubble-card-${speaker}`}
      >
        {/* Traditional Chinese — primary, large font, always visible */}
        <Text
          fontSize={20}
          fontWeight="500"
          testID={`dialogue-traditional-${speaker}`}
        >
          {traditional}
        </Text>

        {/* Simplified Chinese — toggleable */}
        {showSimplified && simplified ? (
          <Text
            fontSize="$3"
            color="$colorSubtle"
            marginTop="$1"
            testID={`dialogue-simplified-${speaker}`}
          >
            {simplified}
          </Text>
        ) : null}

        {/* Pinyin — toggleable */}
        {showPinyin && pinyin ? (
          <Text
            fontSize="$3"
            color="$colorSubtle"
            fontStyle="italic"
            marginTop="$1"
            testID={`dialogue-pinyin-${speaker}`}
          >
            {pinyin}
          </Text>
        ) : null}

        {/* English translation — toggleable */}
        {showEnglish && english ? (
          <Text
            fontSize="$3"
            marginTop="$1"
            testID={`dialogue-english-${speaker}`}
          >
            {english}
          </Text>
        ) : null}
      </Card>
    </YStack>
  )
}
