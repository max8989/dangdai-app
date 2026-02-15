/**
 * Quiz Screen
 *
 * Displays quiz for a selected chapter.
 * This is a placeholder - full implementation will be in Epic 4.
 */

import { YStack, Text } from 'tamagui'
import { useLocalSearchParams, Stack } from 'expo-router'

import { useChapter } from '../../hooks/useChapters'

export default function QuizScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const chapter = useChapter(parseInt(chapterId ?? '0', 10))

  return (
    <>
      <Stack.Screen
        options={{
          title: chapter?.titleEnglish ?? 'Quiz',
          headerBackTitle: 'Chapters',
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4" testID="quiz-screen">
        <Text fontSize={24} fontWeight="bold" testID="quiz-header">
          {chapter?.titleEnglish ?? 'Unknown Chapter'}
        </Text>
        <Text fontSize={18} color="$gray11" marginTop="$2" testID="quiz-chinese-title">
          {chapter?.titleChinese}
        </Text>
        <Text color="$gray11" marginTop="$4">
          Quiz coming soon (Epic 4)
        </Text>
      </YStack>
    </>
  )
}
