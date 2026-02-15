/**
 * Books Screen
 *
 * Displays available textbooks (Books 1-4) as selectable cards.
 * Shows progress for each book (chapters completed / total).
 * Tapping a book navigates to the chapter list for that book.
 */

import { YStack, Text, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'

import { BookCard } from '../../components/chapter/BookCard'
import { BookCardSkeleton } from '../../components/chapter/BookCardSkeleton'
import { useBooks } from '../../hooks/useBooks'
import { BOOKS } from '../../constants/books'

export default function BooksScreen() {
  const router = useRouter()
  const { data: progress, isLoading, error } = useBooks()

  const handleBookPress = (bookId: number) => {
    router.push(`/chapter/${bookId}`)
  }

  return (
    <YStack flex={1} backgroundColor="$background" testID="books-screen">
      <YStack padding="$4" paddingTop="$6">
        <Text fontSize={28} fontWeight="bold" testID="books-header">
          Books
        </Text>
      </YStack>

      {isLoading ? (
        <ScrollView testID="books-list-loading">
          <YStack padding="$4" gap="$4">
            <BookCardSkeleton count={4} />
          </YStack>
        </ScrollView>
      ) : error ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text color="$error" textAlign="center">
            Failed to load book progress. Please try again.
          </Text>
        </YStack>
      ) : (
        <ScrollView testID="books-list">
          <YStack padding="$4" gap="$4">
            {BOOKS.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                progress={
                  progress?.[book.id] ?? {
                    bookId: book.id,
                    chaptersCompleted: 0,
                    totalChapters: book.chapterCount,
                  }
                }
                onPress={() => handleBookPress(book.id)}
              />
            ))}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  )
}
