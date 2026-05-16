import { useState, useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AnswerOptionGrid } from './AnswerOptionGrid'
import type { ComprehensionSubQuestion } from '@/types/quiz'
import { shuffleArray } from '@/lib/shuffle'

interface ReadingPassageCardProps {
  passage: string
  passagePinyin?: string
  comprehensionQuestions: ComprehensionSubQuestion[]
  currentSubQuestionIndex: number
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void
  disabled?: boolean
  feedbackDelayMs?: number
}

export function ReadingPassageCard({
  passage,
  passagePinyin,
  comprehensionQuestions,
  currentSubQuestionIndex,
  onAnswer,
  disabled = false,
  feedbackDelayMs = 1000,
}: ReadingPassageCardProps) {
  const [showPinyin, setShowPinyin] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSelectedOption(null)
    setCorrectAnswer(null)
  }, [currentSubQuestionIndex])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (comprehensionQuestions.length === 0) {
    return (
      <div data-testid="reading-passage-card">
        <p className="text-red-600">No comprehension questions available.</p>
      </div>
    )
  }
  if (currentSubQuestionIndex < 0 || currentSubQuestionIndex >= comprehensionQuestions.length) {
    return (
      <div data-testid="reading-passage-card">
        <p className="text-red-600">Invalid question index.</p>
      </div>
    )
  }

  const currentQuestion = comprehensionQuestions[currentSubQuestionIndex]

  const shuffledOptions = useMemo(
    () => shuffleArray(currentQuestion.options),
    [currentQuestion.options],
  )

  const handleAnswerSelect = (answer: string) => {
    if (disabled || selectedOption !== null) return
    const isCorrect = answer === currentQuestion.correct_answer
    setSelectedOption(answer)
    setCorrectAnswer(currentQuestion.correct_answer)
    timeoutRef.current = setTimeout(() => {
      onAnswer(isCorrect, answer)
      timeoutRef.current = null
    }, feedbackDelayMs)
  }

  return (
    <div className="space-y-3" data-testid="reading-passage-card">
      <p className="text-base text-muted-foreground">Read the following passage:</p>

      <div className="rounded-md border p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
        {showPinyin && passagePinyin && passagePinyin.trim() && (
          <p className="text-sm text-muted-foreground mb-2">{passagePinyin}</p>
        )}
        <p className="text-xl leading-8 text-foreground">{passage}</p>
        {passagePinyin && passagePinyin.trim() && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowPinyin(!showPinyin)} data-testid="pinyin-toggle">
              拼音
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground text-center">
        Question {currentSubQuestionIndex + 1}/{comprehensionQuestions.length}
      </p>

      <div className="space-y-3">
        <p className="text-lg font-semibold">{currentQuestion.question}</p>
        <AnswerOptionGrid
          options={shuffledOptions}
          selectedOption={selectedOption}
          correctAnswer={correctAnswer}
          onSelect={handleAnswerSelect}
          disabled={disabled || selectedOption !== null}
        />
      </div>
    </div>
  )
}
