import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { DialogueBubble } from '@/components/chapter/DialogueBubble';
import { Button } from '@/components/ui/button';
import { useChapter } from '@/hooks/useChapters';
import { useDialogues } from '@/hooks/useDialogues';
import { cn } from '@/lib/utils';
import {
  CenterLoader,
  CenterMessage,
  ChapterSubheader,
  ErrorState,
} from '@/routes/_authed/chapter/$chapterId/vocabulary';

export const Route = createFileRoute('/_authed/chapter/$chapterId/dialogues')({
  component: DialoguesPage,
});

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

function DialoguesPage() {
  const { chapterId } = Route.useParams();
  const chapterIdNum = Number.parseInt(chapterId, 10);
  const valid = !Number.isNaN(chapterIdNum) && chapterIdNum > 0;
  const bookId = valid ? Math.floor(chapterIdNum / 100) : 0;
  const lessonId = valid ? chapterIdNum % 100 : 0;

  const chapter = useChapter(chapterIdNum);
  const { data: dialogues, isLoading, error, refetch } = useDialogues(bookId, lessonId);

  const [showPinyin, setShowPinyin] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <ChapterSubheader title="Dialogues" bookId={bookId} chapter={chapter?.titleEnglish} />

      {!valid ? (
        <main className="flex-1 p-4">
          <CenterMessage title="Invalid chapter ID" />
        </main>
      ) : isLoading ? (
        <main className="flex-1 p-4">
          <CenterLoader label="Loading dialogues..." />
        </main>
      ) : error ? (
        <main className="flex-1 p-4">
          <ErrorState title="Couldn't load dialogues" onRetry={() => refetch()} />
        </main>
      ) : !dialogues || dialogues.length === 0 ? (
        <main className="flex-1 p-4">
          <CenterMessage
            title="No dialogues found"
            body="Dialogues for this chapter haven't been added yet"
          />
        </main>
      ) : (
        <>
          <div
            className="sticky z-20 flex items-center justify-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur"
            style={{ top: 'calc(3rem + env(safe-area-inset-top))' }}
          >
            <ToggleButton active={showPinyin} onClick={() => setShowPinyin((s) => !s)}>
              Pinyin
            </ToggleButton>
            <ToggleButton active={showEnglish} onClick={() => setShowEnglish((s) => !s)}>
              English
            </ToggleButton>
            <ToggleButton active={showSimplified} onClick={() => setShowSimplified((s) => !s)}>
              Simplified
            </ToggleButton>
          </div>

          <main className="flex-1 p-4">
            <div className="flex flex-col gap-8">
              {dialogues.map((dialogue) => (
                <section key={dialogue.id} className="flex flex-col gap-2">
                  <div>
                    <h2 className="text-lg font-bold">Dialogue {toRoman(dialogue.dialogue_number)}</h2>
                    {dialogue.title_english && (
                      <p className="text-xs text-muted-foreground">{dialogue.title_english}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    {dialogue.lines.map((line, i) => (
                      <DialogueBubble
                        key={i}
                        line={line}
                        showPinyin={showPinyin}
                        showEnglish={showEnglish}
                        showSimplified={showSimplified}
                        isAlternate={i % 2 !== 0}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className={cn(active && 'shadow-sm')}
    >
      {children}
    </Button>
  );
}
