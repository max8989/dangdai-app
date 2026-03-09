/**
 * Premade Exercise Screen (Stub)
 *
 * Placeholder screen for premade workbook exercises.
 * Full implementation deferred to Epic 11 (Story 11.8).
 *
 * This stub exists to satisfy navigation from the Exercise Type Selection screen
 * (Story 3.5) without crashing when a premade exercise card is tapped.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 5.1 (navigation placeholder)
 * Story 11.8: Premade Exercise Completion Flow (full implementation)
 */

import { YStack, Text, Button } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ChevronLeft } from '@tamagui/lucide-icons'

export default function PremadeExerciseScreen() {
  const { chapterId, exerciseId } = useLocalSearchParams<{
    chapterId: string
    exerciseId: string
  }>()
  const router = useRouter()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Workbook Exercise',
          headerBackTitle: 'Back',
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={() => router.back()}
              testID="back-button"
            />
          ),
        }}
      />
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
        padding="$4"
        gap="$4"
        testID="premade-exercise-screen"
      >
        <Text fontSize="$6" fontWeight="600" textAlign="center">
          Workbook Exercise
        </Text>
        <Text fontSize="$4" color="$colorSubtle" textAlign="center">
          Premade exercise rendering coming in Story 11.8.
        </Text>
        <Text fontSize="$3" color="$gray10" textAlign="center">
          Exercise ID: {exerciseId ?? 'unknown'}
        </Text>
        <Button
          onPress={() => router.back()}
          bordered
          testID="back-to-exercises-button"
        >
          Back to Exercises
        </Button>
      </YStack>
    </>
  )
}
