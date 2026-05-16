import { useEffect, useCallback, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useQuizGeneration } from '@/hooks/useQuizGeneration'
import { useQuizStore } from '@/stores/useQuizStore'
import { usePauseQuiz } from '@/hooks/usePauseQuiz'
import {
  LOADING_TIPS,
  TIP_ROTATION_INTERVAL_MS,
  getNextTipIndex,
} from '@/constants/tips'
import { EXERCISE_TYPE_LABELS } from '@/types/quiz'
import type { ExerciseType, QuizGenerationError, QuizResponse } from '@/types/quiz'

interface LoadingSearch {
  chapterId: number
  bookId: number
  exerciseType: string
  resumePaused?: boolean
}

export const Route = createFileRoute('/_authed/quiz/loading')({
  component: LoadingPage,
  validateSearch: (search: Record<string, unknown>): LoadingSearch => ({
    chapterId: Number(search.chapterId ?? 0),
    bookId: Number(search.bookId ?? 0),
    exerciseType: String(search.exerciseType ?? 'vocabulary'),
    resumePaused: search.resumePaused === true || search.resumePaused === 'true',
  }),
})

function LoadingPage() {
  const navigate = useNavigate()
  const { chapterId, bookId, exerciseType, resumePaused } = Route.useSearch()
  const startQuiz = useQuizStore((s) => s.startQuiz)
  const setQuizPayload = useQuizStore((s) => s.setQuizPayload)
  const restoreState = useQuizStore((s) => s.restoreState)

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[exerciseType as ExerciseType] ?? exerciseType
  const chapterNumber = bookId > 0 ? chapterId - bookId * 100 : chapterId

  const { resumeQuiz, deletePausedQuiz } = usePauseQuiz()
  const { mutate, isPending, isError, error, data, reset } = useQuizGeneration()

  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (chapterId <= 0 || bookId <= 0) return

    if (resumePaused) {
      const doResume = async () => {
        try {
          const pausedState = await resumeQuiz({ chapterId, exerciseType })
          if (pausedState) {
            if (!pausedState.questions || pausedState.questions.length === 0) {
              try {
                await deletePausedQuiz({ chapterId, exerciseType })
              } catch {
                /* ignore */
              }
              mutate({ chapterId, bookId, exerciseType })
              return
            }
            restoreState(pausedState)
            await deletePausedQuiz({ chapterId, exerciseType })
            void navigate({ to: '/quiz/play', replace: true })
          } else {
            mutate({ chapterId, bookId, exerciseType })
          }
        } catch {
          try {
            await deletePausedQuiz({ chapterId, exerciseType })
          } catch {
            /* ignore */
          }
          mutate({ chapterId, bookId, exerciseType })
        }
      }
      void doResume()
    } else {
      mutate({ chapterId, bookId, exerciseType })
    }
  }, [chapterId, bookId, exerciseType, resumePaused])

  useEffect(() => {
    if (!isPending) return
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => getNextTipIndex(prev, LOADING_TIPS.length))
    }, TIP_ROTATION_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isPending])

  useEffect(() => {
    if (!isPending) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        return prev + Math.random() * 8 + 2
      })
    }, 500)
    return () => clearInterval(interval)
  }, [isPending])

  useEffect(() => {
    if (data) {
      setProgress(100)
      const quizData = data as QuizResponse
      setQuizPayload(quizData)
      startQuiz(quizData.quiz_id, quizData, chapterId, bookId, exerciseType)
      const timeout = setTimeout(() => {
        void navigate({ to: '/quiz/play', replace: true })
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [data, startQuiz, setQuizPayload, navigate, chapterId, bookId, exerciseType])

  const handleCancel = useCallback(() => {
    window.history.back()
  }, [])

  const handleRetry = useCallback(() => {
    reset()
    setProgress(0)
    setCurrentTipIndex(0)
    mutate({ chapterId, bookId, exerciseType })
  }, [reset, mutate, chapterId, bookId, exerciseType])

  const isInsufficientContent = (error as QuizGenerationError | null)?.type === 'not_found'

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-background p-4"
      data-testid="quiz-loading-screen"
    >
      {isPending && (
        <div className="flex flex-col items-center gap-4 w-full px-4" data-testid="loading-state">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-semibold text-center" data-testid="loading-text">
            Generating your {exerciseTypeLabel} exercise for Chapter {chapterNumber}...
          </p>
          <Progress value={Math.min(progress, 100)} className="h-1" />
          <div className="h-20 w-full flex items-center justify-center" data-testid="tips-container">
            <p
              key={currentTipIndex}
              className="text-base text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-2 duration-300"
              data-testid="tip-text"
            >
              {LOADING_TIPS[currentTipIndex]}
            </p>
          </div>
          <Button variant="ghost" onClick={handleCancel} data-testid="cancel-button">
            Cancel
          </Button>
        </div>
      )}

      {isError && !isInsufficientContent && (
        <div className="flex flex-col items-center gap-4 px-4" data-testid="error-state">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-center" data-testid="error-text">
            {(error as QuizGenerationError)?.message ??
              `Couldn't generate ${exerciseTypeLabel} exercise. Try another type or retry.`}
          </p>
          <div className="flex gap-3">
            <Button onClick={handleRetry} data-testid="retry-button">
              Retry
            </Button>
            <Button variant="outline" onClick={handleCancel} data-testid="back-button">
              Back
            </Button>
          </div>
        </div>
      )}

      {isError && isInsufficientContent && (
        <div className="flex flex-col items-center gap-4 px-4" data-testid="insufficient-content-state">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <p className="text-lg font-semibold text-center" data-testid="insufficient-text">
            {(error as QuizGenerationError)?.message ??
              `Not enough content for ${exerciseTypeLabel} in this chapter. Try Vocabulary or Grammar instead.`}
          </p>
          <Button variant="outline" onClick={handleCancel} data-testid="insufficient-back-button">
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
