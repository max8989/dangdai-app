import { Progress } from '@/components/ui/progress'

interface QuizProgressProps {
  currentQuestion: number
  totalQuestions: number
}

export function QuizProgress({ currentQuestion, totalQuestions }: QuizProgressProps) {
  const progressPercent =
    totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0

  return (
    <div className="w-full space-y-2" data-testid="quiz-progress">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground" data-testid="progress-text">
          {currentQuestion}/{totalQuestions}
        </span>
      </div>
      <Progress value={progressPercent} className="h-1.5" data-testid="progress-bar" />
    </div>
  )
}
