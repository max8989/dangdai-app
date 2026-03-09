/**
 * useVocabulary Hook
 *
 * TanStack Query hook for fetching vocabulary items for a specific chapter.
 * Queries the `vocabulary` table filtered by book_id and lesson_id,
 * ordered by vocab_section then sort_order (original textbook order).
 *
 * Returns data grouped by vocab_section ('I' | 'II') for SectionList rendering.
 *
 * Gracefully handles missing table (42P01) by returning empty sections.
 *
 * Story 11.5: Vocabulary Browse Screen — Task 2
 * Story 3.7: Wire Browse Screen Navigation — useVocabularyCount added
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single vocabulary item from the vocabulary table */
export interface VocabularyItem {
  id: string
  traditional: string
  pinyin: string
  english: string
  part_of_speech: string | null
  is_name: boolean
  vocab_section: 'I' | 'II'
  sort_order: number
}

/** A section of vocabulary items for SectionList rendering */
export interface VocabularySection {
  /** Section title: 'Vocab I' or 'Vocab II' */
  title: string
  /** Raw section key from DB: 'I' or 'II' */
  key: 'I' | 'II'
  data: VocabularyItem[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches vocabulary items for a chapter, grouped by vocab_section.
 *
 * @param bookId - The book ID (1–4)
 * @param lessonId - The lesson number within the book (1–15)
 * @returns TanStack Query result with data as VocabularySection[]
 */
export function useVocabulary(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.vocabulary(bookId, lessonId),
    queryFn: async (): Promise<VocabularySection[]> => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('id, traditional, pinyin, english, part_of_speech, is_name, vocab_section, sort_order')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('vocab_section', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) {
        // Gracefully handle missing table (Story 1.10 not yet applied)
        if (error.code === '42P01') {
          console.warn('vocabulary table not found - returning empty sections')
          return []
        }
        throw error
      }

      const items = (data ?? []) as VocabularyItem[]

      // Group items by vocab_section into SectionList-compatible format
      const sectionMap = new Map<'I' | 'II', VocabularyItem[]>()
      for (const item of items) {
        const section = item.vocab_section
        if (!sectionMap.has(section)) {
          sectionMap.set(section, [])
        }
        sectionMap.get(section)!.push(item)
      }

      // Build ordered sections array (I before II)
      const sections: VocabularySection[] = []
      for (const key of ['I', 'II'] as const) {
        const sectionItems = sectionMap.get(key)
        if (sectionItems && sectionItems.length > 0) {
          sections.push({
            title: `Vocab ${key}`,
            key,
            data: sectionItems,
          })
        }
      }

      return sections
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 minutes — vocabulary is static textbook content
  })
}

// ─── Count Hook ───────────────────────────────────────────────────────────────

/**
 * Checks whether vocabulary content exists for a chapter.
 *
 * Uses a HEAD query (count only, no rows returned) for efficiency.
 * Returns true if at least one vocabulary item exists, false otherwise.
 * Gracefully handles missing table (42P01) by returning false.
 *
 * @param bookId - The book ID (1–4)
 * @param lessonId - The lesson number within the book (1–15)
 * @returns TanStack Query result with data as boolean
 */
export function useVocabularyCount(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.vocabularyCount(bookId, lessonId),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)

      if (error) {
        if (error.code === '42P01') {
          console.warn('vocabulary table not found - returning false')
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
