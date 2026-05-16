import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

import { useAnswerValidation } from '@/hooks/useAnswerValidation'
import type { DialogueQuestion } from '@/types/quiz'
import type { ValidationResult } from '@/hooks/useAnswerValidation'
import { cn } from '@/lib/utils'
import { shuffleArray } from '@/lib/shuffle'

export interface DialogueAnswerResult {
  correct: boolean
  selectedAnswer: string
  isAlternative: boolean
  explanation: string
  alternatives?: string[]
}

interface DialogueCardProps {
  question: DialogueQuestion
  onAnswerResult: (result: DialogueAnswerResult) => void
  disabled?: boolean
}

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled'

function getOptionState(
  option: string,
  selectedAnswer: string | null,
  validationResult: ValidationResult | null,
): OptionState {
  if (selectedAnswer === null) return 'default'
  if (option === selectedAnswer) {
    if (validationResult === null) return 'selected'
    return validationResult.isCorrect ? 'correct' : 'incorrect'
  }
  return 'disabled'
}

const OPTION_CLASSES: Record<OptionState, string> = {
  default: 'border-border bg-card hover:bg-accent',
  selected: 'border-primary bg-accent',
  correct: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  incorrect: 'border-red-500 bg-red-50 dark:bg-red-950',
  disabled: 'border-border bg-card opacity-50',
}

function bubbleClasses(speaker: 'a' | 'b', hasBlank: boolean) {
  if (hasBlank) {
    return 'self-start max-w-[80%] rounded-xl border-2 border-dashed border-primary bg-transparent p-3'
  }
  return cn(
    'max-w-[80%] rounded-xl border p-3',
    speaker === 'a'
      ? 'self-start bg-card border-border text-foreground'
      : 'self-end bg-primary border-primary text-primary-foreground',
  )
}

export function DialogueCard({ question, onAnswerResult, disabled = false }: DialogueCardProps) {
  const { validate, isValidating } = useAnswerValidation()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const hasSelected = selectedAnswer !== null
  const safeOptions: string[] = useMemo(
    () =>
      shuffleArray(
        (question.options ?? []).map((o: unknown) => {
          if (typeof o === 'string') return o
          if (o && typeof o === 'object') {
            const rec = o as Record<string, unknown>
            return (rec.text as string) ?? (rec.value as string) ?? JSON.stringify(o)
          }
          return String(o)
        }),
      ),
    [question.options],
  )

  const handleOptionClick = (option: string) => {
    if (hasSelected || disabled) return
    setSelectedAnswer(option)

    const result = validate({
      userAnswer: option,
      correctAnswer: question.correct_answer,
      questionText: question.question_text,
      exerciseType: question.exercise_type,
      preGeneratedExplanation: question.explanation,
      acceptableAnswerVariants: question.acceptable_answer_variants,
    })

    setValidationResult(result)
    onAnswerResult({
      correct: result.isCorrect,
      selectedAnswer: option,
      isAlternative: result.isAlternative,
      explanation: result.explanation,
      alternatives: result.alternatives,
    })
  }

  return (
    <div className="flex-1 flex flex-col gap-4" data-testid="dialogue-card">
      <div className="flex flex-col gap-3 pb-2">
        {question.dialogue_lines.map((line, index) => {
          if (line.isBlank) {
            const showFeedback = validationResult !== null && selectedAnswer !== null
            return (
              <div key={`line-${index}`} className={bubbleClasses(line.speaker, !hasSelected)}>
                <div className="flex items-center justify-between gap-2 min-h-12 min-w-[80px]">
                  {selectedAnswer ? (
                    <span
                      className={cn(
                        'text-lg flex-1',
                        showFeedback && validationResult.isCorrect && 'text-emerald-600',
                        showFeedback && !validationResult.isCorrect && 'text-red-600',
                      )}
                      data-testid="dialogue-filled-answer"
                    >
                      {selectedAnswer}
                    </span>
                  ) : (
                    <span className="text-base text-primary/60" data-testid="dialogue-blank-placeholder">
                      ___
                    </span>
                  )}
                  {isValidating && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {showFeedback && validationResult.isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                  {showFeedback && !validationResult.isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            )
          }
          return (
            <div
              key={`line-${index}`}
              className={bubbleClasses(line.speaker, false)}
              data-testid={`dialogue-bubble-${line.speaker}-${index}`}
            >
              <span className="text-lg">{line.text}</span>
            </div>
          )
        })}
      </div>

      {validationResult !== null && (
        <div className="space-y-2" data-testid="dialogue-feedback">
          {validationResult.isAlternative && (
            <div className="rounded-md border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-3">
              <p className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                Your answer is also valid!
              </p>
              {validationResult.alternatives && validationResult.alternatives.length > 0 && (
                <p className="text-sm text-foreground mt-1">
                  Other valid answers: {validationResult.alternatives.join(', ')}
                </p>
              )}
            </div>
          )}
          {!validationResult.isCorrect && (
            <div className="rounded-md border border-red-500 bg-red-50 dark:bg-red-950 p-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-200">
                Correct answer: {question.correct_answer}
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{validationResult.explanation}</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Select the best response:</p>
        {safeOptions.map((option, index) => {
          const state = getOptionState(option, selectedAnswer, validationResult)
          const isDisabled = hasSelected || disabled
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={isDisabled}
              className={cn(
                'w-full min-h-12 rounded-md border px-3 py-2 text-left transition-colors',
                !isDisabled && 'active:scale-[0.98]',
                OPTION_CLASSES[state],
              )}
              data-testid={`dialogue-option-${index}`}
            >
              <span className="text-base line-clamp-3">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
