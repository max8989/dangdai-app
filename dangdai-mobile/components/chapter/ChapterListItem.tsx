/**
 * ChapterListItem Component
 *
 * Displays a chapter selection card with chapter number badge,
 * English title, Chinese title, progress indicator, and navigation chevron.
 *
 * Progress States:
 * - Not started (0%): Gray badge with chapter number
 * - In progress (1-79%): Blue badge with chapter number + progress bar
 * - Mastered (80%+): Green badge with checkmark
 *
 * Design: 12px border radius, playful design per UX spec
 * Touch target: Minimum 48px (provided by card padding + badge size)
 */

import { Card, XStack, YStack, Text, Circle, Progress } from 'tamagui'
import { ChevronRight, Check } from '@tamagui/lucide-icons'

import type { Chapter, ChapterProgress } from '../../types/chapter'

type ChapterStatus = 'not-started' | 'in-progress' | 'mastered'

interface ChapterListItemProps {
  chapter: Chapter
  progress?: ChapterProgress | null
  onPress: () => void
}

/**
 * Determines the chapter status based on completion percentage.
 * 0% = not started, 1-79% = in progress, 80%+ = mastered
 */
function getChapterStatus(percentage: number): ChapterStatus {
  if (percentage === 0) return 'not-started'
  if (percentage >= 80) return 'mastered'
  return 'in-progress'
}

const badgeConfig = {
  'not-started': {
    backgroundColor: '$gray4',
    textColor: '$gray12',
    progressTextColor: '$gray10',
  },
  'in-progress': {
    backgroundColor: '$blue4',
    textColor: '$blue11',
    progressTextColor: '$blue11',
  },
  mastered: {
    backgroundColor: '$green4',
    textColor: '$green11',
    progressTextColor: '$green11',
  },
} as const

export function ChapterListItem({ chapter, progress, onPress }: ChapterListItemProps) {
  const percentage = progress?.completionPercentage ?? 0
  const status = getChapterStatus(percentage)
  const config = badgeConfig[status]

  const progressText = status === 'mastered' ? 'Mastered' : `${percentage}%`

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
      accessibilityLabel={`Chapter ${chapter.chapterNumber}: ${chapter.titleEnglish}, ${chapter.titleChinese}`}
    >
      <XStack gap="$3" alignItems="center">
        {/* Chapter Number Badge with Status */}
        <Circle
          size={44}
          backgroundColor={config.backgroundColor}
          testID={`chapter-number-badge-${chapter.id}`}
        >
          {status === 'mastered' ? (
            <Check
              size={20}
              color={config.textColor}
              testID={`chapter-checkmark-${chapter.id}`}
            />
          ) : (
            <Text
              fontSize={18}
              fontWeight="600"
              color={config.textColor}
              testID={`chapter-number-text-${chapter.id}`}
            >
              {chapter.chapterNumber}
            </Text>
          )}
        </Circle>

        {/* Chapter Info */}
        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="500"
              testID={`chapter-title-english-${chapter.id}`}
            >
              {chapter.titleEnglish}
            </Text>
            <Text
              fontSize={12}
              color={config.progressTextColor}
              testID={`chapter-progress-text-${chapter.id}`}
            >
              {progressText}
            </Text>
          </XStack>
          <Text
            fontSize={14}
            color="$gray11"
            testID={`chapter-title-chinese-${chapter.id}`}
          >
            {chapter.titleChinese}
          </Text>

          {/* Progress Bar (only for in-progress) */}
          {status === 'in-progress' && (
            <Progress
              value={percentage}
              size="$1"
              marginTop="$2"
              testID={`chapter-progress-bar-${chapter.id}`}
            >
              <Progress.Indicator animation="bouncy" backgroundColor="$blue9" />
            </Progress>
          )}
        </YStack>

        <ChevronRight size={20} color="$gray10" />
      </XStack>
    </Card>
  )
}
