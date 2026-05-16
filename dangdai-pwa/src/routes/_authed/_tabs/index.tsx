import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookOpen, Pause, Play, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MaixinLogo } from '@/components/MaixinLogo';
import { APP_NAME } from '@/constants/app';
import { getChapter } from '@/constants/chapters';
import { useAllPausedQuizzes } from '@/hooks/usePausedQuiz';
import { usePauseQuiz } from '@/hooks/usePauseQuiz';
import { EXERCISE_TYPE_LABELS, type ExerciseType } from '@/types/quiz';
import type { PausedQuiz } from '@/types/paused-quiz';

export const Route = createFileRoute('/_authed/_tabs/')({
  component: HomePage,
});

function formatTimeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
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

function HomePage() {
  const { data: pausedQuizzes } = useAllPausedQuizzes();

  return (
    <section className="flex flex-col gap-6 p-4 pt-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <MaixinLogo width={220} />
        <h1 className="sr-only">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">Learn Chinese through quizzes</p>
      </header>

      {pausedQuizzes && pausedQuizzes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Resume paused</h2>
          {pausedQuizzes.map((pq) => (
            <PausedQuizHomeCard key={`${pq.chapter_id}-${pq.exercise_type}`} pq={pq} />
          ))}
        </div>
      )}

      <Button asChild size="lg" className="gap-2">
        <Link to="/books">
          <BookOpen className="size-5" />
          Browse books
        </Link>
      </Button>
    </section>
  );
}
