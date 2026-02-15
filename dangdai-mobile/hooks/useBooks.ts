/**
 * useBooks Hook
 *
 * Fetches book progress data from Supabase chapter_progress table.
 * Returns progress for each book (chapters completed / total chapters).
 *
 * Note: If chapter_progress table doesn't exist yet (Story 6.1),
 * the query returns empty results and all books show 0/X progress.
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { queryKeys } from '../lib/queryKeys'
import { BOOKS } from '../constants/books'
import type { BookProgress } from '../types/chapter'

export function useBooks() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.books(user?.id ?? ''),
    queryFn: async (): Promise<Record<number, BookProgress>> => {
      if (!user) {
        // Return default progress for all books when not authenticated
        return BOOKS.reduce(
          (acc, book) => {
            acc[book.id] = {
              bookId: book.id,
              chaptersCompleted: 0,
              totalChapters: book.chapterCount,
            }
            return acc
          },
          {} as Record<number, BookProgress>
        )
      }

      // Query chapter_progress grouped by book_id
      // Only count chapters with completion_percentage >= 80 as "completed"
      const { data, error } = await supabase
        .from('chapter_progress')
        .select('book_id, completion_percentage')
        .eq('user_id', user.id)
        .gte('completion_percentage', 80)

      if (error) {
        // If table doesn't exist yet, return empty progress
        // This handles the case before Story 6.1 is implemented
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('chapter_progress table does not exist yet')
          return BOOKS.reduce(
            (acc, book) => {
              acc[book.id] = {
                bookId: book.id,
                chaptersCompleted: 0,
                totalChapters: book.chapterCount,
              }
              return acc
            },
            {} as Record<number, BookProgress>
          )
        }
        throw error
      }

      // Group by book and count completed chapters
      const progressByBook: Record<number, number> = {}
      data?.forEach((row) => {
        progressByBook[row.book_id] = (progressByBook[row.book_id] ?? 0) + 1
      })

      // Build progress object for each book
      return BOOKS.reduce(
        (acc, book) => {
          acc[book.id] = {
            bookId: book.id,
            chaptersCompleted: progressByBook[book.id] ?? 0,
            totalChapters: book.chapterCount,
          }
          return acc
        },
        {} as Record<number, BookProgress>
      )
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
