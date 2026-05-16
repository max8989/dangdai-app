import { Check, X, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FeedbackOverlayProps {
  visible: boolean
  isCorrect: boolean
  explanation: string
  sourceCitation: string
  correctAnswer?: string
  pointsEarned?: number
  onNext?: () => void
}

export function FeedbackOverlay({
  visible,
  isCorrect,
  explanation,
  sourceCitation,
  correctAnswer,
  pointsEarned,
  onNext,
}: FeedbackOverlayProps) {
  if (!visible) return null

  return (
    <div
      className={cn(
        'mx-4 mb-4 rounded-xl border-2 p-4 space-y-2 animate-in fade-in zoom-in-95 duration-200',
        isCorrect
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
          : 'border-red-500 bg-red-50 dark:bg-red-950',
      )}
      data-testid="feedback-overlay"
    >
      <div className="flex items-center gap-2">
        {isCorrect ? (
          <Check className="h-6 w-6 text-emerald-700 dark:text-emerald-300" data-testid="feedback-check-icon" />
        ) : (
          <X className="h-6 w-6 text-red-700 dark:text-red-300" data-testid="feedback-x-icon" />
        )}
        <span
          className={cn(
            'font-semibold text-lg',
            isCorrect ? 'text-emerald-700 dark:text-emerald-200' : 'text-red-700 dark:text-red-200',
          )}
          data-testid="feedback-result-text"
        >
          {isCorrect ? 'Correct!' : 'Not quite'}
        </span>
        {isCorrect && pointsEarned != null && (
          <span
            className="ml-auto font-bold text-base text-emerald-700 dark:text-emerald-200"
            data-testid="feedback-points"
          >
            +{pointsEarned} pts
          </span>
        )}
      </div>

      {!isCorrect && correctAnswer && (
        <div
          className="rounded-md bg-emerald-100 dark:bg-emerald-900 px-3 py-2 inline-block"
          data-testid="feedback-correct-answer"
        >
          <span className="text-base font-semibold text-emerald-800 dark:text-emerald-200">
            {correctAnswer}
          </span>
        </div>
      )}

      <p className="text-sm text-foreground/90" data-testid="feedback-explanation">
        {explanation}
      </p>

      <p className="text-xs text-muted-foreground" data-testid="feedback-citation">
        {sourceCitation}
      </p>

      {onNext && (
        <Button
          onClick={onNext}
          className="w-full mt-2"
          data-testid="feedback-next-button"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}
