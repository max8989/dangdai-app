/**
 * useDialogues Hook
 *
 * TanStack Query hook for fetching dialogues for a specific chapter.
 * Queries the `dialogues` table filtered by book_id and lesson_id,
 * ordered by dialogue_number (original textbook order).
 *
 * Each dialogue contains a `lines` JSONB array with speaker turns.
 * The `lines` column is cast from Supabase's `Json` type to `DialogueLine[]`.
 *
 * Gracefully handles missing table (42P01) by returning an empty array.
 *
 * Story 11.7: Dialogue Browse Screen — Task 2
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single line (speaker turn) within a dialogue */
export interface DialogueLine {
  speaker: string
  traditional: string
  simplified?: string
  pinyin?: string
  english?: string
}

/** A single dialogue from the dialogues table */
export interface Dialogue {
  id: string
  dialogue_number: number
  title_traditional: string | null
  title_english: string | null
  lines: DialogueLine[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches dialogues for a chapter, ordered by dialogue_number.
 *
 * @param bookId - The book ID (1–4)
 * @param lessonId - The lesson number within the book (1–15)
 * @returns TanStack Query result with data as Dialogue[]
 */
export function useDialogues(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.dialogues(bookId, lessonId),
    queryFn: async (): Promise<Dialogue[]> => {
      const { data, error } = await supabase
        .from('dialogues')
        .select('id, dialogue_number, title_traditional, title_english, lines')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('dialogue_number', { ascending: true })

      if (error) {
        // Gracefully handle missing table (Story 1.10 not yet applied)
        if (error.code === '42P01') {
          console.warn('dialogues table not found - returning empty array')
          return []
        }
        throw error
      }

      // Cast through unknown because Supabase types `lines` as Json (JSONB column),
      // but we know the runtime shape matches DialogueLine[] from our schema.
      return (data ?? []) as unknown as Dialogue[]
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 minutes — dialogues are static textbook content
  })
}
