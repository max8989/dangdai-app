import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/stores/useQuizStore'
import { useQuizPersistence } from '@/hooks/useQuizPersistence'
import { useQuestionTimer } from '@/hooks/useQuestionTimer'
import { usePremadeExercise } from '@/hooks/usePremadeExercise'
import { adaptPremadeContent } from '@/lib/premadeExerciseAdapter'
import {
  validateFillInBlank,
  parseCorrectAnswers,
  allBlanksFilled,
} from '@/lib/validateFillInBlank'

import { CompletionScreen } from '@/components/quiz/CompletionScreen'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { FeedbackOverlay } from '@/components/quiz/FeedbackOverlay'
import { FillInBlankSentence } from '@/components/quiz/FillInBlankSentence'
import { WordBankSelector } from '@/components/quiz/WordBankSelector'
import { ReadingPassageCard } from '@/components/quiz/ReadingPassageCard'
import { DialogueCard } from '@/components/quiz/DialogueCard'
import { AnswerOptionGrid } from '@/components/quiz/AnswerOptionGrid'
import { QuizQuestionCard } from '@/components/quiz/QuizQuestionCard'

import { EXERCISE_TYPE_LABELS } from '@/types/quiz'
import type { ExerciseType, QuizQuestion, DialogueQuestion } from '@/types/quiz'
import type { Json } from '@/types/supabase'
import type { DialogueAnswerResult } from '@/components/quiz/DialogueCard'
import type { QuizFeedbackVariant } from '@/components/quiz/QuizQuestionCard'

interface PremadeSearch {
  exerciseId: string
  chapterId: number
  bookId: number
}

export const Route = createFileRoute('/_authed/quiz/premade')({
  component: PremadePage,
  validateSearch: (search: Record<string, unknown>): PremadeSearch => ({
    exerciseId: String(search.exerciseId ?? ''),
    chapterId: Number(search.chapterId ?? 0),
    bookId: Number(search.bookId ?? 0),
  }),
})

const POINTS_PER_CORRECT = 10
const PREMADE_QUIZ_ID_PREFIX = 'premade-'

function validateAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

function getTotalQuestionCount(questions: QuizQuestion[]): number {
  return questions.reduce((total, q) => {
    if (q.exercise_type === 'reading_comprehension' && q.comprehension_questions) {
      return total + q.comprehension_questions.length
    }
    return total + 1
  }, 0)
}

function getCurrentQuestionPosition(
  questions: QuizQuestion[],
  currentQuestionIndex: number,
  subQuestionIndex: number,
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

function PremadePage() {
  const navigate = useNavigate()
  const { exerciseId, chapterId, bookId } = Route.useSearch()

  const { data: exercise, isLoading, error: fetchError } = usePremadeExercise(
    exerciseId || null,
  )

  const questions: QuizQuestion[] = useMemo(() => {
    if (!exercise?.content || !exercise?.exercise_type) return []
    return adaptPremadeContent(exercise.exercise_type, exercise.content)
  }, [exercise])

  const startQuiz = useQuizStore((s) => s.startQuiz)
  const setQuizPayload = useQuizStore((s) => s.setQuizPayload)
  const initializedExerciseIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (questions.length === 0 || !exercise) return
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

  const quizPayload = useQuizStore((s) => s.quizPayload)
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestion)
  const setAnswer = useQuizStore((s) => s.setAnswer)
  const nextQuestion = useQuizStore((s) => s.nextQuestion)
  const addScore = useQuizStore((s) => s.addScore)
  const isLastQuestion = useQuizStore((s) => s.isLastQuestion)
  const isComplete = useQuizStore((s) => s.isComplete)
  const completeQuiz = useQuizStore((s) => s.completeQuiz)
  const getQuizDuration = useQuizStore((s) => s.getQuizDuration)
  const getIncorrectAnswers = useQuizStore((s) => s.getIncorrectAnswers)
  const score = useQuizStore((s) => s.score)

  const blankAnswers = useQuizStore((s) => s.blankAnswers)
  const blankAnswerIndices = useQuizStore((s) => s.blankAnswerIndices)
  const setBlankAnswer = useQuizStore((s) => s.setBlankAnswer)
  const clearBlankAnswer = useQuizStore((s) => s.clearBlankAnswer)

  const showFeedback = useQuizStore((s) => s.showFeedback)
  const feedbackIsCorrect = useQuizStore((s) => s.feedbackIsCorrect)
  const triggerShowFeedback = useQuizStore((s) => s.triggerShowFeedback)
  const hideFeedback = useQuizStore((s) => s.hideFeedback)

  const timer = useQuestionTimer(currentQuestionIndex)
  const { saveQuestionResult, saveQuizAttempt, clearResumableQuiz } = useQuizPersistence()

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<QuizFeedbackVariant>('none')
  const [currentPointsEarned] = useState<number>(POINTS_PER_CORRECT)
  const [blankFeedback, setBlankFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})
  const [wordFeedback, setWordFeedback] = useState<Record<number, 'correct' | 'incorrect'>>({})
  const [fillInBlankValidated, setFillInBlankValidated] = useState(false)
  const [subQuestionIndex, setSubQuestionIndex] = useState(0)

  useEffect(() => {
    setBlankFeedback({})
    setWordFeedback({})
    setFillInBlankValidated(false)
    setSelectedAnswer(null)
    setFeedbackState('none')
    setSubQuestionIndex(0)
  }, [currentQuestionIndex])

  const currentQuestion: QuizQuestion | null = useMemo(() => {
    if (!quizPayload || !quizPayload.questions || quizPayload.questions.length === 0) return null
    return quizPayload.questions[currentQuestionIndex] ?? null
  }, [quizPayload, currentQuestionIndex])

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[(exercise?.exercise_type ?? '') as ExerciseType] ??
    exercise?.exercise_type ??
    'Workbook Exercise'

  const totalQuestions = getTotalQuestionCount(quizPayload?.questions ?? [])
  const displayQuestionNumber = getCurrentQuestionPosition(
    quizPayload?.questions ?? [],
    currentQuestionIndex,
    subQuestionIndex,
  )

  const isFillInBlank = currentQuestion?.exercise_type === 'fill_in_blank'
  const isDialogue = currentQuestion?.exercise_type === 'dialogue_completion'
  const isReadingComprehension = currentQuestion?.exercise_type === 'reading_comprehension'
  const isMatching = currentQuestion?.exercise_type === 'matching'
  const isSentenceConstruction = currentQuestion?.exercise_type === 'sentence_construction'

  const wordBank: string[] = currentQuestion?.word_bank ?? []
  const usedIndices = new Set<number>(
    Object.values(blankAnswerIndices).filter((i): i is number => i !== null),
  )
  const totalBlanks =
    currentQuestion?.blank_positions?.length ??
    (currentQuestion?.sentence_with_blanks?.split('___').length ?? 1) - 1

  const handleAnswerResult = useCallback(
    (isCorrect: boolean) => {
      triggerShowFeedback(isCorrect)
    },
    [triggerShowFeedback],
  )

  const handleNext = useCallback(() => {
    if (!showFeedback) return
    hideFeedback()
    if (isLastQuestion()) {
      const finalScore = useQuizStore.getState().score
      const finalAnswers = useQuizStore.getState().answers
      const totalQs = quizPayload?.questions.length ?? 0
      const exType = exercise?.exercise_type ?? ''

      saveQuizAttempt({
        chapterId,
        bookId,
        exerciseType: exType,
        score: finalScore,
        totalQuestions: totalQs,
        answersJson: finalAnswers as unknown as Json,
      })

      completeQuiz()
    } else {
      nextQuestion()
    }
  }, [
    showFeedback,
    hideFeedback,
    isLastQuestion,
    nextQuestion,
    completeQuiz,
    quizPayload,
    exercise,
    chapterId,
    bookId,
    saveQuizAttempt,
  ])

  const handleFillInBlankValidation = useCallback(
    (answersOverride?: Record<number, string | null>) => {
      if (!currentQuestion || fillInBlankValidated) return
      const timeSpentMs = timer.stopTimer()
      const correctAnswers = parseCorrectAnswers(currentQuestion.correct_answer)
      const filledAnswers = (answersOverride ?? blankAnswers) as Record<number, string>
      const results = validateFillInBlank(filledAnswers, correctAnswers)

      const newBlankFeedback: Record<number, 'correct' | 'incorrect'> = {}
      results.forEach((isCorrect, index) => {
        newBlankFeedback[index] = isCorrect ? 'correct' : 'incorrect'
      })

      const newWordFeedback: Record<number, 'correct' | 'incorrect'> = {}
      Object.entries(blankAnswerIndices).forEach(([blankIndexStr, wordBankIdx]) => {
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
      if (allCorrect) addScore(POINTS_PER_CORRECT)

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
    },
    [
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
    ],
  )

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
    [
      fillInBlankValidated,
      currentQuestion,
      showFeedback,
      totalBlanks,
      blankAnswers,
      setBlankAnswer,
      handleFillInBlankValidation,
    ],
  )

  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (fillInBlankValidated || showFeedback) return
      clearBlankAnswer(blankIndex)
    },
    [fillInBlankValidated, showFeedback, clearBlankAnswer],
  )

  const handleDialogueAnswer = useCallback(
    (result: DialogueAnswerResult) => {
      if (!currentQuestion) return
      const timeSpentMs = timer.stopTimer()
      setAnswer(currentQuestionIndex, result.selectedAnswer)
      if (result.correct) addScore(POINTS_PER_CORRECT)

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
    [
      currentQuestion,
      currentQuestionIndex,
      setAnswer,
      addScore,
      handleAnswerResult,
      timer,
      saveQuestionResult,
      chapterId,
      bookId,
    ],
  )

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
      setAnswer(currentQuestionIndex, JSON.stringify(currentAnswers))

      if (isCorrect) addScore(POINTS_PER_CORRECT)

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
    ],
  )

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null || !currentQuestion || showFeedback) return

      const timeSpentMs = timer.stopTimer()
      const isCorrect = validateAnswer(answer, currentQuestion.correct_answer)

      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'incorrect')
      setAnswer(currentQuestionIndex, answer)
      if (isCorrect) addScore(POINTS_PER_CORRECT)

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
    ],
  )

  const handleLeave = useCallback(() => {
    if (window.confirm('Leave exercise? Your progress will be saved.')) {
      window.history.back()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center bg-background">
        <p className="text-muted-foreground" data-testid="premade-loading">
          Loading exercise...
        </p>
      </div>
    )
  }

  if (fetchError || !exercise || questions.length === 0) {
    return (
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-background p-4 gap-4"
        data-testid="premade-error"
      >
        <p className="text-lg font-semibold text-center">Exercise not available</p>
        <p className="text-sm text-muted-foreground text-center">
          This exercise could not be loaded. Please try again.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

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
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
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
            void navigate({ to: '/books' })
          }}
        />
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col bg-background"
      data-testid="premade-exercise-screen"
    >
      <header className="flex items-center justify-between px-4 pb-2 pt-safe-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Leave
        </Button>
        <p className="text-base font-semibold">{exerciseTypeLabel}</p>
        <div className="w-[60px]" />
      </header>

      <div className="px-4 py-2">
        <QuizProgress
          currentQuestion={displayQuestionNumber}
          totalQuestions={totalQuestions}
        />
      </div>

      <main className="flex-1 px-4 pt-4 pb-4 space-y-4">
        {isMatching || isSentenceConstruction ? (
          <div className="rounded-md border bg-card p-4 text-center text-muted-foreground">
            <p className="font-medium mb-1">
              {isMatching ? 'Matching' : 'Sentence construction'} is coming soon on the web
            </p>
          </div>
        ) : isReadingComprehension &&
          currentQuestion.passage &&
          currentQuestion.comprehension_questions ? (
          <ReadingPassageCard
            key={currentQuestionIndex}
            passage={currentQuestion.passage}
            passagePinyin={currentQuestion.passage_pinyin}
            comprehensionQuestions={currentQuestion.comprehension_questions}
            currentSubQuestionIndex={subQuestionIndex}
            onAnswer={handleReadingSubQuestionAnswer}
            disabled={showFeedback}
          />
        ) : isDialogue && currentQuestion.dialogue_lines ? (
          <DialogueCard
            key={currentQuestionIndex}
            question={currentQuestion as DialogueQuestion}
            onAnswerResult={handleDialogueAnswer}
            disabled={showFeedback}
          />
        ) : isFillInBlank ? (
          <div key={currentQuestionIndex} className="space-y-4">
            <p className="text-base text-muted-foreground font-medium">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.sentence_with_blanks ? (
              <FillInBlankSentence
                sentenceWithBlanks={currentQuestion.sentence_with_blanks}
                filledBlanks={blankAnswers}
                blankFeedback={fillInBlankValidated ? blankFeedback : undefined}
                onBlankTap={handleBlankTap}
                disabled={fillInBlankValidated || showFeedback}
              />
            ) : null}
            <div className="mt-4">
              <WordBankSelector
                words={wordBank}
                usedIndices={usedIndices}
                feedbackState={fillInBlankValidated ? wordFeedback : undefined}
                onWordSelect={handleWordSelect}
                disabled={fillInBlankValidated || showFeedback}
              />
            </div>
          </div>
        ) : (
          <div key={currentQuestionIndex} className="space-y-4">
            <QuizQuestionCard
              questionTypeLabel={currentQuestion.question_text}
              primaryContent={currentQuestion.character ?? currentQuestion.question_text}
              secondaryContent={currentQuestion.pinyin}
              display={currentQuestion.character ? 'character' : 'meaning'}
              feedback={feedbackState}
            />
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <AnswerOptionGrid
                options={currentQuestion.options}
                selectedOption={selectedAnswer}
                correctAnswer={selectedAnswer !== null ? currentQuestion.correct_answer : null}
                onSelect={handleAnswerSelect}
                disabled={selectedAnswer !== null || showFeedback}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No answer options available.</p>
              </div>
            )}
          </div>
        )}
      </main>

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
    </div>
  )
}
