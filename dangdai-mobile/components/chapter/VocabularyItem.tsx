/**
 * VocabularyItem Component
 *
 * Displays a single vocabulary entry as a card with:
 * - Traditional character (large font, ≥24px)
 * - Pinyin below the character
 * - English definition
 * - Part of speech badge (small chip)
 * - Name indicator for is_name entries
 *
 * Design follows ChapterListItem patterns:
 * - Tamagui Card with animation="quick" and pressStyle={{ scale: 0.98 }}
 * - Tamagui theme tokens only (no hardcoded colors)
 *
 * Story 11.5: Vocabulary Browse Screen — Task 3
 */

import { Card, XStack, YStack, Text } from 'tamagui'

import type { VocabularyItem as VocabularyItemType } from '../../hooks/useVocabulary'

interface VocabularyItemProps {
  item: VocabularyItemType
}

/**
 * Renders a vocabulary card with traditional character, pinyin, English, and POS badge.
 * Handles is_name entries with a subtle "Name" label.
 */
export function VocabularyItem({ item }: VocabularyItemProps) {
  const { traditional, pinyin, english, part_of_speech, is_name, id } = item

  // Build a descriptive accessibility label for screen readers
  const posLabel = part_of_speech ? `, ${part_of_speech}` : ''
  const nameLabel = is_name ? ', proper noun' : ''
  const a11yLabel = `${traditional}, ${pinyin}, ${english}${posLabel}${nameLabel}`

  return (
    <Card
      elevate
      bordered
      padding="$3"
      marginVertical="$1"
      borderRadius="$3"
      animation="quick"
      pressStyle={{ scale: 0.98 }}
      testID={`vocabulary-item-${id}`}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <XStack justifyContent="space-between" alignItems="center">
        {/* Left: Character, Pinyin, English */}
        <YStack flex={1} gap="$1">
          {/* Traditional character — large font ≥24px */}
          <Text
            fontSize={24}
            fontWeight="bold"
            testID={`vocabulary-traditional-${id}`}
          >
            {traditional}
          </Text>

          {/* Pinyin */}
          <Text
            fontSize="$3"
            color="$colorSubtle"
            testID={`vocabulary-pinyin-${id}`}
          >
            {pinyin}
          </Text>

          {/* English definition */}
          <Text
            fontSize="$3"
            testID={`vocabulary-english-${id}`}
          >
            {english}
          </Text>
        </YStack>

        {/* Right: POS badge and/or Name indicator */}
        <YStack gap="$1" alignItems="flex-end">
          {/* Part of speech badge */}
          {part_of_speech ? (
            <Text
              fontSize="$1"
              color="$colorSubtle"
              backgroundColor="$backgroundHover"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              testID={`vocabulary-pos-${id}`}
            >
              {part_of_speech}
            </Text>
          ) : null}

          {/* Name indicator for proper nouns */}
          {is_name ? (
            <Text
              fontSize="$1"
              color="$blue10"
              backgroundColor="$blue3"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              testID={`vocabulary-name-indicator-${id}`}
            >
              Name
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </Card>
  )
}
