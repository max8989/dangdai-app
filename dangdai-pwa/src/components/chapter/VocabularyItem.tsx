import type { VocabularyItem as VocabularyItemType } from '@/hooks/useVocabulary';

interface VocabularyItemProps {
  item: VocabularyItemType;
}

export function VocabularyItem({ item }: VocabularyItemProps) {
  const { traditional, pinyin, english, part_of_speech, is_name } = item;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-2xl font-bold leading-tight">{traditional}</p>
        <p className="text-sm text-muted-foreground">{pinyin}</p>
        <p className="text-sm">{english}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        {part_of_speech && (
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {part_of_speech}
          </span>
        )}
        {is_name && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Name
          </span>
        )}
      </div>
    </div>
  );
}
