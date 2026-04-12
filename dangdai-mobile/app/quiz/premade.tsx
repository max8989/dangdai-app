/**
 * Premade Exercise Screen
 *
 * Full implementation of the premade workbook exercise screen.
 * Renders exercises locally from content JSONB stored in premade_exercises table.
 * No LLM calls — all validation is local against stored correct answers.
 *
 * Features:
 * - Fetches full content JSONB only when user opens the exercise (not on list screen)
 * - Adapts content JSONB to QuizQuestion[] format via premadeExerciseAdapter
 * - Reuses ALL existing quiz UI components (FillInBlankSentence, MatchingExercise, etc.)
 * - Reuses useQuizStore (Zustand) for quiz session state
 * - Reuses useQuizPersistence for saving results to question_results
 * - Navigates to CompletionScreen on finish (same as AI quizzes)
 * - Exit confirmation dialog: "Leave exercise? Your progress will be saved."
 *
 * Navigation params: exerciseId, chapterId, bookId
 * Route: /quiz/premade?exerciseId=UUID&chapterId=X&bookId=Y
 *
 * Story 11.8: Premade Exercise Completion Flow — Tasks 1, 4, 5
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, Text, Button, AnimatePresence } from 'tamagui'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

import { useQuizStore } from '../../stores/useQuizStore'
import { useQuizPersistence } from '../../hooks/useQuizPersistence'
import { useQuestionTimer } from '../../hooks/useQuestionTimer'
import { usePremadeExercise } from '../../hooks/usePremadeExercise'
import { adaptPremadeContent } from '../../lib/premadeExerciseAdapter'
import { validateFillInBlank, parseCorrectAnswers, allBlanksFilled } from '../../lib/validateFillInBlank'

import { CompletionScreen } from '../../components/quiz/CompletionScreen'
import { QuizProgress } from '../../components/quiz/QuizProgress'
import { FeedbackOverlay } from '../../components/quiz/FeedbackOverlay'
import { FillInBlankSentence } from '../../components/quiz/FillInBlankSentence'
import { WordBankSelector } from '../../components/quiz/WordBankSelector'
import { MatchingExercise } from '../../components/quiz/MatchingExercise'
import { SentenceBuilder } from '../../components/quiz/SentenceBuilder'
import { ReadingPassageCard } from '../../components/quiz/ReadingPassageCard'
import { DialogueCard } from '../../components/quiz/DialogueCard'
import { AnswerOptionGrid } from '../../components/quiz/AnswerOptionGrid'
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard'

import { preloadSounds, unloadSounds, playSound } from '../../hooks/useSound'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType, QuizQuestion, DialogueQuestion } from '../../types/quiz'
import type { Json } from '../../types/supabase'
import type { DialogueAnswerResult } from '../../components/quiz/DialogueCard'
import type { QuizFeedbackVariant } from '../../components/quiz/QuizQuestionCard'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Points awarded for a correct answer */
const POINTS_PER_CORRECT = 10

/** Unique quiz ID prefix for premade exercises (distinguishes from AI quiz IDs) */
const PREMADE_QUIZ_ID_PREFIX = 'premade-'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate answer locally using exact string match (case-insensitive, trimmed).
 */
function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

/**
 * Calculate total scorable question count (reading comprehension counts sub-questions).
 */
function getTotalQuestionCount(questions: QuizQuestion[]): number {
  return questions.reduce((total, q) => {
    if (q.exercise_type === 'reading_comprehension' && q.comprehension_questions) {
      return total + q.comprehension_questions.length
    }
    return total + 1
  }, 0)
}

/**
 * Calculate current question position (1-based) accounting for sub-questions.
 */
function getCurrentQuestionPosition(
  questions: QuizQuestion[],
  currentQuestionIndex: number,
  subQuestionIndex: number
): number {
  let position = 0
  for (let i = 0; i < currentQuestionIndex; i++) {
    const q = questions[i]
    if (q.exercise_type === 'reading_comprehension' && q.comprehension_questions) {
      position += q.comprehension_questions.length
    } else {
      position += 1
    }
  }
  const currentQ = questions[currentQuestionIndex]
  if (currentQ?.exercise_type === 'reading_comprehension') {
    position += subQuestionIndex + 1
  } else {
    position += 1
  }
  return position
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PremadeExerciseScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // ─── Route params ─────────────────────────────────────────────────────────

  const { exerciseId: exerciseIdParam, chapterId: chapterIdParam, bookId: bookIdParam } = useLocalSearchParams<{
    exerciseId: string
    chapterId: string
    bookId: string
  }>()

  // useLocalSearchParams can return string | string[] — normalize to string | null
  const exerciseId = Array.isArray(exerciseIdParam) ? exerciseIdParam[0] : (exerciseIdParam ?? null)
  const chapterId = chapterIdParam
    ? parseInt(Array.isArray(chapterIdParam) ? chapterIdParam[0] : chapterIdParam, 10)
    : 0
  const bookId = bookIdParam
    ? parseInt(Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam, 10)
    : 0

  // ─── Fetch exercise data ──────────────────────────────────────────────────

  const { data: exercise, isLoading, error: fetchError } = usePremadeExercise(exerciseId ?? null)

  // ─── Adapt content JSONB to QuizQuestion[] ────────────────────────────────

  const questions: QuizQuestion[] = useMemo(() => {
    if (!exercise?.content || !exercise?.exercise_type) return []
    return adaptPremadeContent(exercise.exercise_type, exercise.content)
  }, [exercise])

  // ─── Initialize quiz store when questions are ready ───────────────────────
  // Use a ref to track the initialized exercise ID so we don't re-initialize
  // if the TanStack Query cache refetches the same exercise (e.g., stale-while-revalidate).
  // This prevents startQuiz() from resetting the quiz mid-session.

  const startQuiz = useQuizStore((state) => state.startQuiz)
  const setQuizPayload = useQuizStore((state) => state.setQuizPayload)
  const initializedExerciseIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (questions.length === 0 || !exercise) return
    // Only initialize once per exercise ID — prevents mid-session reset on cache refetch
    if (initializedExerciseIdRef.current === exercise.id) return

    initializedExerciseIdRef.current = exercise.id

    const quizId = `${PREMADE_QUIZ_ID_PREFIX}${exercise.id}`
    const payload = {
      quiz_id: quizId,
      chapter_id: chapterId,
      book_id: bookId,
      exercise_type: exercise.exercise_type as ExerciseType,
      question_count: questions.length,
      questions,
    }

    startQuiz(quizId, payload, chapterId, bookId, exercise.exercise_type)
    setQuizPayload(payload)
  }, [questions, exercise, chapterId, bookId, startQuiz, setQuizPayload])

  // ─── Store state ──────────────────────────────────────────────────────────

  const quizPayload = useQuizStore((state) => state.quizPayload)
  const currentQuestionIndex = useQuizStore((state) => state.currentQuestion)
  const setAnswer = useQuizStore((state) => state.setAnswer)
  const nextQuestion = useQuizStore((state) => state.nextQuestion)
  const addScore = useQuizStore((state) => state.addScore)
  const isLastQuestion = useQuizStore((state) => state.isLastQuestion)
  const isComplete = useQuizStore((state) => state.isComplete)
  const completeQuiz = useQuizStore((state) => state.completeQuiz)
  const getQuizDuration = useQuizStore((state) => state.getQuizDuration)
  const getIncorrectAnswers = useQuizStore((state) => state.getIncorrectAnswers)
  const score = useQuizStore((state) => state.score)

  // Fill-in-blank store state
  const blankAnswers = useQuizStore((state) => state.blankAnswers)
  const blankAnswerIndices = useQuizStore((state) => state.blankAnswerIndices)
  const setBlankAnswer = useQuizStore((state) => state.setBlankAnswer)
  const clearBlankAnswer = useQuizStore((state) => state.clearBlankAnswer)

  // Sentence construction store state
  const clearTiles = useQuizStore((state) => state.clearTiles)

  // Feedback overlay store state
  const showFeedback = useQuizStore((state) => state.showFeedback)
  const feedbackIsCorrect = useQuizStore((state) => state.feedbackIsCorrect)
  const triggerShowFeedback = useQuizStore((state) => state.triggerShowFeedback)
  const hideFeedback = useQuizStore((state) => state.hideFeedback)

  // ─── Persistence hooks ────────────────────────────────────────────────────

  const timer = useQuestionTimer(currentQuestionIndex)
  const { saveQuestionResult, saveQuizAttempt, clearResumableQuiz } = useQuizPersistence()

  // ─── Local state ──────────────────────────────────────────────────────────

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<QuizFeedbackVariant>('none')
  const [currentPointsEarned, setCurrentPointsEarned] = useState<number>(POINTS_PER_CORRECT)
  const [blankFeedback, setBlankFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})
  const [wordFeedback, setWordFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})
  const [fillInBlankValidated, setFillInBlankValidated] = useState(false)
  const [subQuestionIndex, setSubQuestionIndex] = useState(0)

  // ─── On mount: preload sounds ─────────────────────────────────────────────

  useEffect(() => {
    void preloadSounds()
    return () => {
      void unloadSounds()
    }
  }, []) // mount-only intentional

  // ─── Reset local state when question changes ──────────────────────────────

  useEffect(() => {
    setBlankFeedback({})
    setWordFeedback({})
    setFillInBlankValidated(false)
    setSelectedAnswer(null)
    setFeedbackState('none')
    setCurrentPointsEarned(POINTS_PER_CORRECT)
    setSubQuestionIndex(0)
  }, [currentQuestionIndex])

  // ─── Current question ─────────────────────────────────────────────────────

  const currentQuestion: QuizQuestion | null = useMemo(() => {
    if (!quizPayload || !quizPayload.questions || quizPayload.questions.length === 0) return null
    return quizPayload.questions[currentQuestionIndex] ?? null
  }, [quizPayload, currentQuestionIndex])

  // ─── Derived display values ───────────────────────────────────────────────

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[(exercise?.exercise_type ?? '') as ExerciseType] ??
    exercise?.exercise_type ??
    'Workbook Exercise'

  const totalQuestions = getTotalQuestionCount(quizPayload?.questions ?? [])
  const displayQuestionNumber = getCurrentQuestionPosition(
    quizPayload?.questions ?? [],
    currentQuestionIndex,
    subQuestionIndex
  )

  // ─── Exercise type flags ──────────────────────────────────────────────────

  const isFillInBlank = currentQuestion?.exercise_type === 'fill_in_blank'
  const isDialogue = currentQuestion?.exercise_type === 'dialogue_completion'
  const isSentenceConstruction = currentQuestion?.exercise_type === 'sentence_construction'
  const isMatching = currentQuestion?.exercise_type === 'matching'
  const isReadingComprehension = currentQuestion?.exercise_type === 'reading_comprehension'

  const wordBank: string[] = currentQuestion?.word_bank ?? []
  const usedIndices = new Set<number>(
    Object.values(blankAnswerIndices).filter((i): i is number => i !== null)
  )
  const totalBlanks =
    currentQuestion?.blank_positions?.length ??
    (currentQuestion?.sentence_with_blanks?.split('___').length ?? 1) - 1

  // ─── Unified answer result handler ────────────────────────────────────────

  const handleAnswerResult = useCallback(
    (isCorrect: boolean) => {
      triggerShowFeedback(isCorrect)
      void playSound(isCorrect ? 'correct' : 'incorrect')
    },
    [triggerShowFeedback]
  )

  // ─── Manual advance handler ───────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!showFeedback) return

    hideFeedback()
    if (isLastQuestion()) {
      const finalScore = useQuizStore.getState().score
      const finalAnswers = useQuizStore.getState().answers
      const totalQs = quizPayload?.questions.length ?? 0
      const exType = exercise?.exercise_type ?? ''
      const capChapterId = chapterId
      const capBookId = bookId

      saveQuizAttempt({
        chapterId: capChapterId,
        bookId: capBookId,
        exerciseType: exType,
        score: finalScore,
        totalQuestions: totalQs,
        answersJson: finalAnswers as unknown as Json,
      })

      completeQuiz()
    } else {
      nextQuestion()
    }
  }, [showFeedback, hideFeedback, isLastQuestion, nextQuestion, completeQuiz, quizPayload, exercise, chapterId, bookId, saveQuizAttempt])

  // ─── Fill-in-blank: validation ────────────────────────────────────────────

  const handleFillInBlankValidation = useCallback((answersOverride?: Record<number, string | null>) => {
    if (!currentQuestion || fillInBlankValidated) return

    const timeSpentMs = timer.stopTimer()
    const correctAnswers = parseCorrectAnswers(currentQuestion.correct_answer)
    const filledAnswers = (answersOverride ?? blankAnswers) as Record<number, string>
    const results = validateFillInBlank(filledAnswers, correctAnswers)

    const newBlankFeedback: Record<number, 'correct' | 'incorrect'> = {}
    results.forEach((isCorrect, index) => {
      newBlankFeedback[index] = isCorrect ? 'correct' : 'incorrect'
    })

    const answerIndices = blankAnswerIndices
    const newWordFeedback: Record<number, 'correct' | 'incorrect'> = {}
    Object.entries(answerIndices).forEach(([blankIndexStr, wordBankIdx]) => {
      if (wordBankIdx !== null && wordBankIdx !== undefined) {
        const blankIndex = parseInt(blankIndexStr, 10)
        const result = results[blankIndex]
        if (result !== undefined) {
          newWordFeedback[wordBankIdx] = result ? 'correct' : 'incorrect'
        }
      }
    })

    const allCorrect = results.every(Boolean)

    setAnswer(currentQuestionIndex, JSON.stringify(filledAnswers))
    if (allCorrect) {
      addScore(POINTS_PER_CORRECT)
    }

    saveQuestionResult({
      chapterId,
      bookId,
      exerciseType: currentQuestion.exercise_type,
      vocabularyItem: null,
      grammarPattern: null,
      correct: allCorrect,
      timeSpentMs,
    })

    setBlankFeedback(newBlankFeedback)
    setWordFeedback(newWordFeedback)
    setFillInBlankValidated(true)
    handleAnswerResult(allCorrect)
  }, [
    currentQuestion,
    fillInBlankValidated,
    blankAnswers,
    blankAnswerIndices,
    currentQuestionIndex,
    setAnswer,
    addScore,
    handleAnswerResult,
    timer,
    saveQuestionResult,
    chapterId,
    bookId,
  ])

  // ─── Fill-in-blank: word selection ────────────────────────────────────────

  const handleWordSelect = useCallback(
    (word: string, wordBankIndex: number) => {
      if (fillInBlankValidated || !currentQuestion || showFeedback) return
      if (allBlanksFilled(blankAnswers, totalBlanks)) return

      for (let i = 0; i < totalBlanks; i++) {
        if (!blankAnswers[i]) {
          setBlankAnswer(i, word, wordBankIndex)
          const updatedAnswers = { ...blankAnswers, [i]: word }
          if (allBlanksFilled(updatedAnswers, totalBlanks)) {
            handleFillInBlankValidation(updatedAnswers)
          }
          return
        }
      }
    },
    [fillInBlankValidated, currentQuestion, showFeedback, totalBlanks, blankAnswers, setBlankAnswer, handleFillInBlankValidation]
  )

  // ─── Fill-in-blank: blank tap (return word to bank) ───────────────────────

  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (fillInBlankValidated || showFeedback) return
      clearBlankAnswer(blankIndex)
    },
    [fillInBlankValidated, showFeedback, clearBlankAnswer]
  )

  // ─── Sentence construction answer handler ─────────────────────────────────

  const handleSentenceAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentQuestion) return

      const timeSpentMs = timer.stopTimer()

      setAnswer(currentQuestionIndex, isCorrect ? currentQuestion.correct_answer : '')
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      saveQuestionResult({
        chapterId,
        bookId,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null,
        grammarPattern: null,
        correct: isCorrect,
        timeSpentMs,
      })

      clearTiles()
      handleAnswerResult(isCorrect)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, clearTiles, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId]
  )

  // ─── Matching exercise completion handler ─────────────────────────────────

  const handleMatchingComplete = useCallback(
    (result: { score: number; incorrectAttempts: number }) => {
      if (!currentQuestion) return

      const timeSpentMs = timer.stopTimer()
      const isCorrect = result.score >= 50
      const pointsEarned = Math.round((result.score / 100) * POINTS_PER_CORRECT)

      setCurrentPointsEarned(pointsEarned)
      setAnswer(currentQuestionIndex, JSON.stringify({ score: result.score, incorrectAttempts: result.incorrectAttempts }))
      if (pointsEarned > 0) {
        addScore(pointsEarned)
      }

      saveQuestionResult({
        chapterId,
        bookId,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null,
        grammarPattern: null,
        correct: isCorrect,
        timeSpentMs,
      })

      handleAnswerResult(isCorrect)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId]
  )

  // ─── Dialogue answer result handler ──────────────────────────────────────

  const handleDialogueAnswer = useCallback(
    (result: DialogueAnswerResult) => {
      if (!currentQuestion) return

      const timeSpentMs = timer.stopTimer()

      setAnswer(currentQuestionIndex, result.selectedAnswer)
      if (result.correct) {
        addScore(POINTS_PER_CORRECT)
      }

      saveQuestionResult({
        chapterId,
        bookId,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null,
        grammarPattern: null,
        correct: result.correct,
        timeSpentMs,
      })

      handleAnswerResult(result.correct)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId]
  )

  // ─── Reading comprehension sub-question answer handler ────────────────────

  const handleReadingSubQuestionAnswer = useCallback(
    (isCorrect: boolean, selectedAnswerText: string) => {
      if (!currentQuestion || !currentQuestion.comprehension_questions) return

      const totalSubQuestions = currentQuestion.comprehension_questions.length
      const isLastSubQuestion = subQuestionIndex === totalSubQuestions - 1

      const timeSpentMs = isLastSubQuestion ? timer.stopTimer() : 0

      const existingAnswer = useQuizStore.getState().answers[currentQuestionIndex]
      const currentAnswers: string[] = existingAnswer
        ? (JSON.parse(existingAnswer) as string[])
        : []
      currentAnswers[subQuestionIndex] = selectedAnswerText
      const serializedAnswers = JSON.stringify(currentAnswers)
      setAnswer(currentQuestionIndex, serializedAnswers)

      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      if (isLastSubQuestion) {
        const allSubAnswersCorrect = currentAnswers.every((ans, idx) => {
          return ans === currentQuestion.comprehension_questions![idx].correct_answer
        })

        saveQuestionResult({
          chapterId,
          bookId,
          exerciseType: currentQuestion.exercise_type,
          vocabularyItem: null,
          grammarPattern: null,
          correct: allSubAnswersCorrect,
          timeSpentMs,
        })

        handleAnswerResult(allSubAnswersCorrect)
      } else {
        setSubQuestionIndex((prev) => prev + 1)
      }
    },
    [
      currentQuestion,
      currentQuestionIndex,
      subQuestionIndex,
      setAnswer,
      addScore,
      handleAnswerResult,
      timer,
      saveQuestionResult,
      chapterId,
      bookId,
    ]
  )

  // ─── Multiple choice answer handler ──────────────────────────────────────

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || !currentQuestion || showFeedback) return

      const timeSpentMs = timer.stopTimer()
      const isCorrect = validateAnswer(answer, currentQuestion.correct_answer)

      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'incorrect')

      setAnswer(currentQuestionIndex, answer)
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      saveQuestionResult({
        chapterId,
        bookId,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null,
        grammarPattern: null,
        correct: isCorrect,
        timeSpentMs,
      })

      handleAnswerResult(isCorrect)
    },
    [
      selectedAnswer,
      currentQuestion,
      showFeedback,
      currentQuestionIndex,
      setAnswer,
      addScore,
      handleAnswerResult,
      timer,
      saveQuestionResult,
      chapterId,
      bookId,
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

  // ─── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="premade-loading"
        >
          <Text color="$colorSubtle" fontSize="$4">
            Loading exercise...
          </Text>
        </YStack>
      </>
    )
  }

  // ─── Error / not found state ──────────────────────────────────────────────

  if (fetchError || !exercise || questions.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          padding="$4"
          gap="$4"
          testID="premade-error"
        >
          <Text fontSize="$5" fontWeight="600" textAlign="center">
            Exercise not available
          </Text>
          <Text fontSize="$3" color="$colorSubtle" textAlign="center">
            This exercise could not be loaded. Please try again.
          </Text>
          <Button onPress={() => router.back()} bordered testID="back-button">
            Go Back
          </Button>
        </YStack>
      </>
    )
  }

  // ─── CompletionScreen render ──────────────────────────────────────────────

  const quizExerciseType = (exercise.exercise_type ?? 'vocabulary') as ExerciseType
  const totalQuestionsCount = getTotalQuestionCount(quizPayload?.questions ?? [])
  const correctAnswerCount = Math.round(score / POINTS_PER_CORRECT)

  if (isComplete) {
    const incorrectAnswers = getIncorrectAnswers()
    const durationMins = getQuizDuration()

    const incorrectItems = incorrectAnswers.map((item) => {
      const question = quizPayload?.questions[item.questionIndex]
      return {
        questionText: item.subQuestionText ?? question?.question_text ?? '',
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        character: question?.character,
      }
    })

    return (
      <AnimatePresence>
        <YStack
          key="completion"
          flex={1}
          backgroundColor="$background"
          paddingTop={insets.top}
          paddingBottom={insets.bottom}
          testID="quiz-completion-wrapper"
        >
          <CompletionScreen
            chapterId={chapterId}
            bookId={bookId}
            exerciseType={quizExerciseType}
            correctCount={correctAnswerCount}
            totalQuestions={totalQuestionsCount}
            pointsEarned={score}
            durationMinutes={durationMins}
            incorrectItems={incorrectItems}
            onContinue={() => {
              clearResumableQuiz()
              router.back()
            }}
            testID="completion-screen"
          />
        </YStack>
      </AnimatePresence>
    )
  }

  // Guard: if quiz not yet initialized, show nothing
  if (!currentQuestion) return null

  // ─── Main quiz render ─────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <YStack
        flex={1}
        backgroundColor="$background"
        paddingBottom={insets.bottom}
        testID="premade-exercise-screen"
      >
        {/* Custom header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingTop={insets.top + 8}
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

          <Text fontSize="$4" fontWeight="600" color="$color" testID="exercise-title">
            {exerciseTypeLabel}
          </Text>

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

        {/* Question content area */}
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4" gap="$4">
          {isMatching ? (
            // ─── Matching Exercise ────────────────────────────────────────
            (currentQuestion.pairs && currentQuestion.pairs.length > 0) ? (
              <AnimatePresence exitBeforeEnter>
                <YStack
                  key={currentQuestionIndex}
                  animation="medium"
                  enterStyle={{ opacity: 0, x: 20 }}
                  exitStyle={{ opacity: 0, x: -20 }}
                  flex={1}
                >
                  <MatchingExercise
                    question={currentQuestion}
                    onComplete={handleMatchingComplete}
                    testID="matching-exercise"
                  />
                </YStack>
              </AnimatePresence>
            ) : null
          ) : isSentenceConstruction ? (
            // ─── Sentence Construction ────────────────────────────────────
            currentQuestion.scrambled_words && currentQuestion.correct_order ? (
              <AnimatePresence exitBeforeEnter>
                <YStack
                  key={currentQuestionIndex}
                  animation="medium"
                  enterStyle={{ opacity: 0, x: 20 }}
                  exitStyle={{ opacity: 0, x: -20 }}
                  flex={1}
                >
                  <SentenceBuilder
                    questionText={currentQuestion.question_text}
                    scrambledWords={currentQuestion.scrambled_words}
                    correctOrder={currentQuestion.correct_order}
                    correctAnswer={currentQuestion.correct_answer}
                    explanation={currentQuestion.explanation}
                    sourceCitation={currentQuestion.source_citation}
                    onAnswer={handleSentenceAnswer}
                    disabled={showFeedback}
                    testID="sentence-builder"
                    acceptableAnswerVariants={currentQuestion.acceptable_answer_variants}
                  />
                </YStack>
              </AnimatePresence>
            ) : null
          ) : isReadingComprehension ? (
            // ─── Reading Comprehension ────────────────────────────────────
            currentQuestion.passage && currentQuestion.comprehension_questions ? (
              <AnimatePresence exitBeforeEnter>
                <YStack
                  key={currentQuestionIndex}
                  animation="medium"
                  enterStyle={{ opacity: 0, x: 20 }}
                  exitStyle={{ opacity: 0, x: -20 }}
                  flex={1}
                >
                  <ReadingPassageCard
                    passage={currentQuestion.passage}
                    passagePinyin={currentQuestion.passage_pinyin}
                    comprehensionQuestions={currentQuestion.comprehension_questions}
                    currentSubQuestionIndex={subQuestionIndex}
                    onAnswer={handleReadingSubQuestionAnswer}
                    disabled={showFeedback}
                    testID="reading-passage-card"
                  />
                </YStack>
              </AnimatePresence>
            ) : null
          ) : isDialogue ? (
            // ─── Dialogue Completion ──────────────────────────────────────
            currentQuestion.dialogue_lines ? (
              <AnimatePresence exitBeforeEnter>
                <YStack
                  key={currentQuestionIndex}
                  animation="medium"
                  enterStyle={{ opacity: 0, x: 20 }}
                  exitStyle={{ opacity: 0, x: -20 }}
                  flex={1}
                >
                  <DialogueCard
                    question={currentQuestion as DialogueQuestion}
                    onAnswerResult={handleDialogueAnswer}
                    disabled={showFeedback}
                    testID="dialogue-card"
                  />
                </YStack>
              </AnimatePresence>
            ) : null
          ) : isFillInBlank ? (
            // ─── Fill-in-the-Blank ────────────────────────────────────────
            <AnimatePresence exitBeforeEnter>
              <YStack
                key={currentQuestionIndex}
                animation="medium"
                enterStyle={{ opacity: 0, x: 20 }}
                exitStyle={{ opacity: 0, x: -20 }}
                gap="$4"
                flex={1}
              >
                <Text
                  fontSize="$4"
                  color="$colorSubtle"
                  fontWeight="500"
                  testID="fill-in-blank-instruction"
                >
                  {currentQuestion.question_text}
                </Text>

                {currentQuestion.sentence_with_blanks ? (
                  <FillInBlankSentence
                    sentenceWithBlanks={currentQuestion.sentence_with_blanks}
                    filledBlanks={blankAnswers}
                    blankFeedback={fillInBlankValidated ? blankFeedback : undefined}
                    onBlankTap={handleBlankTap}
                    disabled={fillInBlankValidated || showFeedback}
                    testID="fill-in-blank-sentence"
                  />
                ) : null}

                <YStack marginTop="$4">
                  <WordBankSelector
                    words={wordBank}
                    usedIndices={usedIndices}
                    feedbackState={fillInBlankValidated ? wordFeedback : undefined}
                    onWordSelect={handleWordSelect}
                    disabled={fillInBlankValidated || showFeedback}
                    testID="word-bank-selector"
                  />
                </YStack>
              </YStack>
            </AnimatePresence>
          ) : (
            // ─── Multiple Choice (fallback) ───────────────────────────────
            <AnimatePresence exitBeforeEnter>
              <YStack
                key={currentQuestionIndex}
                animation="medium"
                enterStyle={{ opacity: 0, x: 20 }}
                exitStyle={{ opacity: 0, x: -20 }}
                gap="$4"
                flex={1}
              >
                <QuizQuestionCard
                  questionTypeLabel={currentQuestion.question_text}
                  primaryContent={currentQuestion.character ?? currentQuestion.question_text}
                  secondaryContent={currentQuestion.pinyin}
                  display={currentQuestion.character ? 'character' : 'meaning'}
                  feedback={feedbackState}
                  testID="quiz-question-card"
                />

                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  <AnswerOptionGrid
                    options={currentQuestion.options}
                    selectedOption={selectedAnswer}
                    correctAnswer={selectedAnswer !== null ? currentQuestion.correct_answer : null}
                    onSelect={handleAnswerSelect}
                    disabled={selectedAnswer !== null || showFeedback}
                    testID="answer-option-grid"
                  />
                ) : (
                  <YStack alignItems="center" paddingVertical="$4">
                    <Text color="$colorSubtle" fontSize="$3">
                      No answer options available.
                    </Text>
                  </YStack>
                )}
              </YStack>
            </AnimatePresence>
          )}
        </YStack>

        {/* Feedback overlay */}
        <FeedbackOverlay
          visible={showFeedback}
          isCorrect={feedbackIsCorrect ?? false}
          explanation={currentQuestion.explanation}
          sourceCitation={currentQuestion.source_citation}
          correctAnswer={
            feedbackIsCorrect === false ? currentQuestion.correct_answer : undefined
          }
          pointsEarned={feedbackIsCorrect === true ? currentPointsEarned : undefined}
          onNext={handleNext}
        />
      </YStack>
    </>
  )
}
