/**
 * Quiz Play Screen
 *
 * Main screen for taking a vocabulary/grammar quiz.
 * Receives quiz data from useQuizStore (populated by loading.tsx before navigation).
 *
 * Features:
 * - Displays one question at a time with slide-in animation (AnimatePresence)
 * - Shows QuizProgress bar and counter
 * - Validates answers locally against correct_answer (exact match)
 * - Shows 1-second feedback delay before advancing to next question
 * - Exit confirmation dialog: "Leave exercise? Your progress will be saved."
 * - Graceful edge case handling: empty quiz, null payload
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ ← Leave       Vocabulary Quiz    │
 * ├─────────────────────────────────┤
 * │ ████████████░░░░░░░░  3/10       │  ← QuizProgress
 * ├─────────────────────────────────┤
 * │        What does this mean?      │
 * │              學                   │
 * │             xué                   │
 * ├─────────────────────────────────┤
 * │  ┌──────────┐  ┌──────────┐      │
 * │  │ to study │  │ to teach │      │  ← 2x2 AnswerOptionGrid
 * │  └──────────┘  └──────────┘      │
 * │  ┌──────────┐  ┌──────────┐      │
 * │  │ to read  │  │ to write │      │
 * │  └──────────┘  └──────────┘      │
 * └─────────────────────────────────┘
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { YStack, XStack, Text, Button, AnimatePresence } from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

import { useQuizStore } from '../../stores/useQuizStore'
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard'
import { AnswerOptionGrid } from '../../components/quiz/AnswerOptionGrid'
import { QuizProgress } from '../../components/quiz/QuizProgress'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType, QuizQuestion } from '../../types/quiz'
import type { QuizDisplayVariant, QuizFeedbackVariant } from '../../components/quiz/QuizQuestionCard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate answer locally using exact string match (case-insensitive, trimmed).
 * Used for vocabulary and grammar multiple choice questions.
 */
function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

/**
 * Derive the display variant from the quiz question.
 * - vocabulary questions with a character → 'character' display
 * - vocabulary without a character (pinyin-only) → 'pinyin' display
 * - grammar questions → 'meaning' display (full sentence/text)
 */
function getDisplayVariant(question: QuizQuestion): QuizDisplayVariant {
  if (question.exercise_type === 'vocabulary') {
    return question.character ? 'character' : 'pinyin'
  }
  return 'meaning'
}

/**
 * Get the primary content to display on the question card.
 * - character display: the Chinese character
 * - pinyin display: pinyin text (or question text)
 * - meaning display: the question text
 */
function getPrimaryContent(question: QuizQuestion, displayVariant: QuizDisplayVariant): string {
  if (displayVariant === 'character' && question.character) {
    return question.character
  }
  if (displayVariant === 'pinyin' && question.pinyin) {
    return question.pinyin
  }
  return question.question_text
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Feedback delay in milliseconds before advancing to next question (1s per UX spec) */
const FEEDBACK_DELAY_MS = 1000

export default function QuizPlayScreen() {
  const router = useRouter()

  // ─── Store state ─────────────────────────────────────────────────────────

  const quizPayload = useQuizStore((state) => state.quizPayload)
  const currentQuestionIndex = useQuizStore((state) => state.currentQuestion)
  const startQuiz = useQuizStore((state) => state.startQuiz)
  const setAnswer = useQuizStore((state) => state.setAnswer)
  const nextQuestion = useQuizStore((state) => state.nextQuestion)
  const addScore = useQuizStore((state) => state.addScore)
  const getCurrentQuestion = useQuizStore((state) => state.getCurrentQuestion)
  const isLastQuestion = useQuizStore((state) => state.isLastQuestion)

  // ─── Local state ──────────────────────────────────────────────────────────

  /** The answer selected by the user for the current question (null = not answered yet) */
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  /** Feedback state for the question card border */
  const [feedbackState, setFeedbackState] = useState<QuizFeedbackVariant>('none')

  // ─── On mount: initialize quiz session ───────────────────────────────────

  useEffect(() => {
    if (quizPayload) {
      // AC #3: call startQuiz on mount to initialize session state
      // Intentionally only run on mount — quizPayload is set before navigation
      startQuiz(quizPayload.quiz_id)
    }
  }, []) // run once on mount

  // ─── Edge case: no quiz data ──────────────────────────────────────────────

  if (!quizPayload || !quizPayload.questions || quizPayload.questions.length === 0) {
    // Navigate back gracefully — no crash (AC #4)
    router.replace('/(tabs)/books')
    return null
  }

  // ─── Current question ─────────────────────────────────────────────────────

  const currentQuestion = getCurrentQuestion()
  if (!currentQuestion) {
    // Edge case: index out of range — quiz ended
    router.replace('/(tabs)/books')
    return null
  }

  const displayVariant = getDisplayVariant(currentQuestion)
  const primaryContent = getPrimaryContent(currentQuestion, displayVariant)
  const secondaryContent =
    displayVariant === 'character' && currentQuestion.pinyin
      ? currentQuestion.pinyin
      : undefined

  const totalQuestions = quizPayload.questions.length
  const displayQuestionNumber = currentQuestionIndex + 1

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[quizPayload.exercise_type as ExerciseType] ??
    quizPayload.exercise_type

  // ─── Answer selection handler ─────────────────────────────────────────────

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null) return // Already answered

      const isCorrect = validateAnswer(answer, currentQuestion.correct_answer)

      // Update local state for immediate visual feedback
      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'incorrect')

      // Update store
      setAnswer(currentQuestionIndex, answer)
      if (isCorrect) {
        addScore(1)
      }

      // After feedback delay: advance to next question or complete quiz
      const timeout = setTimeout(() => {
        if (isLastQuestion()) {
          // AC #4: last question answered — navigate to results (placeholder for Story 4.11)
          router.replace('/(tabs)/books')
        } else {
          // Advance to next question
          nextQuestion()
          // Reset local answer state for the new question
          setSelectedAnswer(null)
          setFeedbackState('none')
        }
      }, FEEDBACK_DELAY_MS)

      return () => clearTimeout(timeout)
    },
    [
      selectedAnswer,
      currentQuestion,
      currentQuestionIndex,
      setAnswer,
      addScore,
      isLastQuestion,
      nextQuestion,
      router,
    ]
  )

  // ─── Exit confirmation dialog ─────────────────────────────────────────────

  const handleLeave = useCallback(() => {
    Alert.alert(
      'Leave exercise?',
      'Your progress will be saved.',
      [
        {
          text: 'Keep Learning',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    )
  }, [router])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen
        options={{
          title: exerciseTypeLabel,
          headerShown: false, // Custom header below
        }}
      />

      <YStack
        flex={1}
        backgroundColor="$background"
        testID="quiz-play-screen"
      >
        {/* Custom header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingTop="$6"
          paddingBottom="$2"
        >
          <Button
            chromeless
            onPress={handleLeave}
            pressStyle={{ scale: 0.98 }}
            animation="quick"
            testID="leave-button"
          >
            <XStack alignItems="center" gap="$1">
              <ArrowLeft size={18} color="$colorSubtle" />
              <Text color="$colorSubtle" fontSize="$3">
                Leave
              </Text>
            </XStack>
          </Button>

          <Text fontSize="$4" fontWeight="600" color="$color" testID="quiz-title">
            {exerciseTypeLabel}
          </Text>

          {/* Spacer for symmetry */}
          <YStack width={60} />
        </XStack>

        {/* Progress bar */}
        <YStack paddingHorizontal="$4" paddingVertical="$2">
          <QuizProgress
            currentQuestion={displayQuestionNumber}
            totalQuestions={totalQuestions}
            testID="quiz-progress"
          />
        </YStack>

        {/* Question card with slide-in animation */}
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4" gap="$4">
          <AnimatePresence>
            <QuizQuestionCard
              key={currentQuestionIndex}
              questionTypeLabel={currentQuestion.question_text}
              primaryContent={primaryContent}
              secondaryContent={secondaryContent}
              display={displayVariant}
              feedback={feedbackState}
              testID="quiz-question-card"
            />
          </AnimatePresence>

          {/* Answer options */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <AnswerOptionGrid
              options={currentQuestion.options}
              selectedOption={selectedAnswer}
              correctAnswer={selectedAnswer !== null ? currentQuestion.correct_answer : null}
              onSelect={handleAnswerSelect}
              disabled={selectedAnswer !== null}
              testID="answer-option-grid"
            />
          ) : (
            // Edge case: question without options
            <YStack alignItems="center" paddingVertical="$4">
              <Text color="$colorSubtle" fontSize="$3">
                No answer options available.
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    </>
  )
}
