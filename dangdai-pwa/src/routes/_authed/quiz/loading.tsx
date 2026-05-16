import { useEffect, useCallback, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, BellRing, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useQuizStore } from '@/stores/useQuizStore'
import { usePauseQuiz } from '@/hooks/usePauseQuiz'
import {
  requestNotificationPermission,
  startGenerationJob,
} from '@/lib/generationJobs'
import { useGenerationJobsStore } from '@/stores/useGenerationJobsStore'
import {
  LOADING_TIPS,
  TIP_ROTATION_INTERVAL_MS,
  getNextTipIndex,
} from '@/constants/tips'
import { EXERCISE_TYPE_LABELS } from '@/types/quiz'
import type { ExerciseType } from '@/types/quiz'

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
  const restoreState = useQuizStore((s) => s.restoreState)

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[exerciseType as ExerciseType] ?? exerciseType
  const chapterNumber = bookId > 0 ? chapterId - bookId * 100 : chapterId

  const { resumeQuiz, deletePausedQuiz } = usePauseQuiz()

  const [jobId, setJobId] = useState<string | null>(null)
  const job = useGenerationJobsStore((s) => (jobId ? s.jobs[jobId] : undefined))
  const removeJob = useGenerationJobsStore((s) => s.removeJob)

  const [resuming, setResuming] = useState(false)

  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const startedJobRef = useRef(false)

  // Kick off either the resume flow or a new generation job exactly once.
  useEffect(() => {
    if (chapterId <= 0 || bookId <= 0) return
    if (startedJobRef.current) return
    startedJobRef.current = true

    if (resumePaused) {
      setResuming(true)
      ;(async () => {
        try {
          const pausedState = await resumeQuiz({ chapterId, exerciseType })
          if (pausedState && pausedState.questions && pausedState.questions.length > 0) {
            restoreState(pausedState)
            await deletePausedQuiz({ chapterId, exerciseType })
            void navigate({ to: '/quiz/play', replace: true })
            return
          }
          // No usable paused state — fall through to generation
          if (pausedState) {
            try {
              await deletePausedQuiz({ chapterId, exerciseType })
            } catch {
              /* ignore */
            }
          }
          kickOffJob()
        } catch {
          try {
            await deletePausedQuiz({ chapterId, exerciseType })
          } catch {
            /* ignore */
          }
          kickOffJob()
        } finally {
          setResuming(false)
        }
      })()
    } else {
      kickOffJob()
    }

    function kickOffJob() {
      void requestNotificationPermission()
      const id = startGenerationJob({
        params: {
          source: 'chapter',
          chapterId,
          bookId,
          exerciseType: exerciseType as ExerciseType,
        },
      })
      setJobId(id)
    }
  }, [
    chapterId,
    bookId,
    exerciseType,
    resumePaused,
    resumeQuiz,
    deletePausedQuiz,
    restoreState,
    navigate,
  ])

  const isPending = resuming || job?.status === 'generating' || (jobId === null && !resumePaused)

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

  // When job becomes ready while user is still on this page, auto-start.
  useEffect(() => {
    if (!job || job.status !== 'ready' || !job.result) return
    setProgress(100)
    startQuiz(
      job.result.quiz_id,
      job.result,
      job.chapterId ?? job.result.chapter_id,
      job.bookId ?? job.result.book_id,
      job.exerciseType ?? job.result.exercise_type,
      job.chapterIdEnd ?? null,
    )
    const id = job.id
    const timeout = setTimeout(() => {
      removeJob(id)
      void navigate({ to: '/quiz/play', replace: true })
    }, 300)
    return () => clearTimeout(timeout)
  }, [job, startQuiz, removeJob, navigate])

  const handleCancel = useCallback(() => {
    if (jobId) removeJob(jobId)
    window.history.back()
  }, [jobId, removeJob])

  const handleLeave = useCallback(() => {
    // Keep the job running — user gets notified and can start from Home.
    void navigate({ to: '/' })
  }, [navigate])

  const handleRetry = useCallback(() => {
    if (jobId) removeJob(jobId)
    setProgress(0)
    setCurrentTipIndex(0)
    startedJobRef.current = false
    setJobId(null)
    // Trigger effect re-run by toggling resumePaused via navigate? Simpler: kick off a fresh job inline.
    const id = startGenerationJob({
      params: {
        source: 'chapter',
        chapterId,
        bookId,
        exerciseType: exerciseType as ExerciseType,
      },
    })
    setJobId(id)
    startedJobRef.current = true
  }, [jobId, removeJob, chapterId, bookId, exerciseType])

  const isError = job?.status === 'error'
  const errorMessage = job?.error ?? `Couldn't generate ${exerciseTypeLabel} exercise.`
  const isInsufficientContent = /not enough|no content|insufficient/i.test(errorMessage)

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
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleLeave}
              data-testid="leave-button"
              className="gap-2"
            >
              <BellRing className="size-4" />
              Leave (notify me when ready)
            </Button>
            <Button variant="ghost" onClick={handleCancel} data-testid="cancel-button">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isError && !isInsufficientContent && (
        <div className="flex flex-col items-center gap-4 px-4" data-testid="error-state">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-center" data-testid="error-text">
            {errorMessage}
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
            {errorMessage}
          </p>
          <Button variant="outline" onClick={handleCancel} data-testid="insufficient-back-button">
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
