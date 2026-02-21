/**
 * Quiz Loading Screen
 *
 * Displays an engaging loading screen while quiz questions are generated.
 * Shows rotating learning tips, progress animation, and handles
 * error states with retry/back options.
 *
 * On success, navigates to the quiz screen with the generated quiz data.
 * On cancel, navigates back to the exercise type selection / chapter detail.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import { useEffect, useCallback, useState } from 'react'
import { YStack, XStack, Text, Button, Spinner, AnimatePresence } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { AlertTriangle } from '@tamagui/lucide-icons'

import { useQuizGeneration } from '../../hooks/useQuizGeneration'
import { useQuizStore } from '../../stores/useQuizStore'
import { LOADING_TIPS, TIP_ROTATION_INTERVAL_MS, getNextTipIndex } from '../../constants/tips'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType, QuizGenerationError, QuizResponse } from '../../types/quiz'

export default function QuizLoadingScreen() {
  const { chapterId, bookId, quizType, exerciseType: exerciseTypeParam } = useLocalSearchParams<{
    chapterId: string
    bookId: string
    quizType: string
    exerciseType: string
  }>()
  const router = useRouter()
  const startQuiz = useQuizStore((state) => state.startQuiz)
  const setQuizPayload = useQuizStore((state) => state.setQuizPayload)

  // Support both exerciseType (preferred) and quizType (legacy Story 3.4 param)
  const exerciseType = exerciseTypeParam ?? quizType ?? 'vocabulary'
  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[exerciseType as ExerciseType] ?? exerciseType

  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : 0
  const bookIdNum = bookId ? parseInt(bookId, 10) : 0

  // Derive chapter number from chapter ID convention: chapterId = bookId * 100 + chapterNumber
  const chapterNumber = bookIdNum > 0 ? chapterIdNum - bookIdNum * 100 : chapterIdNum

  // Quiz generation mutation
  const { mutate, isPending, isError, error, data, reset } = useQuizGeneration()

  // Tip rotation state
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Simulated progress (cosmetic, not tied to actual backend progress)
  const [progress, setProgress] = useState(0)

  // Trigger quiz generation on mount
  useEffect(() => {
    if (chapterIdNum > 0 && bookIdNum > 0) {
      mutate({
        chapterId: chapterIdNum,
        bookId: bookIdNum,
        exerciseType,
      })
    }
  }, [chapterIdNum, bookIdNum, exerciseType, mutate])

  // Tip rotation effect
  useEffect(() => {
    if (!isPending) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => getNextTipIndex(prev, LOADING_TIPS.length))
    }, TIP_ROTATION_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isPending])

  // Simulated progress animation
  useEffect(() => {
    if (!isPending) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Cap cosmetic progress at 90% - the last 10% happens on success
        if (prev >= 90) return 90
        // Increment by random amount to feel organic
        return prev + Math.random() * 8 + 2
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isPending])

  // Handle successful quiz generation
  useEffect(() => {
    if (data) {
      setProgress(100)

      // Store quiz payload in Zustand store before navigation
      const quizData = data as QuizResponse
      setQuizPayload(quizData)
      startQuiz(quizData.quiz_id, quizData)

      // Small delay for the progress bar to reach 100% visually
      const timeout = setTimeout(() => {
        // Navigate to quiz play screen (Story 4.3)
        router.replace('/quiz/play' as '/quiz/play')
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [data, startQuiz, setQuizPayload, router])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  const handleRetry = useCallback(() => {
    reset()
    setProgress(0)
    setCurrentTipIndex(0)
    mutate({
      chapterId: chapterIdNum,
      bookId: bookIdNum,
      exerciseType,
    })
  }, [reset, mutate, chapterIdNum, bookIdNum, exerciseType])

  // Determine error message based on error type
  const isInsufficientContent = (error as QuizGenerationError | null)?.type === 'not_found'

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
        padding="$4"
        testID="quiz-loading-screen"
      >
        <AnimatePresence exitBeforeEnter>
          {/* Loading State */}
          {isPending && (
            <YStack
              key="loading"
              animation="medium"
              enterStyle={{ opacity: 0, scale: 0.95 }}
              exitStyle={{ opacity: 0, scale: 0.95 }}
              opacity={1}
              scale={1}
              alignItems="center"
              gap="$4"
              width="100%"
              paddingHorizontal="$4"
              testID="loading-state"
            >
              <Spinner size="large" color="$primary" testID="loading-spinner" />

              <Text
                fontSize="$6"
                fontWeight="600"
                textAlign="center"
                testID="loading-text"
              >
                Generating your {exerciseTypeLabel} exercise for Chapter{' '}
                {chapterNumber}...
              </Text>

              {/* Progress Bar */}
              <YStack
                width="100%"
                height={4}
                backgroundColor="$borderColor"
                borderRadius={2}
                overflow="hidden"
                testID="progress-bar-container"
              >
                <YStack
                  backgroundColor="$primary"
                  height={4}
                  borderRadius={2}
                  animation="slow"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  width={`${Math.min(progress, 100)}%` as any}
                  testID="progress-bar"
                />
              </YStack>

              {/* Rotating Tips */}
              <YStack
                height={80}
                justifyContent="center"
                width="100%"
                testID="tips-container"
              >
                <AnimatePresence exitBeforeEnter>
                  <YStack
                    key={currentTipIndex}
                    animation="medium"
                    enterStyle={{ opacity: 0, y: 10 }}
                    exitStyle={{ opacity: 0, y: -10 }}
                    opacity={1}
                    y={0}
                    alignItems="center"
                    testID="tip-item"
                  >
                    <Text
                      fontSize="$4"
                      color="$colorSubtle"
                      textAlign="center"
                      testID="tip-text"
                    >
                      {LOADING_TIPS[currentTipIndex]}
                    </Text>
                  </YStack>
                </AnimatePresence>
              </YStack>

              {/* Cancel Button */}
              <Button
                animation="quick"
                pressStyle={{ scale: 0.98 }}
                onPress={handleCancel}
                chromeless
                color="$colorSubtle"
                testID="cancel-button"
              >
                Cancel
              </Button>
            </YStack>
          )}

          {/* Error State */}
          {isError && !isInsufficientContent && (
            <YStack
              key="error"
              animation="medium"
              enterStyle={{ opacity: 0, scale: 0.9 }}
              exitStyle={{ opacity: 0, scale: 0.9 }}
              opacity={1}
              scale={1}
              alignItems="center"
              gap="$4"
              paddingHorizontal="$4"
              testID="error-state"
            >
              <AlertTriangle size={48} color="$error" testID="error-icon" />

              <Text
                fontSize="$6"
                fontWeight="600"
                textAlign="center"
                testID="error-text"
              >
                {(error as QuizGenerationError)?.message ??
                  `Couldn't generate ${exerciseTypeLabel} exercise. Try another type or retry.`}
              </Text>

              <XStack gap="$3" testID="error-actions">
                <Button
                  animation="quick"
                  pressStyle={{ scale: 0.98 }}
                  onPress={handleRetry}
                  theme="primary"
                  testID="retry-button"
                >
                  Retry
                </Button>
                <Button
                  animation="quick"
                  pressStyle={{ scale: 0.98 }}
                  onPress={handleCancel}
                  bordered
                  testID="back-button"
                >
                  Back
                </Button>
              </XStack>
            </YStack>
          )}

          {/* Insufficient Content State */}
          {isError && isInsufficientContent && (
            <YStack
              key="insufficient"
              animation="medium"
              enterStyle={{ opacity: 0, scale: 0.9 }}
              exitStyle={{ opacity: 0, scale: 0.9 }}
              opacity={1}
              scale={1}
              alignItems="center"
              gap="$4"
              paddingHorizontal="$4"
              testID="insufficient-content-state"
            >
              <AlertTriangle size={48} color="$warning" testID="insufficient-icon" />

              <Text
                fontSize="$6"
                fontWeight="600"
                textAlign="center"
                testID="insufficient-text"
              >
                {(error as QuizGenerationError)?.message ??
                  `Not enough content for ${exerciseTypeLabel} in this chapter. Try Vocabulary or Grammar instead.`}
              </Text>

              <Button
                animation="quick"
                pressStyle={{ scale: 0.98 }}
                onPress={handleCancel}
                bordered
                testID="insufficient-back-button"
              >
                Back
              </Button>
            </YStack>
          )}
        </AnimatePresence>
      </YStack>
    </>
  )
}
