import { Link, createFileRoute } from '@tanstack/react-router';
import { AlertCircle, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';

import { VocabularyItem } from '@/components/chapter/VocabularyItem';
import { Button } from '@/components/ui/button';
import { useChapter } from '@/hooks/useChapters';
import { useVocabulary } from '@/hooks/useVocabulary';

export const Route = createFileRoute('/_authed/chapter/$chapterId/vocabulary')({
  component: VocabularyPage,
});

function VocabularyPage() {
  const { chapterId } = Route.useParams();
  const chapterIdNum = Number.parseInt(chapterId, 10);
  const valid = !Number.isNaN(chapterIdNum) && chapterIdNum > 0;
  const bookId = valid ? Math.floor(chapterIdNum / 100) : 0;
  const lessonId = valid ? chapterIdNum % 100 : 0;

  const chapter = useChapter(chapterIdNum);
  const { data: sections, isLoading, error, refetch } = useVocabulary(bookId, lessonId);

  const total = sections?.reduce((sum, s) => sum + s.data.length, 0) ?? 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <ChapterSubheader title="Vocabulary" bookId={bookId} chapter={chapter?.titleEnglish} />

      <main className="flex-1 p-4">
        {!valid ? (
          <CenterMessage title="Invalid chapter ID" />
        ) : isLoading ? (
          <CenterLoader label="Loading vocabulary..." />
        ) : error ? (
          <ErrorState title="Couldn't load vocabulary" onRetry={() => refetch()} />
        ) : !sections || sections.length === 0 ? (
          <CenterMessage
            title="No vocabulary found"
            body="Vocabulary for this chapter hasn't been added yet"
          />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'word' : 'words'} total
            </p>
            {sections.map((section) => (
              <div key={section.key} className="flex flex-col gap-2">
                <div>
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {section.data.length} {section.data.length === 1 ? 'word' : 'words'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {section.data.map((item) => (
                    <VocabularyItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function ChapterSubheader({
  title,
  bookId,
  chapter,
}: {
  title: string;
  bookId: number;
  chapter?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
      <Button asChild variant="ghost" size="icon" aria-label="Back">
        <Link to="/chapter/$bookId" params={{ bookId: String(bookId) }}>
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <div className="flex flex-1 flex-col">
        <h1 className="text-base font-semibold leading-tight">{title}</h1>
        {chapter && <p className="text-xs text-muted-foreground">{chapter}</p>}
      </div>
    </header>
  );
}

export function CenterLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-16">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function CenterMessage({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
      <p className="text-base font-medium">{title}</p>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
      <AlertCircle className="size-12 text-orange-500" />
      <p className="text-base font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again</p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
