import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PointsCounter } from './PointsCounter'
import { ExerciseTypeProgressList } from './ExerciseTypeProgressList'
import {
  useExerciseTypeProgress,
  useUpdateExerciseTypeProgress,
} from '@/hooks/useExerciseTypeProgress'
import type { ExerciseType } from '@/types/quiz'
import { EXERCISE_TYPE_LABELS } from '@/types/quiz'

export interface IncorrectItem {
  questionText: string
  userAnswer: string
  correctAnswer: string
  character?: string
}

export interface CompletionScreenProps {
  chapterId: number
  bookId: number
  exerciseType: ExerciseType
  correctCount: number
  totalQuestions: number
  pointsEarned: number
  durationMinutes: number
  incorrectItems: IncorrectItem[]
  onContinue: () => void
}

function StatsCard({
  correctCount,
  totalQuestions,
  scorePercent,
  durationMinutes,
}: {
  correctCount: number
  totalQuestions: number
  scorePercent: number
  durationMinutes: number
}) {
  return (
    <div
      className="w-full rounded-md border bg-card p-4 flex justify-between items-center"
      data-testid="stats-card"
    >
      <span className="text-base text-foreground" data-testid="stats-score">
        {correctCount}/{totalQuestions} correct — {scorePercent}%
      </span>
      <span className="text-sm text-muted-foreground" data-testid="stats-time">
        {durationMinutes} min
      </span>
    </div>
  )
}

function StruggledWithSection({ items }: { items: IncorrectItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="w-full space-y-2" data-testid="struggled-with-section">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        You struggled with:
      </p>
      {items.map((item, index) => (
        <div
          key={`${item.questionText}-${index}`}
          className="rounded-md border bg-card p-3"
          data-testid={`struggled-item-${index}`}
        >
          <p className="text-sm font-medium text-foreground">• {item.questionText}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your answer: {item.userAnswer}
          </p>
          <p className="text-xs text-emerald-600">Correct: {item.correctAnswer}</p>
        </div>
      ))}
    </div>
  )
}

export function CompletionScreen({
  chapterId,
  bookId,
  exerciseType,
  correctCount,
  totalQuestions,
  pointsEarned,
  durationMinutes,
  incorrectItems,
  onContinue,
}: CompletionScreenProps) {
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const { data: exerciseTypeProgress } = useExerciseTypeProgress(chapterId)
  const { mutate: updateProgress } = useUpdateExerciseTypeProgress()

  const exerciseTypeLabel = EXERCISE_TYPE_LABELS[exerciseType] ?? exerciseType
  const chapterNumber = chapterId % 100

  const mountParamsRef = useRef({ chapterId, bookId, exerciseType, score: scorePercent })

  useEffect(() => {
    updateProgress(mountParamsRef.current)
  }, [updateProgress])

  return (
    <div className="flex-1 overflow-y-auto" data-testid="completion-screen">
      <div className="p-4 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-center" data-testid="completion-title">
          Exercise Complete!
        </h1>

        <PointsCounter points={pointsEarned} size="celebration" />

        <StatsCard
          correctCount={correctCount}
          totalQuestions={totalQuestions}
          scorePercent={scorePercent}
          durationMinutes={durationMinutes}
        />

        <Separator className="w-full" />

        <div className="w-full space-y-2">
          <p
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
            data-testid="chapter-progress-header"
          >
            Chapter {chapterNumber} Progress — {exerciseTypeLabel}
          </p>
          <ExerciseTypeProgressList
            progress={exerciseTypeProgress}
            highlightType={exerciseType}
          />
        </div>

        <StruggledWithSection items={incorrectItems} />

        <Button size="lg" onClick={onContinue} className="w-full" data-testid="continue-button">
          Continue
        </Button>
      </div>
    </div>
  )
}
