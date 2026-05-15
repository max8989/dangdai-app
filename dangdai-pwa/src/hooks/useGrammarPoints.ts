import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export interface GrammarExample {
  traditional: string;
  pinyin: string;
  english: string;
}

export interface GrammarPoint {
  id: string;
  grammar_order: number;
  title_english: string;
  title_chinese: string | null;
  function_description: string | null;
  structure_pattern: string | null;
  usage_notes: string | null;
  examples: GrammarExample[];
}

export function useGrammarPoints(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.grammarPoints(bookId, lessonId),
    queryFn: async (): Promise<GrammarPoint[]> => {
      const { data, error } = await supabase
        .from('grammar_points')
        .select(
          'id, grammar_order, title_english, title_chinese, function_description, structure_pattern, usage_notes, examples',
        )
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('grammar_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('grammar_points table not found - returning empty array');
          return [];
        }
        throw error;
      }
      return (data ?? []) as unknown as GrammarPoint[];
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30,
  });
}

export function useGrammarPointsCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.grammarPointsCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('grammar_points')
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
