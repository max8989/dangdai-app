import { Check, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Chapter, ChapterProgress } from '@/types/chapter';

type ChapterStatus = 'not-started' | 'in-progress' | 'mastered';

interface ChapterListItemProps {
  chapter: Chapter;
  progress?: ChapterProgress | null;
  onClick: () => void;
}

function getStatus(percentage: number): ChapterStatus {
  if (percentage === 0) return 'not-started';
  if (percentage >= 80) return 'mastered';
  return 'in-progress';
}

const badgeConfig: Record<
  ChapterStatus,
  { bg: string; text: string; progressText: string; barColor: string }
> = {
  'not-started': {
    bg: 'bg-muted',
    text: 'text-foreground',
    progressText: 'text-muted-foreground',
    barColor: 'bg-muted-foreground',
  },
  'in-progress': {
    bg: 'bg-blue-100 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    progressText: 'text-blue-700 dark:text-blue-300',
    barColor: 'bg-blue-500',
  },
  mastered: {
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    progressText: 'text-emerald-700 dark:text-emerald-300',
    barColor: 'bg-emerald-500',
  },
};

export function ChapterListItem({ chapter, progress, onClick }: ChapterListItemProps) {
  const raw = progress?.completionPercentage ?? 0;
  const percentage = Math.max(0, Math.min(100, raw));
  const status = getStatus(percentage);
  const config = badgeConfig[status];
  const progressText = status === 'mastered' ? 'Mastered' : `${percentage}%`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chapter ${chapter.chapterNumber}: ${chapter.titleEnglish}, ${chapter.titleChinese}`}
      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-transform active:scale-[0.98] hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-full',
          config.bg,
          config.text,
        )}
      >
        {status === 'mastered' ? (
          <Check className="size-5" />
        ) : (
          <span className="text-lg font-semibold">{chapter.chapterNumber}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{chapter.titleEnglish}</p>
          <span className={cn('text-xs', config.progressText)}>{progressText}</span>
        </div>
        <p className="text-sm text-muted-foreground">{chapter.titleChinese}</p>

        {status === 'in-progress' && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full', config.barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
