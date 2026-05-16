import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { GrammarPoint } from '@/hooks/useGrammarPoints';
import { cn } from '@/lib/utils';

interface GrammarPointCardProps {
  item: GrammarPoint;
}

export function GrammarPointCard({ item }: GrammarPointCardProps) {
  const {
    title_english,
    title_chinese,
    function_description,
    structure_pattern,
    usage_notes,
    examples,
  } = item;

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 rounded-lg p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-bold leading-tight">{title_english}</p>
          {title_chinese && (
            <p className="text-sm text-muted-foreground">{title_chinese}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {function_description && (
            <div className="rounded-md bg-muted p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Function
              </p>
              <p className="text-sm">{function_description}</p>
            </div>
          )}

          {structure_pattern && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Structure
              </p>
              <p className="font-mono text-sm">{structure_pattern}</p>
            </div>
          )}

          {usage_notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Usage
              </p>
              <p className="text-sm">{usage_notes}</p>
            </div>
          )}

          {examples.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Examples
              </p>
              {examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-border pl-3">
                  <p className="text-lg font-medium">{ex.traditional}</p>
                  <p className="text-sm text-muted-foreground">{ex.pinyin}</p>
                  <p className="text-sm">{ex.english}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
