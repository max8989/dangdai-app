import { cn } from '@/lib/utils'

export type QuizDisplayVariant = 'character' | 'pinyin' | 'meaning'
export type QuizFeedbackVariant = 'none' | 'correct' | 'incorrect'

interface QuizQuestionCardProps {
  questionTypeLabel: string
  primaryContent: string
  secondaryContent?: string
  display: QuizDisplayVariant
  feedback: QuizFeedbackVariant
}

const PRIMARY_FONT_SIZE_CLASS: Record<QuizDisplayVariant, string> = {
  character: 'text-[72px] leading-none',
  pinyin: 'text-2xl',
  meaning: 'text-xl',
}

const FEEDBACK_BORDER: Record<QuizFeedbackVariant, string> = {
  none: 'border-transparent',
  correct: 'border-emerald-500',
  incorrect: 'border-red-500',
}

export function QuizQuestionCard({
  questionTypeLabel,
  primaryContent,
  secondaryContent,
  display,
  feedback,
}: QuizQuestionCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-card p-4 transition-colors',
        FEEDBACK_BORDER[feedback],
      )}
      data-testid="quiz-question-card"
    >
      <div className="flex flex-col items-center gap-3 py-2">
        <div
          className={cn('font-semibold text-center text-foreground', PRIMARY_FONT_SIZE_CLASS[display])}
          data-testid="primary-content"
        >
          {primaryContent}
        </div>
        {secondaryContent ? (
          <div className="text-xl text-muted-foreground text-center" data-testid="secondary-content">
            {secondaryContent}
          </div>
        ) : null}
        <div className="text-base text-muted-foreground text-center" data-testid="question-type-label">
          {questionTypeLabel}
        </div>
      </div>
    </div>
  )
}
