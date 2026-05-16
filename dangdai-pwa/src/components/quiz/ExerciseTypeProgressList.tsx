import type { ExerciseType } from '@/types/quiz'
import { EXERCISE_TYPE_LABELS } from '@/types/quiz'
import { cn } from '@/lib/utils'

export interface ExerciseTypeProgressRow {
  exercise_type: string
  best_score: number
  attempts_count: number
  mastered_at: string | null
}

export interface ExerciseTypeProgressListProps {
  progress: ExerciseTypeProgressRow[] | null | undefined
  highlightType: ExerciseType
}

const EXERCISE_TYPE_ORDER: ExerciseType[] = [
  'vocabulary',
  'grammar',
  'fill_in_blank',
  'matching',
  'dialogue_completion',
  'sentence_construction',
  'reading_comprehension',
]

type ExerciseStatus = 'mastered' | 'in-progress' | 'new'

function getStatus(row: ExerciseTypeProgressRow | undefined): ExerciseStatus {
  if (!row) return 'new'
  if (row.best_score >= 80) return 'mastered'
  if (row.attempts_count > 0) return 'in-progress'
  return 'new'
}

const FILL_BG: Record<ExerciseStatus, string> = {
  mastered: 'bg-emerald-500',
  'in-progress': 'bg-primary',
  new: 'bg-muted-foreground/40',
}

function ExerciseTypeRow({
  exerciseType,
  row,
  isHighlighted,
}: {
  exerciseType: ExerciseType
  row: ExerciseTypeProgressRow | undefined
  isHighlighted: boolean
}) {
  const status = getStatus(row)
  const label = EXERCISE_TYPE_LABELS[exerciseType]
  const percent = row?.best_score ?? 0
  const widthPercent = status === 'new' ? 0 : Math.min(percent, 100)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2',
        isHighlighted && 'border-l-[3px] border-primary',
      )}
      data-testid={`exercise-type-row-${exerciseType}`}
    >
      <span
        className={cn(
          'text-sm w-32 truncate',
          isHighlighted ? 'font-semibold' : 'font-normal',
        )}
        data-testid={`exercise-type-label-${exerciseType}`}
      >
        {label}
      </span>
      <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
        <div
          className={cn('h-2 rounded transition-all duration-700', FILL_BG[status])}
          style={{ width: `${widthPercent}%` }}
          data-testid={`exercise-type-bar-${exerciseType}`}
        />
      </div>
      <span
        className={cn(
          'text-sm w-12 text-right',
          status === 'mastered' ? 'text-emerald-600' : 'text-muted-foreground',
        )}
        data-testid={`exercise-type-status-${exerciseType}`}
      >
        {status === 'mastered' ? '✓' : status === 'in-progress' ? `${percent}%` : 'New'}
      </span>
    </div>
  )
}

export function ExerciseTypeProgressList({
  progress,
  highlightType,
}: ExerciseTypeProgressListProps) {
  const progressMap = new Map<string, ExerciseTypeProgressRow>()
  if (progress) {
    progress.forEach((row) => progressMap.set(row.exercise_type, row))
  }

  return (
    <div className="space-y-1" data-testid="exercise-type-progress-list">
      {EXERCISE_TYPE_ORDER.map((exerciseType) => (
        <ExerciseTypeRow
          key={exerciseType}
          exerciseType={exerciseType}
          row={progressMap.get(exerciseType)}
          isHighlighted={exerciseType === highlightType}
        />
      ))}
    </div>
  )
}
