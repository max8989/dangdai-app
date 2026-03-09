/**
 * useGrammarPoints Hook
 *
 * TanStack Query hook for fetching grammar points for a specific chapter.
 * Queries the `grammar_points` table filtered by book_id and lesson_id,
 * ordered by grammar_order (original textbook order).
 *
 * Gracefully handles missing table (42P01) by returning an empty array.
 *
 * Story 11.6: Grammar Points Browse Screen — Task 2
 * Story 3.7: Wire Browse Screen Navigation — useGrammarPointsCount added
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single example sentence within a grammar point */
export interface GrammarExample {
  traditional: string
  pinyin: string
  english: string
}

/** A single grammar point from the grammar_points table */
export interface GrammarPoint {
  id: string
  grammar_order: number
  title_english: string
  title_chinese: string | null
  function_description: string | null
  structure_pattern: string | null
  usage_notes: string | null
  examples: GrammarExample[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches grammar points for a chapter, ordered by grammar_order.
 *
 * @param bookId - The book ID (1–4)
 * @param lessonId - The lesson number within the book (1–15)
 * @returns TanStack Query result with data as GrammarPoint[]
 */
export function useGrammarPoints(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.grammarPoints(bookId, lessonId),
    queryFn: async (): Promise<GrammarPoint[]> => {
      const { data, error } = await supabase
        .from('grammar_points')
        .select(
          'id, grammar_order, title_english, title_chinese, function_description, structure_pattern, usage_notes, examples'
        )
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('grammar_order', { ascending: true })

      if (error) {
        // Gracefully handle missing table (Story 1.10 not yet applied)
        if (error.code === '42P01') {
          console.warn('grammar_points table not found - returning empty array')
          return []
        }
        throw error
      }

      // Cast through unknown because Supabase types examples as Json (JSONB column),
      // but we know the runtime shape matches GrammarPoint[] from our schema.
      return (data ?? []) as unknown as GrammarPoint[]
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 minutes — grammar is static textbook content
  })
}

// ─── Count Hook ───────────────────────────────────────────────────────────────

/**
 * Checks whether grammar points content exists for a chapter.
 *
 * Uses a HEAD query (count only, no rows returned) for efficiency.
 * Returns true if at least one grammar point exists, false otherwise.
 * Gracefully handles missing table (42P01) by returning false.
 *
 * @param bookId - The book ID (1–4)
 * @param lessonId - The lesson number within the book (1–15)
 * @returns TanStack Query result with data as boolean
 */
export function useGrammarPointsCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.grammarPointsCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('grammar_points')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)

      if (error) {
        if (error.code === '42P01') {
          console.warn('grammar_points table not found - returning false')
          return false
        }
        throw error
      }
      return (count ?? 0) > 0
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 min — static textbook content
  })
}
