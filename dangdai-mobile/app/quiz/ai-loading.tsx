/**
 * AI Exercise Generation Loading Screen (Story 4.17)
 *
 * Displays while the backend generates an exercise on-the-fly via OpenAI.
 * Shows tips carousel + elapsed time + Cancel button.
 *
 * On success: adapts payload → populates quiz store → navigates to play screen.
 * On cancel / back nav / unmount: AbortController.abort() fires → no cache write.
 * On error (non-cancel): toast + pop back to Exercise Type Selection.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { ChevronLeft } from '@tamagui/lucide-icons'

import { api } from '../../lib/api'
import { adaptPremadeContent } from '../../lib/premadeExerciseAdapter'
import { useQuizStore } from '../../stores/useQuizStore'
import type { QuizResponse } from '../../types/quiz'

// ─── Tips Carousel ─────────────────────────────────────────────────────────────

const TIPS = [
  'AI is crafting personalized questions for you...',
  'Exercises adapt to chapter vocabulary and grammar.',
  'Generated exercises are cached for other learners.',
  'Try the Premade option for instant exercises!',
  'Each question is validated for Traditional Chinese accuracy.',
  'Practice makes progress — keep going!',
]

const TIP_ROTATION_MS = 4000

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AILoadingScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    bookId: string
    chapterId: string
    exerciseType: string
  }>()

  const bookId = parseInt(params.bookId ?? '0', 10)
  const chapterId = parseInt(params.chapterId ?? '0', 10)
  const exerciseType = params.exerciseType ?? ''

  const abortRef = useRef<AbortController | null>(null)
  const routerRef = useRef(router)
  routerRef.current = router
  const startQuizRef = useRef(useQuizStore.getState().startQuiz)
  startQuizRef.current = useQuizStore.getState().startQuiz
  const [elapsedSec, setElapsedSec] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  // Elapsed-time counter
  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Tips rotation
  useEffect(() => {
    const id = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      TIP_ROTATION_MS,
    )
    return () => clearInterval(id)
  }, [])

  // Main generation effect — abort on unmount / back-nav
  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false

    ;(async () => {
      console.log('[ai-loading] Starting generation:', { bookId, chapterId, exerciseType })
      try {
        const result = await api.generateExercise(
          { bookId, chapterId, exerciseType },
          { signal: controller.signal },
        )
        console.log('[ai-loading] Generation succeeded:', result.exercise_type)

        if (cancelled) return

        // Adapt the content using the same adapter as premade exercises
        const questions = adaptPremadeContent(
          result.exercise_type,
          result.content as Record<string, unknown>,
        )

        console.log('[ai-loading] Adapted questions:', questions.length,
          'first q:', JSON.stringify({
            exercise_type: questions[0]?.exercise_type,
            has_dialogue_lines: !!questions[0]?.dialogue_lines,
            dialogue_lines_count: questions[0]?.dialogue_lines?.length,
            options_sample: questions[0]?.options?.slice(0, 2),
          }))
        if (questions.length === 0) {
          Alert.alert('Error', "Couldn't generate exercise — please try again.")
          if (routerRef.current.canGoBack()) routerRef.current.back()
          return
        }

        // Build a QuizResponse-compatible payload for the store
        const quizId = `ai-${Date.now()}`
        const payload: QuizResponse = {
          quiz_id: quizId,
          chapter_id: chapterId,
          book_id: bookId,
          exercise_type: result.exercise_type as any,
          question_count: questions.length,
          questions,
        }

        startQuizRef.current(quizId, payload, chapterId, bookId, result.exercise_type)

        // Navigate to the play screen
        routerRef.current.replace({
          pathname: '/quiz/play' as any,
        })
      } catch (err: any) {
        console.error('[ai-loading] Generation failed:', err?.name, err?.message, err?.category)
        if (cancelled) return

        // AbortError = user-initiated cancel → silent pop back
        if (err?.name === 'AbortError' || err?.category === 'timeout') {
          if (routerRef.current.canGoBack()) routerRef.current.back()
          return
        }

        Alert.alert(
          'Error',
          err?.message ?? "Couldn't generate exercise — please try again.",
        )
        if (routerRef.current.canGoBack()) routerRef.current.back()
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId, exerciseType])

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    if (routerRef.current.canGoBack()) routerRef.current.back()
  }, [])

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Generating Exercise',
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={handleCancel}
              testID="ai-loading-back"
            />
          ),
        }}
      />

      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        gap="$5"
        backgroundColor="$background"
        testID="ai-loading-screen"
      >
        <Spinner size="large" color="$blue10" testID="ai-loading-spinner" />

        <Text
          fontSize="$5"
          fontWeight="bold"
          textAlign="center"
          testID="ai-loading-tip"
        >
          {TIPS[tipIndex]}
        </Text>

        <Text
          fontSize="$3"
          color="$gray10"
          testID="ai-loading-elapsed"
        >
          {elapsedSec}s elapsed
        </Text>

        <Button
          size="$4"
          chromeless
          bordered
          onPress={handleCancel}
          testID="ai-loading-cancel"
        >
          Cancel
        </Button>
      </YStack>
    </>
  )
}
