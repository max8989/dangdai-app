import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react';

import { ChapterListItem } from '@/components/chapter/ChapterListItem';
import { ChapterListSkeleton } from '@/components/chapter/ChapterListSkeleton';
import { Button } from '@/components/ui/button';
import { BOOKS } from '@/constants/books';
import { useChapterProgress } from '@/hooks/useChapterProgress';
import { useChapters } from '@/hooks/useChapters';

export const Route = createFileRoute('/_authed/chapter/$bookId')({
  component: ChapterListPage,
});

function ChapterListPage() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();

  const bookIdNum = Number.parseInt(bookId, 10);
  const book = BOOKS.find((b) => b.id === bookIdNum);
  const chapters = useChapters(bookIdNum);

  const {
    data: progressMap,
    isLoading: isProgressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useChapterProgress(bookIdNum);

  const handleChapterClick = (chapterId: number) => {
    void navigate({
      to: '/quiz/$chapterId',
      params: { chapterId: String(chapterId) },
    });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col bg-background">
      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur"
        style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
      >
        <Button asChild variant="ghost" size="icon" aria-label="Back to books">
          <Link to="/books">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">{book?.title ?? 'Chapters'}</h1>
      </header>

      <section className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{book?.titleChinese}</p>
          <p className="mt-1 text-sm text-muted-foreground">{chapters.length} chapters</p>
        </div>

        {progressError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
            <AlertCircle className="size-12 text-orange-500" />
            <p className="text-center text-base font-medium">Couldn't load progress</p>
            <p className="text-center text-sm text-muted-foreground">
              Check your connection and try again
            </p>
            <Button onClick={() => refetchProgress()} className="gap-2">
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        ) : isProgressLoading ? (
          <div className="flex flex-col gap-3">
            <ChapterListSkeleton count={chapters.length} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chapters.map((chapter) => (
              <ChapterListItem
                key={chapter.id}
                chapter={chapter}
                progress={progressMap?.[chapter.id] ?? null}
                onClick={() => handleChapterClick(chapter.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
