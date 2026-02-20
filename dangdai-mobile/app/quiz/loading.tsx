/**
 * Quiz Loading Screen
 *
 * Placeholder screen displayed while quiz is being prepared.
 * Shows loading indicator with quiz type and chapter info.
 *
 * Note: Full quiz generation will be implemented in Epic 4.
 * This is a navigation target placeholder for Story 3.4.
 *
 * Story 3.4: Open Chapter Navigation (No Gates)
 */

import { YStack, Text, Spinner } from 'tamagui'
import { useLocalSearchParams, Stack } from 'expo-router'

export default function QuizLoadingScreen() {
  const { chapterId, bookId, quizType } = useLocalSearchParams<{
    chapterId: string
    bookId: string
    quizType: string
  }>()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Loading Quiz',
          headerBackTitle: 'Back',
        }}
      />
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
        gap="$4"
        testID="quiz-loading-screen"
      >
        <Spinner size="large" color="$blue9" testID="loading-spinner" />
        <Text fontSize="$6" testID="loading-text">
          Preparing {quizType} quiz...
        </Text>
        <Text fontSize="$2" color="$gray10" testID="chapter-info">
          Chapter {chapterId} (Book {bookId})
        </Text>
        <Text
          fontSize="$2"
          color="$gray10"
          marginTop="$4"
          testID="placeholder-notice"
        >
          Quiz generation will be implemented in Epic 4
        </Text>
      </YStack>
    </>
  )
}
