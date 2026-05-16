import { cn } from '@/lib/utils'

export type WordBankItemState = 'available' | 'selected' | 'correct' | 'incorrect' | 'used'

interface WordBankSelectorProps {
  words: string[]
  usedIndices: Set<number>
  feedbackState?: Record<number, 'correct' | 'incorrect'>
  onWordSelect: (word: string, wordIndex: number) => void
  disabled?: boolean
}

function getWordState(
  wordIndex: number,
  isUsed: boolean,
  feedbackState?: Record<number, 'correct' | 'incorrect'>,
): WordBankItemState {
  if (isUsed) {
    const feedback = feedbackState?.[wordIndex]
    if (feedback === 'correct') return 'correct'
    if (feedback === 'incorrect') return 'incorrect'
    return 'used'
  }
  return 'available'
}

const STATE_CLASSES: Record<WordBankItemState, string> = {
  available: 'bg-card border border-border text-foreground hover:bg-accent',
  selected: 'bg-primary border-primary text-primary-foreground',
  correct: 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-500 text-emerald-700 dark:text-emerald-200',
  incorrect: 'bg-red-50 dark:bg-red-950 border border-red-500 text-red-700 dark:text-red-200',
  used: 'bg-card border border-border opacity-40 text-muted-foreground',
}

export function WordBankSelector({
  words,
  usedIndices,
  feedbackState,
  onWordSelect,
  disabled = false,
}: WordBankSelectorProps) {
  return (
    <div className="overflow-x-auto" data-testid="word-bank-selector">
      <div className="flex gap-2 py-2 px-4">
        {words.map((word, index) => {
          const isUsed = usedIndices.has(index)
          const state = getWordState(index, isUsed, feedbackState)
          const isDisabled = disabled || isUsed
          return (
            <button
              key={`${word}-${index}`}
              type="button"
              onClick={() => {
                if (!isDisabled) onWordSelect(word, index)
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className={cn(
                'rounded-full px-3 py-2 min-h-12 text-base transition-colors whitespace-nowrap',
                !isDisabled && 'active:scale-95',
                STATE_CLASSES[state],
              )}
              data-testid={`word-bank-item-${index}`}
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
