/**
 * Chapter List Screen
 *
 * Displays chapters for a selected book.
 * This is a placeholder - full implementation will be in Story 3.2.
 */

import { YStack, Text } from 'tamagui'
import { useLocalSearchParams, Stack } from 'expo-router'

import { BOOKS } from '../../constants/books'

export default function ChapterListScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const book = BOOKS.find((b) => b.id === Number(bookId))

  return (
    <>
      <Stack.Screen
        options={{
          title: book?.title ?? 'Chapters',
          headerBackTitle: 'Books',
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4" testID="chapter-list-screen">
        <Text fontSize={24} fontWeight="bold" testID="chapter-list-header">
          {book?.titleChinese ?? 'Unknown Book'}
        </Text>
        <Text color="$gray11" marginTop="$2">
          Chapter list coming soon (Story 3.2)
        </Text>
      </YStack>
    </>
  )
}
