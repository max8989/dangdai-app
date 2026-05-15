import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Book, BookProgress } from '@/types/chapter';

interface BookCardProps {
  book: Book;
  progress: BookProgress;
  onClick: () => void;
}

const coverColorMap: Record<string, string> = {
  $blue9: 'bg-blue-500',
  $green9: 'bg-emerald-500',
  $orange9: 'bg-orange-500',
  $purple9: 'bg-purple-500',
};

export function BookCard({ book, progress, onClick }: BookCardProps) {
  const percent =
    progress.totalChapters > 0
      ? Math.round((progress.chaptersCompleted / progress.totalChapters) * 100)
      : 0;
  const coverClass = coverColorMap[book.coverColor] ?? 'bg-blue-500';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${book.title}, ${progress.chaptersCompleted} of ${progress.totalChapters} chapters completed`}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.98] hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'flex h-20 w-14 shrink-0 items-center justify-center rounded-md text-3xl font-bold text-white',
          coverClass,
        )}
      >
        {book.id}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-base font-semibold leading-tight">{book.title}</p>
        <p className="text-sm text-muted-foreground">{book.titleChinese}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.chaptersCompleted}/{progress.totalChapters}
          </span>
        </div>
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
