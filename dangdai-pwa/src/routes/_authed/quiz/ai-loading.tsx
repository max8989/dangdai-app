import { useEffect, useRef, useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { adaptPremadeContent } from '@/lib/premadeExerciseAdapter'
import { useQuizStore } from '@/stores/useQuizStore'
import type { ExerciseType, QuizResponse } from '@/types/quiz'

interface AILoadingSearch {
  chapterId: number
  bookId: number
  exerciseType: string
}

export const Route = createFileRoute('/_authed/quiz/ai-loading')({
  component: AILoadingPage,
  validateSearch: (search: Record<string, unknown>): AILoadingSearch => ({
    chapterId: Number(search.chapterId ?? 0),
    bookId: Number(search.bookId ?? 0),
    exerciseType: String(search.exerciseType ?? ''),
  }),
})

const TIPS = [
  'AI is crafting personalized questions for you...',
  'Exercises adapt to chapter vocabulary and grammar.',
  'Generated exercises are cached for other learners.',
  'Try the Premade option for instant exercises!',
  'Each question is validated for Traditional Chinese accuracy.',
  'Practice makes progress — keep going!',
]

const TIP_ROTATION_MS = 4000

function AILoadingPage() {
  const navigate = useNavigate()
  const { chapterId, bookId, exerciseType } = Route.useSearch()

  const abortRef = useRef<AbortController | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      TIP_ROTATION_MS,
    )
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false
    const startQuiz = useQuizStore.getState().startQuiz

    ;(async () => {
      try {
        const result = await api.generateExercise(
          { bookId, chapterId, exerciseType },
          { signal: controller.signal },
        )
        if (cancelled) return

        const questions = adaptPremadeContent(
          result.exercise_type,
          result.content as Record<string, unknown>,
        )

        if (questions.length === 0) {
          toast.error("Couldn't generate exercise — please try again.")
          window.history.back()
          return
        }

        const quizId = `ai-${Date.now()}`
        const payload: QuizResponse = {
          quiz_id: quizId,
          chapter_id: chapterId,
          book_id: bookId,
          exercise_type: result.exercise_type as ExerciseType,
          question_count: questions.length,
          questions,
        }

        startQuiz(quizId, payload, chapterId, bookId, result.exercise_type)
        void navigate({ to: '/quiz/play', replace: true })
      } catch (err: unknown) {
        if (cancelled) return
        const errObj = err as { name?: string; category?: string; message?: string }
        if (errObj?.name === 'AbortError' || errObj?.category === 'timeout') {
          window.history.back()
          return
        }
        toast.error(errObj?.message ?? "Couldn't generate exercise — please try again.")
        window.history.back()
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [bookId, chapterId, exerciseType, navigate])

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    window.history.back()
  }, [])

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col bg-background"
      data-testid="ai-loading-screen"
    >
      <header className="flex items-center gap-2 px-2 py-2 border-b">
        <Button variant="ghost" size="icon" onClick={handleCancel} data-testid="ai-loading-back">
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="text-base font-semibold">Generating Exercise</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg font-bold text-center" data-testid="ai-loading-tip">
          {TIPS[tipIndex]}
        </p>
        <p className="text-sm text-muted-foreground" data-testid="ai-loading-elapsed">
          {elapsedSec}s elapsed
        </p>
        <Button variant="outline" onClick={handleCancel} data-testid="ai-loading-cancel">
          Cancel
        </Button>
      </main>
    </div>
  )
}
