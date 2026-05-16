import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2, Pause, Play, Sparkles, Trash2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LearningSummaryCard } from '@/components/LearningSummaryCard';
import { MaixinLogo } from '@/components/MaixinLogo';
import { getChapter } from '@/constants/chapters';
import { useAllPausedQuizzes } from '@/hooks/usePausedQuiz';
import { usePauseQuiz } from '@/hooks/usePauseQuiz';
import { useGenerationJobsStore, type GenerationJob } from '@/stores/useGenerationJobsStore';
import { useQuizStore } from '@/stores/useQuizStore';
import { EXERCISE_TYPE_LABELS, type ExerciseType } from '@/types/quiz';
import type { PausedQuiz } from '@/types/paused-quiz';

export const Route = createFileRoute('/_authed/_tabs/')({
  component: HomePage,
});

function formatTimeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  return formatRelativeMs(diffMs);
}

function formatRelativeMs(diffMs: number): string {
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function PausedQuizHomeCard({ pq }: { pq: PausedQuiz }) {
  const navigate = useNavigate();
  const { deletePausedQuiz, deletePausedQuizMutation } = usePauseQuiz();
  const chapter = getChapter(pq.chapter_id);

  const answered = Object.keys(pq.quiz_state.answers).length;
  const total = pq.quiz_state.questions.length;
  const label = EXERCISE_TYPE_LABELS[pq.exercise_type as ExerciseType] ?? pq.exercise_type;

  const handleResume = () => {
    void navigate({
      to: '/quiz/loading',
      search: {
        chapterId: pq.chapter_id,
        bookId: pq.quiz_state.bookId,
        exerciseType: pq.exercise_type,
        resumePaused: true,
      },
    });
  };

  const handleDiscard = async () => {
    try {
      await deletePausedQuiz({ chapterId: pq.chapter_id, exerciseType: pq.exercise_type });
    } catch (err) {
      console.warn('[HomePage] Failed to discard paused quiz:', err);
    }
  };

  return (
    <div
      className="rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-4 space-y-3"
      data-testid="paused-quiz-home-card"
    >
      <div className="flex items-start gap-2">
        <Pause className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
            Paused {label} quiz
          </p>
          {chapter && (
            <p className="truncate text-sm text-blue-800 dark:text-blue-200">
              Chapter {chapter.chapterNumber} · {chapter.titleEnglish}
            </p>
          )}
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {answered}/{total} complete · {formatTimeAgo(pq.paused_at)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleResume} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Resume
        </Button>
        <Button
          variant="ghost"
          onClick={() => { void handleDiscard(); }}
          disabled={deletePausedQuizMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
      </div>
    </div>
  );
}

function GeneratingJobCard({ job }: { job: GenerationJob }) {
  return (
    <div
      className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-2"
      data-testid="generating-job-card"
    >
      <div className="flex items-start gap-2">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">Generating exercise…</p>
          <p className="truncate text-sm text-muted-foreground">
            {job.label}
            {job.subtitle ? ` · ${job.subtitle}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Started {formatRelativeMs(Date.now() - job.startedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReadyJobCard({ job }: { job: GenerationJob }) {
  const navigate = useNavigate();
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const removeJob = useGenerationJobsStore((s) => s.removeJob);

  const handleStart = () => {
    if (!job.result) return;
    startQuiz(
      job.result.quiz_id,
      job.result,
      job.chapterId ?? job.result.chapter_id,
      job.bookId ?? job.result.book_id,
      job.exerciseType ?? job.result.exercise_type,
      job.chapterIdEnd ?? null,
    );
    removeJob(job.id);
    void navigate({ to: '/quiz/play' });
  };

  const handleDiscard = () => {
    removeJob(job.id);
  };

  return (
    <div
      className="rounded-md border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 p-4 space-y-3"
      data-testid="ready-job-card"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-300" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-green-900 dark:text-green-100">
            Ready to start
          </p>
          <p className="truncate text-sm text-green-800 dark:text-green-200">
            {job.label}
            {job.subtitle ? ` · ${job.subtitle}` : ''}
          </p>
          {job.finishedAt && (
            <p className="text-xs text-green-700 dark:text-green-300">
              Ready {formatRelativeMs(Date.now() - job.finishedAt)}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleStart} className="flex-1">
          <Sparkles className="h-4 w-4 mr-2" />
          Start
        </Button>
        <Button variant="ghost" onClick={handleDiscard} aria-label="Discard">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ErrorJobCard({ job }: { job: GenerationJob }) {
  const removeJob = useGenerationJobsStore((s) => s.removeJob);
  return (
    <div
      className="rounded-md border border-destructive/40 bg-destructive/10 p-4 space-y-2"
      data-testid="error-job-card"
    >
      <div className="flex items-start gap-2">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-destructive">
            Generation failed
          </p>
          <p className="truncate text-sm text-destructive/90">
            {job.label}
          </p>
          <p className="text-xs text-destructive/80">
            {job.error ?? 'Could not generate exercise.'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => removeJob(job.id)} aria-label="Dismiss">
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function HomePage() {
  const { data: pausedQuizzes } = useAllPausedQuizzes();
  const jobsMap = useGenerationJobsStore((s) => s.jobs);

  const allJobs = Object.values(jobsMap).sort((a, b) => b.startedAt - a.startedAt);
  const generatingJobs = allJobs.filter((j) => j.status === 'generating');
  const readyJobs = allJobs.filter((j) => j.status === 'ready');
  const errorJobs = allJobs.filter((j) => j.status === 'error');

  return (
    <section className="flex flex-col gap-6 p-4 pt-6">
      <header className="flex justify-center">
        <MaixinLogo width={120} />
      </header>

      <LearningSummaryCard />

      {readyJobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Ready to start</h2>
          {readyJobs.map((j) => (
            <ReadyJobCard key={j.id} job={j} />
          ))}
        </div>
      )}

      {generatingJobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Generating</h2>
          {generatingJobs.map((j) => (
            <GeneratingJobCard key={j.id} job={j} />
          ))}
        </div>
      )}

      {pausedQuizzes && pausedQuizzes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Resume paused</h2>
          {pausedQuizzes.map((pq) => (
            <PausedQuizHomeCard key={`${pq.chapter_id}-${pq.exercise_type}`} pq={pq} />
          ))}
        </div>
      )}

      {errorJobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Failed</h2>
          {errorJobs.map((j) => (
            <ErrorJobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </section>
  );
}
