import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export interface VocabularyItem {
  id: string;
  traditional: string;
  pinyin: string;
  english: string;
  part_of_speech: string | null;
  is_name: boolean;
  vocab_section: 'I' | 'II';
  sort_order: number;
}

export interface VocabularySection {
  title: string;
  key: 'I' | 'II';
  data: VocabularyItem[];
}

export function useVocabulary(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.vocabulary(bookId, lessonId),
    queryFn: async (): Promise<VocabularySection[]> => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select(
          'id, traditional, pinyin, english, part_of_speech, is_name, vocab_section, sort_order',
        )
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('vocab_section', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('vocabulary table not found - returning empty sections');
          return [];
        }
        throw error;
      }

      const items = (data ?? []) as VocabularyItem[];
      const sectionMap = new Map<'I' | 'II', VocabularyItem[]>();
      for (const item of items) {
        const section = item.vocab_section;
        if (!sectionMap.has(section)) sectionMap.set(section, []);
        sectionMap.get(section)!.push(item);
      }

      const sections: VocabularySection[] = [];
      for (const key of ['I', 'II'] as const) {
        const sectionItems = sectionMap.get(key);
        if (sectionItems && sectionItems.length > 0) {
          sections.push({ title: `Vocab ${key}`, key, data: sectionItems });
        }
      }
      return sections;
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30,
  });
}

export function useVocabularyCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.vocabularyCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('vocabulary')
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
