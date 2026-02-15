/**
 * Chapter List Screen
 *
 * Displays all chapters for a selected book in a scrollable list.
 * Each chapter shows: chapter number, English title, Chinese title.
 * Tapping a chapter navigates to the quiz screen.
 *
 * Story 3.2: Chapter List Screen
 */

import { YStack, Text, ScrollView } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'

import { ChapterListItem } from '../../components/chapter/ChapterListItem'
import { useChapters } from '../../hooks/useChapters'
import { BOOKS } from '../../constants/books'

export default function ChapterListScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const router = useRouter()

  const bookIdNum = parseInt(bookId ?? '1', 10)
  const book = BOOKS.find((b) => b.id === bookIdNum)
  const chapters = useChapters(bookIdNum)

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
            {chapters.map((chapter) => (
              <ChapterListItem
                key={chapter.id}
                chapter={chapter}
                onPress={() => handleChapterPress(chapter.id)}
              />
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
