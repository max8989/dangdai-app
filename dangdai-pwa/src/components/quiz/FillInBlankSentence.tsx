import { cn } from '@/lib/utils'

export type BlankState = 'empty' | 'filled' | 'correct' | 'incorrect'

interface FillInBlankSentenceProps {
  sentenceWithBlanks: string
  filledBlanks: Record<number, string | null>
  blankFeedback?: Record<number, 'correct' | 'incorrect'>
  onBlankTap: (blankIndex: number) => void
  disabled?: boolean
}

const BLANK_MARKER = '___'

function parseSentence(sentence: string) {
  const parts = sentence.split(BLANK_MARKER)
  const result: Array<{ type: 'text'; content: string } | { type: 'blank'; index: number }> = []
  parts.forEach((part, i) => {
    if (part.length > 0) result.push({ type: 'text', content: part })
    if (i < parts.length - 1) result.push({ type: 'blank', index: i })
  })
  return result
}

function getBlankState(
  blankIndex: number,
  filledBlanks: Record<number, string | null>,
  blankFeedback?: Record<number, 'correct' | 'incorrect'>,
): BlankState {
  const word = filledBlanks[blankIndex]
  if (!word) return 'empty'
  if (blankFeedback) {
    return blankFeedback[blankIndex] === 'correct' ? 'correct' : 'incorrect'
  }
  return 'filled'
}

const STATE_CLASSES: Record<BlankState, string> = {
  empty: 'border-dashed border-primary bg-muted/40 text-primary/60',
  filled: 'border-solid border-border bg-card text-foreground',
  correct: 'border-solid border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-200',
  incorrect: 'border-solid border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200',
}

export function FillInBlankSentence({
  sentenceWithBlanks,
  filledBlanks,
  blankFeedback,
  onBlankTap,
  disabled = false,
}: FillInBlankSentenceProps) {
  const segments = parseSentence(sentenceWithBlanks ?? '')

  if (!sentenceWithBlanks || segments.length === 0) {
    return (
      <div data-testid="fill-in-blank-sentence" className="text-muted-foreground">
        No sentence data available.
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid="fill-in-blank-sentence">
      <div className="flex flex-wrap items-center gap-1">
        {segments.map((segment, segIndex) => {
          if (segment.type === 'text') {
            return (
              <span key={`text-${segIndex}`} className="text-lg text-foreground" data-testid={`sentence-text-${segIndex}`}>
                {segment.content}
              </span>
            )
          }
          const blankIndex = segment.index
          const blankState = getBlankState(blankIndex, filledBlanks, blankFeedback)
          const filledWord = filledBlanks[blankIndex]
          const isFilled = !!filledWord && blankState !== 'empty'
          const isInteractive = isFilled && !disabled

          return (
            <button
              key={`blank-${blankIndex}`}
              type="button"
              onClick={() => {
                if (isInteractive) onBlankTap(blankIndex)
              }}
              disabled={!isInteractive}
              aria-disabled={!isInteractive}
              className={cn(
                'min-w-[60px] min-h-12 px-2 py-1 rounded-md border-2 inline-flex items-center justify-center transition-colors',
                isInteractive && 'active:scale-95',
                STATE_CLASSES[blankState],
              )}
              data-testid={`blank-slot-${blankIndex}`}
            >
              {filledWord ? (
                <span className="text-base font-medium" data-testid={`blank-word-${blankIndex}`}>
                  {filledWord}
                </span>
              ) : (
                <span className="text-sm opacity-60" data-testid={`blank-placeholder-${blankIndex}`}>
                  &nbsp;&nbsp;
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
