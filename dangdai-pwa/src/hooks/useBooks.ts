import { useQuery } from '@tanstack/react-query';

import { BOOKS } from '@/constants/books';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { BookProgress } from '@/types/chapter';

function getDefaultProgress(): Record<number, BookProgress> {
  return BOOKS.reduce(
    (acc, book) => {
      acc[book.id] = {
        bookId: book.id,
        chaptersCompleted: 0,
        totalChapters: book.chapterCount,
      };
      return acc;
    },
    {} as Record<number, BookProgress>,
  );
}

export function useBooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: user ? queryKeys.books(user.id) : queryKeys.booksAll,
    queryFn: async (): Promise<Record<number, BookProgress>> => {
      if (!user) return getDefaultProgress();

      const { data, error } = await supabase
        .from('chapter_progress')
        .select('book_id, completion_percentage')
        .eq('user_id', user.id)
        .gte('completion_percentage', 80);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('chapter_progress table does not exist yet');
          return getDefaultProgress();
        }
        throw error;
      }

      const progressByBook: Record<number, number> = {};
      data?.forEach((row) => {
        progressByBook[row.book_id] = (progressByBook[row.book_id] ?? 0) + 1;
      });

      return BOOKS.reduce(
        (acc, book) => {
          acc[book.id] = {
            bookId: book.id,
            chaptersCompleted: progressByBook[book.id] ?? 0,
            totalChapters: book.chapterCount,
          };
          return acc;
        },
        {} as Record<number, BookProgress>,
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
