import { cn } from '@/lib/utils';
import type { DialogueLine } from '@/hooks/useDialogues';

export interface DialogueBubbleProps {
  line: DialogueLine;
  showPinyin: boolean;
  showEnglish: boolean;
  showSimplified: boolean;
  isAlternate: boolean;
}

export function DialogueBubble({
  line,
  showPinyin,
  showEnglish,
  showSimplified,
  isAlternate,
}: DialogueBubbleProps) {
  const { speaker, traditional, simplified, pinyin, english } = line;

  return (
    <div
      className={cn(
        'my-2 flex flex-col',
        isAlternate ? 'items-end' : 'items-start',
      )}
    >
      <span className="mx-1 mb-1 text-xs text-muted-foreground">{speaker}</span>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl border p-3 shadow-sm',
          isAlternate ? 'bg-accent' : 'bg-card',
        )}
      >
        <p className="text-lg font-medium">{traditional}</p>
        {showSimplified && simplified && (
          <p className="mt-1 text-sm text-muted-foreground">{simplified}</p>
        )}
        {showPinyin && pinyin && (
          <p className="mt-1 text-sm italic text-muted-foreground">{pinyin}</p>
        )}
        {showEnglish && english && <p className="mt-1 text-sm">{english}</p>}
      </div>
    </div>
  );
}
