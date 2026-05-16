import { useState, useCallback } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateTextAnswer } from '@/lib/quizValidation'
import { cn } from '@/lib/utils'

export interface TextInputAnswerProps {
  placeholder: string
  correctAnswer: string
  questionType: 'pinyin' | 'meaning'
  onSubmit: (userAnswer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function TextInputAnswer({
  placeholder,
  correctAnswer,
  questionType,
  onSubmit,
  disabled = false,
}: TextInputAnswerProps) {
  const [userInput, setUserInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = useCallback(() => {
    if (!userInput.trim() || submitted || disabled) return
    const correct = validateTextAnswer(userInput, correctAnswer, questionType)
    setSubmitted(true)
    setIsCorrect(correct)
    onSubmit(userInput, correct)
  }, [userInput, correctAnswer, questionType, onSubmit, submitted, disabled])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="text"
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        readOnly={submitted}
        disabled={disabled}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-h-12 text-base',
          submitted && isCorrect && 'border-emerald-500',
          submitted && !isCorrect && 'border-red-500',
        )}
      />

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!userInput.trim() || submitted || disabled}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        Submit
      </Button>

      {submitted && !isCorrect && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground">Correct answer:</p>
          <p className="font-semibold text-lg text-emerald-600">{correctAnswer}</p>
        </div>
      )}
    </div>
  )
}
