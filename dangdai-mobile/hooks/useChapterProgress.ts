/**
 * useChapterProgress Hook
 *
 * Fetches chapter progress for a specific book from Supabase.
 * Returns progress data mapped by chapterId for O(1) lookup.
 *
 * Progress data is cached for 2 minutes since it updates frequently.
 * If no user is authenticated, returns empty object.
 * If chapter_progress table doesn't exist yet (Epic 6), gracefully returns empty.
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { queryKeys } from '../lib/queryKeys'
import type { ChapterProgress } from '../types/chapter'

export interface ChapterProgressMap {
  [chapterId: number]: ChapterProgress
}

export function useChapterProgress(bookId: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.chapterProgress(user?.id ?? '', bookId),
    queryFn: async (): Promise<ChapterProgressMap> => {
      if (!user) return {}

      const { data, error } = await supabase
        .from('chapter_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)

      if (error) {
        // Gracefully handle missing table (Epic 6 not yet implemented)
        if (error.code === '42P01') {
          // relation does not exist
          console.warn('chapter_progress table not found - returning empty progress')
          return {}
        }
        throw error
      }

      // Convert array to map by chapterId for O(1) lookup
      return (data ?? []).reduce((acc, row) => {
        acc[row.chapter_id] = {
          id: row.id,
          userId: row.user_id,
          chapterId: row.chapter_id,
          bookId: row.book_id,
          completionPercentage: row.completion_percentage,
          masteredAt: row.mastered_at,
          updatedAt: row.updated_at,
        }
        return acc
      }, {} as ChapterProgressMap)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - progress changes frequently
  })
}
