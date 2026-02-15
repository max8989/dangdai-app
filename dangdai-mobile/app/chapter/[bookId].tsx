/**
 * Chapter List Screen
 *
 * Displays all chapters for a selected book in a scrollable list.
 * Each chapter shows: chapter number, English title, Chinese title,
 * and progress status (not started, in progress, or mastered).
 * Tapping a chapter navigates to the quiz screen.
 *
 * Story 3.2: Chapter List Screen
 * Story 3.3: Chapter Completion Status Display
 */

import { YStack, Text, ScrollView } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'

import { ChapterListItem } from '../../components/chapter/ChapterListItem'
import { ChapterListSkeleton } from '../../components/chapter/ChapterListSkeleton'
import { useChapters } from '../../hooks/useChapters'
import { useChapterProgress } from '../../hooks/useChapterProgress'
import { BOOKS } from '../../constants/books'

export default function ChapterListScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const router = useRouter()

  const bookIdNum = parseInt(bookId ?? '1', 10)
  const book = BOOKS.find((b) => b.id === bookIdNum)
  const chapters = useChapters(bookIdNum)

  // Fetch progress data for this book
  const { data: progressMap, isLoading: isProgressLoading } = useChapterProgress(bookIdNum)

  const handleChapterPress = (chapterId: number) => {
    router.push(`/quiz/${chapterId}`)
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: book?.title ?? 'Chapters',
          headerBackTitle: 'Books',
        }}
      />

      <YStack flex={1} backgroundColor="$background" testID="chapter-list-screen">
        {/* Book Header */}
        <YStack padding="$4" backgroundColor="$background">
          <Text fontSize={14} color="$gray11" testID="book-chinese-title">
            {book?.titleChinese}
          </Text>
          <Text fontSize={16} color="$gray11" marginTop="$2" testID="chapter-count">
            {chapters.length} chapters
          </Text>
        </YStack>

        {/* Chapter List */}
        <ScrollView testID="chapter-scroll-view">
          <YStack padding="$4" gap="$3">
            {isProgressLoading ? (
              <ChapterListSkeleton count={chapters.length} />
            ) : (
              chapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  progress={progressMap?.[chapter.id] ?? null}
                  onPress={() => handleChapterPress(chapter.id)}
                />
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
