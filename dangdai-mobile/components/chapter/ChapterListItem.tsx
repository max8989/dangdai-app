/**
 * ChapterListItem Component
 *
 * Displays a chapter selection card with chapter number badge,
 * English title, Chinese title, and navigation chevron.
 *
 * Design: 12px border radius, playful design per UX spec
 * Touch target: Minimum 48px (provided by card padding + badge size)
 */

import { Card, XStack, YStack, Text, Circle } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'

import type { Chapter } from '../../types/chapter'

interface ChapterListItemProps {
  chapter: Chapter
  onPress: () => void
}

export function ChapterListItem({ chapter, onPress }: ChapterListItemProps) {
  return (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$3"
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      animation="quick"
      testID={`chapter-list-item-${chapter.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Chapter ${chapter.chapterNumber}: ${chapter.titleEnglish}`}
    >
      <XStack gap="$3" alignItems="center">
        {/* Chapter Number Badge */}
        <Circle
          size={44}
          backgroundColor="$gray4"
          testID={`chapter-number-badge-${chapter.id}`}
        >
          <Text
            fontSize={18}
            fontWeight="600"
            color="$gray12"
            testID={`chapter-number-text-${chapter.id}`}
          >
            {chapter.chapterNumber}
          </Text>
        </Circle>

        {/* Chapter Info */}
        <YStack flex={1} gap="$1">
          <Text
            fontSize={16}
            fontWeight="500"
            testID={`chapter-title-english-${chapter.id}`}
          >
            {chapter.titleEnglish}
          </Text>
          <Text
            fontSize={14}
            color="$gray11"
            testID={`chapter-title-chinese-${chapter.id}`}
          >
            {chapter.titleChinese}
          </Text>
        </YStack>

        <ChevronRight size={20} color="$gray10" />
      </XStack>
    </Card>
  )
}
