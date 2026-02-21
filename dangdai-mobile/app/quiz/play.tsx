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
 * - fill_in_blank: word bank + sentence with blank slots, auto-submit when all filled
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
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert } from 'react-native'
import { YStack, XStack, Text, Button, AnimatePresence } from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

import { useQuizStore } from '../../stores/useQuizStore'
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard'
import { AnswerOptionGrid } from '../../components/quiz/AnswerOptionGrid'
import { QuizProgress } from '../../components/quiz/QuizProgress'
import { WordBankSelector } from '../../components/quiz/WordBankSelector'
import { FillInBlankSentence } from '../../components/quiz/FillInBlankSentence'
import { validateFillInBlank, parseCorrectAnswers, allBlanksFilled } from '../../lib/validateFillInBlank'
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

  // Fill-in-blank store state
  const blankAnswers = useQuizStore((state) => state.blankAnswers)
  const setBlankAnswer = useQuizStore((state) => state.setBlankAnswer)
  const clearBlankAnswer = useQuizStore((state) => state.clearBlankAnswer)

  // ─── Local state ──────────────────────────────────────────────────────────

  /** The answer selected by the user for the current question (null = not answered yet) */
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  /** Feedback state for the question card border */
  const [feedbackState, setFeedbackState] = useState<QuizFeedbackVariant>('none')

  /** Per-blank feedback after fill-in-blank validation */
  const [blankFeedback, setBlankFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})

  /** Per-word feedback for the word bank after fill-in-blank validation */
  const [wordFeedback, setWordFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})

  /** Whether fill-in-blank has been validated (disables all interaction) */
  const [fillInBlankValidated, setFillInBlankValidated] = useState(false)

  // ─── On mount: initialize quiz session ───────────────────────────────────

  useEffect(() => {
    if (quizPayload) {
      // AC #3: call startQuiz on mount to initialize session state
      // Intentionally only run on mount — quizPayload is set before navigation
      // eslint-disable-next-line react-hooks/exhaustive-deps
      startQuiz(quizPayload.quiz_id)
    }
  }, []) // run once on mount — quizPayload is guaranteed set by loading.tsx before navigation

  // ─── Edge case: no quiz data ──────────────────────────────────────────────

  // Compute invalid-quiz flag outside render-phase to drive a useEffect redirect
  const isInvalidQuiz =
    !quizPayload || !quizPayload.questions || quizPayload.questions.length === 0

  const currentQuestion: QuizQuestion | null = isInvalidQuiz ? null : getCurrentQuestion()
  const isIndexOutOfRange = !isInvalidQuiz && currentQuestion === null

  // Redirect outside the render phase to avoid React rule violations (no side effects in render)
  useEffect(() => {
    if (isInvalidQuiz || isIndexOutOfRange) {
      router.replace('/(tabs)/books')
    }
  }, [isInvalidQuiz, isIndexOutOfRange, router])

  // ─── Feedback timeout ref (timer cleanup via useEffect) ──────────

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  // ─── Reset fill-in-blank local state when question changes ───────

  useEffect(() => {
    setBlankFeedback({})
    setWordFeedback({})
    setFillInBlankValidated(false)
    setSelectedAnswer(null)
    setFeedbackState('none')
  }, [currentQuestionIndex])

  // ─── Derived display values (only when quiz data is valid) ────────────────

  const displayVariant: QuizDisplayVariant = currentQuestion
    ? getDisplayVariant(currentQuestion)
    : 'meaning'
  const primaryContent: string = currentQuestion
    ? getPrimaryContent(currentQuestion, displayVariant)
    : ''
  const secondaryContent: string | undefined =
    currentQuestion && displayVariant === 'character' && currentQuestion.pinyin
      ? currentQuestion.pinyin
      : undefined

  const totalQuestions = quizPayload?.questions.length ?? 0
  const displayQuestionNumber = currentQuestionIndex + 1

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[(quizPayload?.exercise_type ?? '') as ExerciseType] ??
    quizPayload?.exercise_type ??
    ''

  // ─── Fill-in-blank: derived values ───────────────────────────────────────

  const isFillInBlank = currentQuestion?.exercise_type === 'fill_in_blank'

  const wordBank: string[] = currentQuestion?.word_bank ?? []

  // Words currently placed in blanks (for used-word tracking in word bank)
  const usedWords = new Set<string>(
    Object.values(blankAnswers).filter((w): w is string => w !== null)
  )

  // Total number of blanks derived from word_bank parsing or blank_positions
  const totalBlanks =
    currentQuestion?.blank_positions?.length ??
    (currentQuestion?.sentence_with_blanks?.split('___').length ?? 1) - 1

  // ─── Fill-in-blank: validation ───────────────────────────────────────────

  const handleFillInBlankValidation = useCallback(() => {
    if (!currentQuestion || fillInBlankValidated) return

    const correctAnswers = parseCorrectAnswers(currentQuestion.correct_answer)

    // Cast blankAnswers to Record<number, string> — all blanks are filled at this point
    const filledAnswers = blankAnswers as Record<number, string>
    const results = validateFillInBlank(filledAnswers, correctAnswers)

    // Compute per-blank feedback
    const newBlankFeedback: Record<number, 'correct' | 'incorrect'> = {}
    results.forEach((isCorrect, index) => {
      newBlankFeedback[index] = isCorrect ? 'correct' : 'incorrect'
    })

    // Compute per-word feedback for the word bank (align words used with their results)
    const newWordFeedback: Record<string, 'correct' | 'incorrect'> = {}
    Object.entries(blankAnswers).forEach(([blankIndexStr, word]) => {
      if (word) {
        const blankIndex = parseInt(blankIndexStr, 10)
        const result = results[blankIndex]
        if (result !== undefined) {
          newWordFeedback[word] = result ? 'correct' : 'incorrect'
        }
      }
    })

    // All blanks correct → full points; any incorrect → no points
    const allCorrect = results.every(Boolean)

    // Update store
    setAnswer(currentQuestionIndex, JSON.stringify(blankAnswers))
    if (allCorrect) {
      addScore(1)
    }

    // Update UI
    setBlankFeedback(newBlankFeedback)
    setWordFeedback(newWordFeedback)
    setFillInBlankValidated(true)

    // Advance after feedback delay
    feedbackTimeoutRef.current = setTimeout(() => {
      feedbackTimeoutRef.current = null
      if (isLastQuestion()) {
        router.replace('/(tabs)/books')
      } else {
        nextQuestion()
      }
    }, FEEDBACK_DELAY_MS)
  }, [
    currentQuestion,
    fillInBlankValidated,
    blankAnswers,
    currentQuestionIndex,
    setAnswer,
    addScore,
    isLastQuestion,
    nextQuestion,
    router,
  ])

  // ─── Fill-in-blank: word selection ───────────────────────────────────────

  const handleWordSelect = useCallback(
    (word: string) => {
      if (fillInBlankValidated || !currentQuestion) return

      // Find the first empty blank and fill it
      for (let i = 0; i < totalBlanks; i++) {
        if (!blankAnswers[i]) {
          setBlankAnswer(i, word)

          // Check if all blanks are now filled (after this word placement)
          const updatedAnswers = { ...blankAnswers, [i]: word }
          if (allBlanksFilled(updatedAnswers, totalBlanks)) {
            // Trigger validation via a small timeout so state has time to settle
            setTimeout(() => handleFillInBlankValidation(), 0)
          }
          return
        }
      }
    },
    [fillInBlankValidated, currentQuestion, totalBlanks, blankAnswers, setBlankAnswer, handleFillInBlankValidation]
  )

  // ─── Fill-in-blank: blank tap (return word to bank) ──────────────────────

  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (fillInBlankValidated) return
      clearBlankAnswer(blankIndex)
    },
    [fillInBlankValidated, clearBlankAnswer]
  )

  // ─── Answer selection handler (multiple choice) ───────────────────────────

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || !currentQuestion) return // Already answered

      const isCorrect = validateAnswer(answer, currentQuestion.correct_answer)

      // Update local state for immediate visual feedback
      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'incorrect')

      // Update store
      setAnswer(currentQuestionIndex, answer)
      if (isCorrect) {
        addScore(1)
      }

      // After feedback delay: advance to next question or complete quiz.
      // Timer ID stored in ref so the cleanup useEffect above can cancel it on unmount.
      feedbackTimeoutRef.current = setTimeout(() => {
        feedbackTimeoutRef.current = null
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

  // While redirect is pending (invalid/empty quiz), render nothing to avoid a flash
  if (isInvalidQuiz || isIndexOutOfRange || !currentQuestion) {
    return null
  }

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

          {/* Spacer for symmetry — fixed width balances the Leave button on the left */}
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
          {isFillInBlank ? (
            // ─── Fill-in-the-Blank Layout ─────────────────────────────────
            <AnimatePresence>
              <YStack
                key={currentQuestionIndex}
                animation="medium"
                enterStyle={{ opacity: 0, x: 20 }}
                exitStyle={{ opacity: 0, x: -20 }}
                gap="$4"
                flex={1}
              >
                {/* Instruction label */}
                <Text
                  fontSize="$4"
                  color="$colorSubtle"
                  fontWeight="500"
                  testID="fill-in-blank-instruction"
                >
                  {currentQuestion.question_text}
                </Text>

                {/* Sentence with blank slots */}
                {currentQuestion.sentence_with_blanks ? (
                  <FillInBlankSentence
                    sentenceWithBlanks={currentQuestion.sentence_with_blanks}
                    filledBlanks={blankAnswers}
                    blankFeedback={fillInBlankValidated ? blankFeedback : undefined}
                    onBlankTap={handleBlankTap}
                    disabled={fillInBlankValidated}
                    testID="fill-in-blank-sentence"
                  />
                ) : null}

                {/* Word bank */}
                <YStack marginTop="$4">
                  <WordBankSelector
                    words={wordBank}
                    usedWords={usedWords}
                    feedbackState={fillInBlankValidated ? wordFeedback : undefined}
                    onWordSelect={handleWordSelect}
                    disabled={fillInBlankValidated}
                    testID="word-bank-selector"
                  />
                </YStack>
              </YStack>
            </AnimatePresence>
          ) : (
            // ─── Multiple Choice Layout ───────────────────────────────────
            <>
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
            </>
          )}
        </YStack>
      </YStack>
    </>
  )
}
