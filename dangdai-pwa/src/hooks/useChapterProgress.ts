import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { ChapterProgress } from '@/types/chapter';

export interface ChapterProgressMap {
  [chapterId: number]: ChapterProgress;
}

export function useChapterProgress(bookId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.chapterProgress(user?.id ?? '', bookId),
    queryFn: async (): Promise<ChapterProgressMap> => {
      if (!user) return {};

      const { data, error } = await supabase
        .from('chapter_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('chapter_progress table not found - returning empty progress');
          return {};
        }
        throw error;
      }

      return (data ?? []).reduce((acc, row) => {
        acc[row.chapter_id] = {
          id: row.id,
          userId: row.user_id,
          chapterId: row.chapter_id,
          bookId: row.book_id,
          completionPercentage: row.completion_percentage,
          masteredAt: row.mastered_at,
          updatedAt: row.updated_at,
        };
        return acc;
      }, {} as ChapterProgressMap);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}
