import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Book, BookProgress } from '@/types/chapter';

interface BookCardProps {
  book: Book;
  progress: BookProgress;
  onClick: () => void;
}

const coverStyleMap: Record<string, { gradient: string; ring: string }> = {
  $blue9: {
    gradient: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
    ring: 'ring-blue-300/40',
  },
  $green9: {
    gradient: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600',
    ring: 'ring-emerald-300/40',
  },
  $orange9: {
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500',
    ring: 'ring-orange-300/40',
  },
  $purple9: {
    gradient: 'bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-700',
    ring: 'ring-purple-300/40',
  },
};

const chineseNumerals: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
};

export function BookCard({ book, progress, onClick }: BookCardProps) {
  const percent =
    progress.totalChapters > 0
      ? Math.round((progress.chaptersCompleted / progress.totalChapters) * 100)
      : 0;
  const cover = coverStyleMap[book.coverColor] ?? coverStyleMap.$blue9;
  const numeral = chineseNumerals[book.id] ?? String(book.id);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${book.title}, ${progress.chaptersCompleted} of ${progress.totalChapters} chapters completed`}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.98] hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md text-white shadow-md ring-1',
          cover.gradient,
          cover.ring,
        )}
      >
        <span className="absolute inset-y-2 left-1 w-px bg-white/30" />
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
        <span className="relative font-serif text-3xl font-semibold drop-shadow-sm">
          {numeral}
        </span>
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
