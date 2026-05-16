import { cn } from '@/lib/utils'

export type AnswerOptionState = 'default' | 'correct' | 'incorrect' | 'disabled'

interface AnswerOptionGridProps {
  options: string[]
  selectedOption: string | null
  correctAnswer: string | null
  onSelect: (answer: string) => void
  disabled: boolean
}

function getLayout(options: string[]): 'grid' | 'list' {
  return options.some((opt) => opt.length > 15) ? 'list' : 'grid'
}

function getOptionState(
  option: string,
  selectedOption: string | null,
  correctAnswer: string | null,
  disabled: boolean,
): AnswerOptionState {
  if (selectedOption !== null) {
    if (option === correctAnswer) return 'correct'
    if (option === selectedOption) return 'incorrect'
    return 'disabled'
  }
  if (disabled) return 'disabled'
  return 'default'
}

const STATE_CLASSES: Record<AnswerOptionState, string> = {
  default: 'border-border bg-card hover:bg-accent text-foreground',
  correct: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-foreground',
  incorrect: 'border-red-500 bg-red-50 dark:bg-red-950 text-foreground',
  disabled: 'border-border bg-card text-foreground opacity-50',
}

export function AnswerOptionGrid({
  options,
  selectedOption,
  correctAnswer,
  onSelect,
  disabled,
}: AnswerOptionGridProps) {
  const layout = getLayout(options)
  const isLocked = disabled || selectedOption !== null

  const handle = (option: string) => {
    if (!isLocked) onSelect(option)
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3" data-testid="answer-option-grid">
        {options.map((option, index) => {
          const state = getOptionState(option, selectedOption, correctAnswer, disabled)
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => handle(option)}
              disabled={isLocked}
              aria-disabled={isLocked}
              className={cn(
                'min-h-12 rounded-md border p-2 text-sm font-medium transition-colors',
                'active:scale-[0.98]',
                STATE_CLASSES[state],
              )}
              data-testid={`answer-option-${index}`}
            >
              <span className="line-clamp-2 text-center">{option}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="answer-option-grid">
      {options.map((option, index) => {
        const state = getOptionState(option, selectedOption, correctAnswer, disabled)
        return (
          <button
            key={`${option}-${index}`}
            type="button"
            onClick={() => handle(option)}
            disabled={isLocked}
            aria-disabled={isLocked}
            className={cn(
              'w-full min-h-12 rounded-md border p-2 text-sm font-medium transition-colors',
              'active:scale-[0.98]',
              STATE_CLASSES[state],
            )}
            data-testid={`answer-option-${index}`}
          >
            <span className="line-clamp-3 text-center">{option}</span>
          </button>
        )
      })}
    </div>
  )
}
