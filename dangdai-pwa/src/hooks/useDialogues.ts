import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export interface DialogueLine {
  speaker: string;
  traditional: string;
  simplified?: string;
  pinyin?: string;
  english?: string;
}

export interface Dialogue {
  id: string;
  dialogue_number: number;
  title_traditional: string | null;
  title_english: string | null;
  lines: DialogueLine[];
}

export function useDialogues(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.dialogues(bookId, lessonId),
    queryFn: async (): Promise<Dialogue[]> => {
      const { data, error } = await supabase
        .from('dialogues')
        .select('id, dialogue_number, title_traditional, title_english, lines')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('dialogue_number', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('dialogues table not found - returning empty array');
          return [];
        }
        throw error;
      }
      return (data ?? []) as unknown as Dialogue[];
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30,
  });
}

export function useDialoguesCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.dialoguesCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('dialogues')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId);

      if (error) {
        if (error.code === '42P01') return false;
        throw error;
      }
      return (count ?? 0) > 0;
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30,
  });
}
