import { Pause, Play, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePausedQuiz } from '@/hooks/usePausedQuiz'
import { usePauseQuiz } from '@/hooks/usePauseQuiz'
import { EXERCISE_TYPE_LABELS } from '@/types/quiz'
import type { ExerciseType } from '@/types/quiz'

function formatTimeAgo(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export interface PausedQuizBannerProps {
  chapterId: number
  exerciseType: string
  onResume: () => void
  onDiscard: () => void
}

export function PausedQuizBanner({
  chapterId,
  exerciseType,
  onResume,
  onDiscard,
}: PausedQuizBannerProps) {
  const { data: pausedQuiz, isLoading } = usePausedQuiz(chapterId, exerciseType)
  const { deletePausedQuiz, deletePausedQuizMutation } = usePauseQuiz()

  if (isLoading || !pausedQuiz) return null

  const quizState = pausedQuiz.quiz_state
  const answeredCount = Object.keys(quizState.answers).length
  const totalCount = quizState.questions.length
  const exerciseLabel =
    EXERCISE_TYPE_LABELS[exerciseType as ExerciseType] ?? exerciseType
  const timeAgo = formatTimeAgo(pausedQuiz.paused_at)

  const handleDiscard = async () => {
    try {
      await deletePausedQuiz({ chapterId, exerciseType })
      onDiscard()
    } catch (err) {
      console.warn('[PausedQuizBanner] Failed to discard paused quiz:', err)
    }
  }

  return (
    <div
      className="rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-4 mb-4 space-y-3"
      data-testid="paused-quiz-banner"
    >
      <div className="flex items-center gap-2">
        <Pause className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        <div className="flex-1">
          <p
            className="text-base font-semibold text-blue-900 dark:text-blue-100"
            data-testid="paused-quiz-banner-title"
          >
            Paused {exerciseLabel} quiz
          </p>
          <p
            className="text-sm text-blue-700 dark:text-blue-300"
            data-testid="paused-quiz-banner-progress"
          >
            {answeredCount}/{totalCount} complete • {timeAgo}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onResume}
          className="flex-1"
          data-testid="paused-quiz-resume-button"
        >
          <Play className="h-4 w-4 mr-2" />
          Resume
        </Button>
        <Button
          variant="ghost"
          onClick={() => { void handleDiscard() }}
          disabled={deletePausedQuizMutation.isPending}
          data-testid="paused-quiz-discard-button"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
      </div>
    </div>
  )
}
