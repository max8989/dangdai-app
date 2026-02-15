/**
 * BookCard Component
 *
 * Displays a book selection card with cover, title, Chinese title,
 * progress bar, and navigation chevron.
 *
 * Design: 12px border radius, playful design per UX spec
 * Touch target: Minimum 48x48px
 */

import { Card, XStack, YStack, Text, Progress, type ColorTokens } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'

import type { Book, BookProgress } from '../../types/chapter'

interface BookCardProps {
  book: Book
  progress: BookProgress
  onPress: () => void
}

export function BookCard({ book, progress, onPress }: BookCardProps) {
  const progressPercent =
    progress.totalChapters > 0
      ? (progress.chaptersCompleted / progress.totalChapters) * 100
      : 0

  return (
    <Card
      elevate
      bordered
      padding="$4"
      borderRadius="$4"
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      animation="quick"
      testID={`book-card-${book.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${progress.chaptersCompleted} of ${progress.totalChapters} chapters completed`}
    >
      <XStack gap="$4" alignItems="center">
        {/* Book Cover */}
        <YStack
          width={60}
          height={80}
          backgroundColor={book.coverColor as ColorTokens}
          borderRadius="$2"
          justifyContent="center"
          alignItems="center"
          testID={`book-cover-${book.id}`}
        >
          <Text color="white" fontSize={24} fontWeight="bold">
            {book.id}
          </Text>
        </YStack>

        {/* Book Info */}
        <YStack flex={1} gap="$2">
          <Text fontSize={18} fontWeight="600" testID={`book-title-${book.id}`}>
            {book.title}
          </Text>
          <Text fontSize={14} color="$gray11" testID={`book-title-chinese-${book.id}`}>
            {book.titleChinese}
          </Text>
          <XStack alignItems="center" gap="$2">
            <Progress value={progressPercent} flex={1} testID={`book-progress-bar-${book.id}`}>
              <Progress.Indicator animation="bouncy" />
            </Progress>
            <Text fontSize={12} color="$gray10" testID={`book-progress-text-${book.id}`}>
              {progress.chaptersCompleted}/{progress.totalChapters}
            </Text>
          </XStack>
        </YStack>

        <ChevronRight size={24} color="$gray10" />
      </XStack>
    </Card>
  )
}
