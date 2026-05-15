import { createFileRoute } from '@tanstack/react-router';

import { GrammarPointCard } from '@/components/chapter/GrammarPointCard';
import { useChapter } from '@/hooks/useChapters';
import { useGrammarPoints } from '@/hooks/useGrammarPoints';
import {
  CenterLoader,
  CenterMessage,
  ChapterSubheader,
  ErrorState,
} from '@/routes/_authed/chapter/$chapterId/vocabulary';

export const Route = createFileRoute('/_authed/chapter/$chapterId/grammar')({
  component: GrammarPage,
});

function GrammarPage() {
  const { chapterId } = Route.useParams();
  const chapterIdNum = Number.parseInt(chapterId, 10);
  const valid = !Number.isNaN(chapterIdNum) && chapterIdNum > 0;
  const bookId = valid ? Math.floor(chapterIdNum / 100) : 0;
  const lessonId = valid ? chapterIdNum % 100 : 0;

  const chapter = useChapter(chapterIdNum);
  const { data: points, isLoading, error, refetch } = useGrammarPoints(bookId, lessonId);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <ChapterSubheader title="Grammar Points" bookId={bookId} chapter={chapter?.titleEnglish} />

      <main className="flex-1 p-4">
        {!valid ? (
          <CenterMessage title="Invalid chapter ID" />
        ) : isLoading ? (
          <CenterLoader label="Loading grammar points..." />
        ) : error ? (
          <ErrorState title="Couldn't load grammar points" onRetry={() => refetch()} />
        ) : !points || points.length === 0 ? (
          <CenterMessage
            title="No grammar points found"
            body="Grammar points for this chapter haven't been added yet"
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {points.length} {points.length === 1 ? 'grammar point' : 'grammar points'}
            </p>
            {points.map((p) => (
              <GrammarPointCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
