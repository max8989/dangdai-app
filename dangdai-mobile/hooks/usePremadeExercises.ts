/**
 * usePremadeExercises Hook
 *
 * TanStack Query hook for fetching premade workbook exercises from Supabase.
 * Queries the premade_exercises table filtered by book_id and lesson_id.
 * Only fetches metadata (not full content JSONB) for the list screen.
 *
 * Gracefully handles missing table (42P01) by returning an empty array.
 * Uses staleTime of 30 minutes since premade exercises are static content.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 3
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Metadata for a premade exercise (no content JSONB — list screen only) */
export interface PremadeExercise {
  id: string
  exercise_type: string
  exercise_order: number
  /** Title may be null in the database if not yet populated */
  title: string | null
  /** Instructions may be null in the database if not yet populated */
  instructions: string | null
  difficulty: string | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches premade exercise metadata for a chapter.
 *
 * Returns an empty array when:
 * - The premade_exercises table doesn't exist yet (42P01 graceful degradation)
 * - No exercises exist for the given book/lesson combination
 *
 * @param bookId - The book ID (e.g., 1 for Book 1)
 * @param lessonId - The lesson/chapter number within the book (e.g., 5 for Chapter 5)
 */
export function usePremadeExercises(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.premadeExercises(bookId, lessonId),
    queryFn: async (): Promise<PremadeExercise[]> => {
      const { data, error } = await supabase
        .from('premade_exercises')
        .select('id, exercise_type, exercise_order, title, instructions, difficulty')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('exercise_order', { ascending: true })

      if (error) {
        // Gracefully handle missing table (not yet migrated — Story 1.10 dependency)
        if (error.code === '42P01') {
          console.warn('premade_exercises table not found. Hiding premade section.')
          return []
        }
        throw error
      }

      return data ?? []
    },
    enabled: !!bookId && !!lessonId,
    // Static content — 30 minute stale time
    staleTime: 1000 * 60 * 30,
  })
}
