import { Loader2, RefreshCw, Sparkles, ThumbsUp, Target, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  useGenerateLearningSummary,
  useLearningSummary,
  type CachedLearningSummary,
} from '@/hooks/useLearningSummary'
import { startGenerationJob } from '@/lib/generationJobs'
import type { LearningRecommendation } from '@/lib/api'
import type { ExerciseType } from '@/types/quiz'

function formatGeneratedAt(iso: string): string {
  if (!iso) return 'just now'
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days = Math.floor(diffMs / 86_400_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function RecommendationButton({ rec }: { rec: LearningRecommendation }) {
  const handleStart = () => {
    startGenerationJob({
      params: {
        source: 'custom',
        chapterIds: rec.chapter_ids,
        questionCount: rec.question_count,
        exerciseTypes: [rec.exercise_type as ExerciseType],
      },
    })
    toast.success('Generating practice quiz — it will appear at the top.')
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStart}
      className="w-full justify-start gap-2 text-left whitespace-normal h-auto py-2"
    >
      <Sparkles className="size-4 shrink-0" />
      <span className="flex-1 text-sm">{rec.label}</span>
    </Button>
  )
}

function BulletList({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof ThumbsUp
  title: string
  items: string[]
  tone: 'good' | 'warn' | 'focus'
}) {
  if (items.length === 0) return null
  const toneClass =
    tone === 'good'
      ? 'text-green-700 dark:text-green-300'
      : tone === 'warn'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-primary'
  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-2 text-sm font-medium ${toneClass}`}>
        <Icon className="size-4" />
        {title}
      </div>
      <ul className="space-y-1 pl-6 text-sm text-foreground/90 list-disc">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState({
  onGenerate,
  isPending,
}: {
  onGenerate: () => void
  isPending: boolean
}) {
  return (
    <div
      className="rounded-lg border bg-card p-5 space-y-3"
      data-testid="learning-summary-empty"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-semibold">Your learning summary</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get an AI breakdown of your recent quizzes — strengths, weaknesses, and
            what to practice next.
          </p>
        </div>
      </div>
      <Button onClick={onGenerate} disabled={isPending} className="w-full gap-2">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analyzing your exercises…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate summary
          </>
        )}
      </Button>
    </div>
  )
}

function SummaryBody({
  data,
  onRegenerate,
  isPending,
}: {
  data: CachedLearningSummary
  onRegenerate: () => void
  isPending: boolean
}) {
  const { summary } = data
  return (
    <div
      className="rounded-lg border bg-card p-5 space-y-4"
      data-testid="learning-summary-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold">Your learning summary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.exercisesAnalyzed} recent exercises · updated{' '}
            {formatGeneratedAt(data.generatedAt)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRegenerate}
          disabled={isPending}
          aria-label="Regenerate summary"
          data-testid="regenerate-summary-button"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      {summary.headline && (
        <p className="text-sm text-foreground/90 italic">{summary.headline}</p>
      )}

      <BulletList
        icon={ThumbsUp}
        title="Strengths"
        items={summary.strengths}
        tone="good"
      />
      <BulletList
        icon={AlertTriangle}
        title="Weaknesses"
        items={summary.weaknesses}
        tone="warn"
      />
      <BulletList
        icon={Target}
        title="Focus on"
        items={summary.focus_areas}
        tone="focus"
      />

      {summary.recommendations.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-sm font-medium text-foreground">
            Recommended practice
          </div>
          <div className="flex flex-col gap-2">
            {summary.recommendations.map((rec, idx) => (
              <RecommendationButton key={idx} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LearningSummaryCard() {
  const { data, isLoading } = useLearningSummary()
  const generate = useGenerateLearningSummary()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your summary…
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        onGenerate={() => generate.mutate()}
        isPending={generate.isPending}
      />
    )
  }

  return (
    <SummaryBody
      data={data}
      onRegenerate={() => generate.mutate()}
      isPending={generate.isPending}
    />
  )
}
