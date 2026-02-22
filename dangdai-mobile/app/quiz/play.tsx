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
 * - Shows FeedbackOverlay with explanation after each answer
 * - Plays sound effect (ding/bonk) simultaneously with feedback display
 * - User taps "Next" button on FeedbackOverlay to advance to the next question
 * - Disables answer interaction during feedback display
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
 * ├─────────────────────────────────┤
 * │  ✓ Correct!                  +10 │
 * │  咖啡 means coffee...             │  ← FeedbackOverlay (bottom)
 * │  Book 1, Ch 8 - Vocabulary       │
 * └─────────────────────────────────┘
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 * Story 4.6: Dialogue Completion Exercise
 * Story 4.7: Sentence Construction Exercise
 * Story 4.9: Immediate Answer Feedback (FeedbackOverlay + useSound)
 * Story 4.10: Quiz Progress Saving (timer + Supabase writes + crash recovery)
 * Story 4.11: Quiz Results Screen (CompletionScreen rendered when isComplete === true)
 * Story 4.5: Matching Exercise (MatchingExercise rendered when exercise_type === 'matching')
 * Story 4.12: Text Input Answer Type (TextInputAnswer rendered when input_type === 'text_input')
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, Text, Button, AnimatePresence } from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

import { useQuizStore } from '../../stores/useQuizStore'
import { useQuestionTimer } from '../../hooks/useQuestionTimer'
import { useQuizPersistence } from '../../hooks/useQuizPersistence'
import { CompletionScreen } from '../../components/quiz/CompletionScreen'
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard'
import { AnswerOptionGrid } from '../../components/quiz/AnswerOptionGrid'
import { QuizProgress } from '../../components/quiz/QuizProgress'
import { WordBankSelector } from '../../components/quiz/WordBankSelector'
import { FillInBlankSentence } from '../../components/quiz/FillInBlankSentence'
import { FeedbackOverlay } from '../../components/quiz/FeedbackOverlay'
import { validateFillInBlank, parseCorrectAnswers, allBlanksFilled } from '../../lib/validateFillInBlank'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType, QuizQuestion, DialogueQuestion } from '../../types/quiz'
import type { Json } from '../../types/supabase'
import type { QuizDisplayVariant, QuizFeedbackVariant } from '../../components/quiz/QuizQuestionCard'
import { DialogueCard } from '../../components/quiz/DialogueCard'
import type { DialogueAnswerResult } from '../../components/quiz/DialogueCard'
import { SentenceBuilder } from '../../components/quiz/SentenceBuilder'
import { MatchingExercise } from '../../components/quiz/MatchingExercise'
import { ReadingPassageCard } from '../../components/quiz/ReadingPassageCard'
import { TextInputAnswer } from '../../components/quiz/TextInputAnswer'
import { preloadSounds, unloadSounds, playSound } from '../../hooks/useSound'

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

/**
 * Calculate the total number of scorable questions in the quiz.
 * Reading comprehension passages count as multiple questions (one per sub-question).
 * All other exercise types count as 1 question each.
 * Story 4.8, Task 4.7.
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
 * Calculate the current question position (1-based) accounting for sub-questions.
 * For reading comprehension, this includes the current sub-question index.
 * Story 4.8, Task 4.7.
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
  
  // Add current question position
  const currentQ = questions[currentQuestionIndex]
  if (currentQ?.exercise_type === 'reading_comprehension') {
    position += subQuestionIndex + 1
  } else {
    position += 1
  }
  
  return position
}

/**
 * Determine the question type for text input validation.
 * Story 4.12: Text Input Answer Type
 * @param question - The quiz question
 * @returns 'pinyin' if asking for pinyin, 'meaning' otherwise
 */
function getTextInputQuestionType(question: QuizQuestion): 'pinyin' | 'meaning' {
  const questionTextLower = question.question_text.toLowerCase()
  
  // If question asks for pinyin → pinyin type
  if (questionTextLower.includes('pinyin')) {
    return 'pinyin'
  }
  
  // Default to meaning (case-insensitive exact match is safe for all types)
  return 'meaning'
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Points awarded for a correct answer */
const POINTS_PER_CORRECT = 10

export default function QuizPlayScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // ─── Store state ─────────────────────────────────────────────────────────

  const quizPayload = useQuizStore((state) => state.quizPayload)
  const currentQuestionIndex = useQuizStore((state) => state.currentQuestion)
  const setAnswer = useQuizStore((state) => state.setAnswer)
  const nextQuestion = useQuizStore((state) => state.nextQuestion)
  const addScore = useQuizStore((state) => state.addScore)
  const getCurrentQuestion = useQuizStore((state) => state.getCurrentQuestion)
  const isLastQuestion = useQuizStore((state) => state.isLastQuestion)

  // Fill-in-blank store state
  const blankAnswers = useQuizStore((state) => state.blankAnswers)
  const blankAnswerIndices = useQuizStore((state) => state.blankAnswerIndices)
  const setBlankAnswer = useQuizStore((state) => state.setBlankAnswer)
  const clearBlankAnswer = useQuizStore((state) => state.clearBlankAnswer)

  // Sentence construction store state (Story 4.7)
  const clearTiles = useQuizStore((state) => state.clearTiles)

  // Feedback overlay store state (Story 4.9)
  const showFeedback = useQuizStore((state) => state.showFeedback)
  const feedbackIsCorrect = useQuizStore((state) => state.feedbackIsCorrect)
  const triggerShowFeedback = useQuizStore((state) => state.triggerShowFeedback)
  const hideFeedback = useQuizStore((state) => state.hideFeedback)

  // Quiz metadata for Supabase writes (Story 4.10)
  const chapterId = useQuizStore((state) => state.chapterId)
  const bookId = useQuizStore((state) => state.bookId)

  // Story 4.11: completion state
  const isComplete = useQuizStore((state) => state.isComplete)
  const completeQuiz = useQuizStore((state) => state.completeQuiz)
  const getQuizDuration = useQuizStore((state) => state.getQuizDuration)
  const getIncorrectAnswers = useQuizStore((state) => state.getIncorrectAnswers)
  const score = useQuizStore((state) => state.score)

  // ─── Story 4.10 hooks: per-question timer + Supabase persistence ──────────

  const timer = useQuestionTimer(currentQuestionIndex)
  const { saveQuestionResult, saveQuizAttempt, clearResumableQuiz } = useQuizPersistence()

  // ─── Local state ──────────────────────────────────────────────────────────

  /** The answer selected by the user for the current question (null = not answered yet) */
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  /** Feedback state for the question card border */
  const [feedbackState, setFeedbackState] = useState<QuizFeedbackVariant>('none')

  /**
   * Points earned for the current question — may differ from POINTS_PER_CORRECT for
   * matching exercises where score is proportional (e.g., 6/6 with 2 errors = 90% = 9 pts).
   * Reset to POINTS_PER_CORRECT on question change.
   */
  const [currentPointsEarned, setCurrentPointsEarned] = useState<number>(POINTS_PER_CORRECT)

  /** Per-blank feedback after fill-in-blank validation */
  const [blankFeedback, setBlankFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})

  /**
   * Per-word-bank-index feedback after fill-in-blank validation.
   * Index-based (not value-based) to handle duplicate words correctly (M1 fix).
   */
  const [wordFeedback, setWordFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})

  /** Whether fill-in-blank has been validated (disables all interaction) */
  const [fillInBlankValidated, setFillInBlankValidated] = useState(false)

  /** Reading comprehension: current sub-question index (0-based, local state) */
  const [subQuestionIndex, setSubQuestionIndex] = useState(0)

  // ─── On mount: preload sounds ────────────────────────────────────────────

  // loading.tsx calls startQuiz(quizId, payload, chapterId, bookId, exerciseType) before
  // navigating here, so the store is already fully populated. We must NOT call startQuiz
  // again on mount — doing so would overwrite chapterId/bookId/exerciseType with null
  // (the defaults), breaking Supabase writes and crash-recovery resume context (Story 4.10).
  useEffect(() => {
    // Preload sounds on quiz screen mount; unload on unmount (Story 4.9)
    void preloadSounds()
    return () => {
      void unloadSounds()
    }
  }, []) // mount-only intentional

  // ─── Edge case: no quiz data ──────────────────────────────────────────────

  // Compute invalid-quiz flag outside render-phase to drive a useEffect redirect
  const isInvalidQuiz =
    !quizPayload || !quizPayload.questions || quizPayload.questions.length === 0

  const currentQuestion: QuizQuestion | null = isInvalidQuiz ? null : getCurrentQuestion()
  const isIndexOutOfRange = !isInvalidQuiz && currentQuestion === null

  // Redirect outside the render phase to avoid React rule violations (no side effects in render).
  // Skip redirect when isComplete — after quiz completion, quizPayload is cleared by
  // clearResumableQuiz() but CompletionScreen should still render (it uses captured props).
  useEffect(() => {
    if ((isInvalidQuiz || isIndexOutOfRange) && !isComplete) {
      router.replace('/(tabs)/books')
    }
  }, [isInvalidQuiz, isIndexOutOfRange, isComplete, router])

  // ─── Manual advance handler ─────────────────────────────────────────────
  // User taps "Next" on FeedbackOverlay to advance to the next question.
  // Replaces the previous auto-advance timer for a better learning experience.

  const handleNext = useCallback(() => {
    if (!showFeedback) return

    hideFeedback()
    if (isLastQuestion()) {
      // On quiz completion: save full quiz attempt (Story 4.10, Tasks 5.6, 5.7)
      const finalScore = useQuizStore.getState().score
      const finalAnswers = useQuizStore.getState().answers
      const totalQs = quizPayload?.questions.length ?? 0
      const exType = useQuizStore.getState().exerciseType ?? quizPayload?.exercise_type ?? ''
      const capChapterId = useQuizStore.getState().chapterId ?? quizPayload?.chapter_id ?? 0
      const capBookId = useQuizStore.getState().bookId ?? quizPayload?.book_id ?? 0

      // Save quiz attempt (async — fire without blocking navigation)
      saveQuizAttempt({
        chapterId: capChapterId,
        bookId: capBookId,
        exerciseType: exType,
        score: finalScore,
        totalQuestions: totalQs,
        answersJson: finalAnswers as unknown as Json,
      })

      // Show CompletionScreen in-place (Story 4.11) — no navigation needed.
      // NOTE: clearResumableQuiz() is NOT called here. The store state must remain
      // intact so CompletionScreen can read score, answers, chapterId, etc. from it.
      // The persisted state is cleared when the user taps "Continue" on CompletionScreen,
      // which triggers onContinue → clearResumableQuiz() → router.replace('/(tabs)/books').
      completeQuiz()
    } else {
      nextQuestion()
    }
  }, [showFeedback, hideFeedback, isLastQuestion, nextQuestion, completeQuiz, quizPayload, saveQuizAttempt])

  // ─── Reset local state when question changes ──────────────────────────────
  // Fill-in-blank state resets here. Multiple-choice state (selectedAnswer,
  // feedbackState) is also reset here — this is safe because the timeout callback
  // that advances to the next question already resets them inline for the MCQ→MCQ
  // path, and the dialogue path never sets them at all. Resetting here ensures
  // stale MCQ state is cleared when the exercise type changes (e.g. MCQ→Dialogue→MCQ),
  // which was previously a bug (M2 fix).

  useEffect(() => {
    setBlankFeedback({})
    setWordFeedback({})
    setFillInBlankValidated(false)
    setSelectedAnswer(null)
    setFeedbackState('none')
    setCurrentPointsEarned(POINTS_PER_CORRECT)
    setSubQuestionIndex(0)
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

  // Calculate total questions including reading comprehension sub-questions (Story 4.8, Task 4.7)
  const totalQuestions = getTotalQuestionCount(quizPayload?.questions ?? [])
  // Calculate current position including sub-questions (Story 4.8, Task 4.7)
  const displayQuestionNumber = getCurrentQuestionPosition(
    quizPayload?.questions ?? [],
    currentQuestionIndex,
    subQuestionIndex
  )

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[(quizPayload?.exercise_type ?? '') as ExerciseType] ??
    quizPayload?.exercise_type ??
    ''

  // ─── Exercise type flags ──────────────────────────────────────────────────

  const isFillInBlank = currentQuestion?.exercise_type === 'fill_in_blank'
  const isDialogue = currentQuestion?.exercise_type === 'dialogue_completion'
  const isSentenceConstruction = currentQuestion?.exercise_type === 'sentence_construction'
  const isMatching = currentQuestion?.exercise_type === 'matching'
  const isReadingComprehension = currentQuestion?.exercise_type === 'reading_comprehension'
  
  // Text input detection (Story 4.12): check input_type field, fallback to checking for absence of options
  const isTextInput = currentQuestion?.input_type === 'text_input' || 
    (currentQuestion?.input_type !== 'multiple_choice' && 
     (!currentQuestion?.options || currentQuestion.options.length === 0))

  const wordBank: string[] = currentQuestion?.word_bank ?? []

  // Word-bank indices currently placed in blanks (index-based to handle duplicates)
  const usedIndices = new Set<number>(
    Object.values(blankAnswerIndices).filter((i): i is number => i !== null)
  )

  // Total number of blanks derived from word_bank parsing or blank_positions
  const totalBlanks =
    currentQuestion?.blank_positions?.length ??
    (currentQuestion?.sentence_with_blanks?.split('___').length ?? 1) - 1

  // ─── Unified answer result handler (Story 4.9) ───────────────────────────
  /**
   * Central handler called after any exercise type validates an answer.
   * Triggers FeedbackOverlay + plays sound simultaneously.
   * Auto-advance is handled by the useEffect above that watches showFeedback.
   */
  const handleAnswerResult = useCallback(
    (isCorrect: boolean) => {
      // Show feedback overlay + play sound simultaneously
      triggerShowFeedback(isCorrect)
      void playSound(isCorrect ? 'correct' : 'incorrect')
    },
    [triggerShowFeedback]
  )

  // ─── Fill-in-blank: validation ───────────────────────────────────────────

  /**
   * Validate the current fill-in-blank question.
   * Accepts an optional `answersOverride` so callers can pass the freshly-computed
   * answers synchronously without waiting for Zustand state to settle (avoids the
   * race condition where the last word placed has not yet propagated to the store
   * when validation fires).
   */
  const handleFillInBlankValidation = useCallback((answersOverride?: Record<number, string | null>) => {
    if (!currentQuestion || fillInBlankValidated) return

    // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
    const timeSpentMs = timer.stopTimer()

    const correctAnswers = parseCorrectAnswers(currentQuestion.correct_answer)

    // Use the override if provided (avoids stale-closure race on last word placement)
    const filledAnswers = (answersOverride ?? blankAnswers) as Record<number, string>
    const results = validateFillInBlank(filledAnswers, correctAnswers)

    // Compute per-blank feedback
    const newBlankFeedback: Record<number, 'correct' | 'incorrect'> = {}
    results.forEach((isCorrect, index) => {
      newBlankFeedback[index] = isCorrect ? 'correct' : 'incorrect'
    })

    // Compute per-word-bank-index feedback (index-based to handle duplicate words)
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

    // All blanks correct → full points; any incorrect → no points
    const allCorrect = results.every(Boolean)

    // Update store (serialize the authoritative answers used for validation)
    setAnswer(currentQuestionIndex, JSON.stringify(filledAnswers))
    if (allCorrect) {
      addScore(POINTS_PER_CORRECT)
    }

    // Save per-question result to Supabase — fire-and-forget (Story 4.10, Task 5.4)
    saveQuestionResult({
      chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
      bookId: bookId ?? quizPayload?.book_id ?? 0,
      exerciseType: currentQuestion.exercise_type,
      vocabularyItem: currentQuestion.character ?? null,
      grammarPattern: null,
      correct: allCorrect,
      timeSpentMs,
    })

    // Update UI
    setBlankFeedback(newBlankFeedback)
    setWordFeedback(newWordFeedback)
    setFillInBlankValidated(true)

    // Trigger unified feedback overlay + sound (Story 4.9)
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
    quizPayload,
  ])

  // ─── Fill-in-blank: word selection ───────────────────────────────────────

  const handleWordSelect = useCallback(
    (word: string, wordBankIndex: number) => {
      if (fillInBlankValidated || !currentQuestion || showFeedback) return

      // Guard: if all blanks are already filled (e.g. race between validation
      // trigger and another tap), silently ignore — prevents confusing no-op (M4 fix)
      if (allBlanksFilled(blankAnswers, totalBlanks)) return

      // Find the first empty blank and fill it
      for (let i = 0; i < totalBlanks; i++) {
        if (!blankAnswers[i]) {
          // Pass wordBankIndex so the store can track which bank slot is used (M1 fix)
          setBlankAnswer(i, word, wordBankIndex)

          // Compute updated answers synchronously so validation sees the final state.
          // Do NOT use setTimeout here — pass updatedAnswers directly to avoid a
          // stale-closure race where the store hasn't flushed yet (H1 fix).
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

  // ─── Fill-in-blank: blank tap (return word to bank) ──────────────────────

  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (fillInBlankValidated || showFeedback) return
      clearBlankAnswer(blankIndex)
    },
    [fillInBlankValidated, showFeedback, clearBlankAnswer]
  )

  // ─── Sentence construction answer handler (Story 4.7 + 4.9 + 4.10) ─────────

  const handleSentenceAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentQuestion) return

      // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
      const timeSpentMs = timer.stopTimer()

      setAnswer(currentQuestionIndex, isCorrect ? currentQuestion.correct_answer : '')
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      // Save per-question result to Supabase — fire-and-forget (Story 4.10, Task 5.4)
      saveQuestionResult({
        chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
        bookId: bookId ?? quizPayload?.book_id ?? 0,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null, // sentence_construction: null per mapping table
        grammarPattern: null,
        correct: isCorrect,
        timeSpentMs,
      })

      // Clear tile placement state for next question
      clearTiles()

      // Trigger unified feedback overlay + sound (Story 4.9)
      handleAnswerResult(isCorrect)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, clearTiles, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId, quizPayload]
  )

  // ─── Matching exercise completion handler (Story 4.5) ────────────────────────

  const handleMatchingComplete = useCallback(
    (result: { score: number; incorrectAttempts: number }) => {
      if (!currentQuestion) return

      // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
      const timeSpentMs = timer.stopTimer()

      // Record as correct if score >= 50 (majority of pairs matched correctly)
      const isCorrect = result.score >= 50

      // Use score percentage as points (capped at POINTS_PER_CORRECT)
      const pointsEarned = Math.round((result.score / 100) * POINTS_PER_CORRECT)

      // Store actual points earned so FeedbackOverlay displays the correct value
      setCurrentPointsEarned(pointsEarned)

      setAnswer(currentQuestionIndex, JSON.stringify({ score: result.score, incorrectAttempts: result.incorrectAttempts }))
      if (pointsEarned > 0) {
        addScore(pointsEarned)
      }

      // Save per-question result to Supabase — fire-and-forget (Story 4.10, Task 5.4)
      saveQuestionResult({
        chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
        bookId: bookId ?? quizPayload?.book_id ?? 0,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null,
        grammarPattern: null,
        correct: isCorrect,
        timeSpentMs,
      })

      // Trigger unified feedback overlay + sound (Story 4.9)
      handleAnswerResult(isCorrect)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId, quizPayload]
  )

  // ─── Dialogue answer result handler (Story 4.6 + 4.9 + 4.10) ───────────────

  const handleDialogueAnswer = useCallback(
    (result: DialogueAnswerResult) => {
      if (!currentQuestion) return

      // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
      const timeSpentMs = timer.stopTimer()

      // Record the answer in the store
      setAnswer(currentQuestionIndex, result.selectedAnswer)
      if (result.correct) {
        addScore(POINTS_PER_CORRECT)
      }

      // Save per-question result to Supabase — fire-and-forget (Story 4.10, Task 5.4)
      saveQuestionResult({
        chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
        bookId: bookId ?? quizPayload?.book_id ?? 0,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: null, // dialogue_completion: null per mapping table
        grammarPattern: null,
        correct: result.correct,
        timeSpentMs,
      })

      // Trigger unified feedback overlay + sound (Story 4.9)
      handleAnswerResult(result.correct)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId, quizPayload]
  )

  // ─── Text input answer handler (Story 4.12) ──────────────────────────────

  const handleTextInputAnswer = useCallback(
    (userAnswer: string, isCorrect: boolean) => {
      if (!currentQuestion) return

      // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
      const timeSpentMs = timer.stopTimer()

      setAnswer(currentQuestionIndex, userAnswer)
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      // Save per-question result to Supabase — fire-and-forget (Story 4.10, Task 5.4)
      saveQuestionResult({
        chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
        bookId: bookId ?? quizPayload?.book_id ?? 0,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: currentQuestion.character ?? null,
        grammarPattern: currentQuestion.exercise_type === 'grammar' ? currentQuestion.question_text : null,
        correct: isCorrect,
        timeSpentMs,
      })

      // Trigger unified feedback overlay + sound (Story 4.9)
      handleAnswerResult(isCorrect)
    },
    [currentQuestion, currentQuestionIndex, setAnswer, addScore, handleAnswerResult,
     timer, saveQuestionResult, chapterId, bookId, quizPayload]
  )

  // ─── Reading comprehension sub-question answer handler (Story 4.8) ─────────

  const handleReadingSubQuestionAnswer = useCallback(
    (isCorrect: boolean, selectedAnswer: string) => {
      if (!currentQuestion || !currentQuestion.comprehension_questions) return

      const totalSubQuestions = currentQuestion.comprehension_questions.length
      const isLastSubQuestion = subQuestionIndex === totalSubQuestions - 1

      // Stop timer only on the last sub-question (Story 4.10, Task 5.3)
      const timeSpentMs = isLastSubQuestion ? timer.stopTimer() : 0

      // Record answer in store (JSON array of sub-answers)
      // Read current state synchronously to build up the answers array
      const existingAnswer = useQuizStore.getState().answers[currentQuestionIndex]
      const currentAnswers: string[] = existingAnswer
        ? (JSON.parse(existingAnswer) as string[])
        : []
      currentAnswers[subQuestionIndex] = selectedAnswer
      const serializedAnswers = JSON.stringify(currentAnswers)
      setAnswer(currentQuestionIndex, serializedAnswers)

      // Add score for this sub-question
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      // If this is the last sub-question, save to Supabase
      if (isLastSubQuestion) {
        // Calculate overall correctness: all sub-questions must be correct
        const allSubAnswersCorrect = currentAnswers.every((ans, idx) => {
          return ans === currentQuestion.comprehension_questions![idx].correct_answer
        })

        saveQuestionResult({
          chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
          bookId: bookId ?? quizPayload?.book_id ?? 0,
          exerciseType: currentQuestion.exercise_type,
          vocabularyItem: null,
          grammarPattern: null,
          correct: allSubAnswersCorrect,
          timeSpentMs,
        })

        // Trigger feedback for the entire passage (not just last sub-question)
        // FIX: Use allSubAnswersCorrect instead of isCorrect
        handleAnswerResult(allSubAnswersCorrect)
      } else {
        // Advance to next sub-question within the same passage
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
      quizPayload,
    ]
  )

  // ─── Answer selection handler (multiple choice) ───────────────────────────

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || !currentQuestion || showFeedback) return // Already answered

      // Stop timer and get elapsed ms (Story 4.10, Task 5.3)
      const timeSpentMs = timer.stopTimer()

      const isCorrect = validateAnswer(answer, currentQuestion.correct_answer)

      // Update local state for immediate visual feedback
      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'incorrect')

      // Update store
      setAnswer(currentQuestionIndex, answer)
      if (isCorrect) {
        addScore(POINTS_PER_CORRECT)
      }

      // Save per-question result to Supabase — fire-and-forget, do NOT await (Story 4.10, Task 5.4)
      saveQuestionResult({
        chapterId: chapterId ?? quizPayload?.chapter_id ?? 0,
        bookId: bookId ?? quizPayload?.book_id ?? 0,
        exerciseType: currentQuestion.exercise_type,
        vocabularyItem: currentQuestion.character ?? null,
        grammarPattern: currentQuestion.exercise_type === 'grammar' ? currentQuestion.question_text : null,
        correct: isCorrect,
        timeSpentMs,
      })

      // Trigger unified feedback overlay + sound (Story 4.9)
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
      quizPayload,
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

  // While redirect is pending (invalid/empty quiz), render nothing to avoid a flash.
  // Skip this guard when isComplete — CompletionScreen should render even if
  // currentQuestion is null (quiz is done, we show results not questions).
  if ((isInvalidQuiz || isIndexOutOfRange || !currentQuestion) && !isComplete) {
    return null
  }

  // ─── CompletionScreen render (Story 4.11) ─────────────────────────────────
  // When the quiz is complete, render the CompletionScreen in-place using
  // AnimatePresence for the entrance animation. The quiz UI exits via AnimatePresence.

  const quizExerciseType = (quizPayload?.exercise_type ?? 'vocabulary') as ExerciseType
  // Calculate total including reading comprehension sub-questions (Story 4.8, Task 4.7)
  const totalQuestionsCount = getTotalQuestionCount(quizPayload?.questions ?? [])
  // Points per correct = POINTS_PER_CORRECT (10); score = total points accumulated
  const correctAnswerCount = Math.round(score / POINTS_PER_CORRECT)

  if (isComplete) {
    const incorrectAnswers = getIncorrectAnswers()
    const durationMins = getQuizDuration()

    const incorrectItems = incorrectAnswers.map((item) => {
      const question = quizPayload?.questions[item.questionIndex]
      return {
        questionText: question?.question_text ?? '',
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
            chapterId={chapterId ?? quizPayload?.chapter_id ?? 0}
            bookId={bookId ?? quizPayload?.book_id ?? 0}
            exerciseType={quizExerciseType}
            correctCount={correctAnswerCount}
            totalQuestions={totalQuestionsCount}
            pointsEarned={score}
            durationMinutes={durationMins}
            incorrectItems={incorrectItems}
            onContinue={() => {
              // Clear persisted quiz state (crash recovery no longer needed)
              // before navigating away from the CompletionScreen
              clearResumableQuiz()
              router.replace('/(tabs)/books')
            }}
            testID="completion-screen"
          />
        </YStack>
      </AnimatePresence>
    )
  }

  // At this point isComplete is false (the block above returns early for isComplete).
  // The render guard ensures currentQuestion is non-null when isComplete is false.
  if (!currentQuestion) return null

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
        paddingBottom={insets.bottom}
        testID="quiz-play-screen"
      >
        {/* Custom header — paddingTop uses safe area inset for status bar / Dynamic Island */}
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
          {isMatching ? (
            // ─── Matching Exercise Layout (Story 4.5) ────────────────────
            // NOTE: MatchingExercise has its own "X/Y paired" progress indicator
            // rendered internally (testID="matching-progress-text"). The QuizProgress
            // bar above shows question-level progress (e.g., 1/N questions). This is
            // intentional: matching is a single multi-step question, so the internal
            // indicator shows pair-level progress while the outer bar shows position
            // in the overall quiz. Story 4.5 Task 5.4 was fulfilled by the component
            // managing its own pair-level display.
            currentQuestion.pairs && currentQuestion.pairs.length > 0 ? (
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
            // ─── Sentence Construction Layout (Story 4.7) ─────────────────
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
                  />
                </YStack>
              </AnimatePresence>
            ) : null
          ) : isReadingComprehension ? (
            // ─── Reading Comprehension Layout (Story 4.8) ─────────────────
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
            // ─── Dialogue Completion Layout ───────────────────────────────
            // Runtime guard: dialogue_lines is required for DialogueCard but
            // typed as optional on QuizQuestion. If the backend omits it
            // (e.g. API regression), fall through to the MCQ layout rather
            // than crashing with "Cannot read properties of undefined" (M4 fix).
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
            // ─── Fill-in-the-Blank Layout ─────────────────────────────────
            <AnimatePresence exitBeforeEnter>
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
                    disabled={fillInBlankValidated || showFeedback}
                    testID="fill-in-blank-sentence"
                  />
                ) : null}

                {/* Word bank */}
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
          ) : isTextInput ? (
            // ─── Text Input Layout (Story 4.12) ───────────────────────────
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
                  primaryContent={primaryContent}
                  secondaryContent={secondaryContent}
                  display={displayVariant}
                  feedback="none"
                  testID="quiz-question-card"
                />

                {/* Text input answer */}
                <TextInputAnswer
                  placeholder={currentQuestion.input_placeholder ?? 'Type your answer...'}
                  correctAnswer={currentQuestion.correct_answer}
                  questionType={getTextInputQuestionType(currentQuestion)}
                  onSubmit={handleTextInputAnswer}
                  disabled={showFeedback}
                />
              </YStack>
            </AnimatePresence>
          ) : (
            // ─── Multiple Choice Layout ───────────────────────────────────
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
                  primaryContent={primaryContent}
                  secondaryContent={secondaryContent}
                  display={displayVariant}
                  feedback={feedbackState}
                  testID="quiz-question-card"
                />

                {/* Answer options */}
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
                  // Edge case: question without options
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

        {/* Feedback overlay — rendered at bottom of screen for all exercise types (Story 4.9) */}
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
