/**
 * useChapters Hooks
 *
 * Hooks for accessing chapter data.
 * Since chapters are static constants, no TanStack Query needed.
 * Simple memoization is sufficient for optimal performance.
 */

import { useMemo } from 'react'

import { getChaptersByBook, getChapter } from '../constants/chapters'
import type { Chapter } from '../types/chapter'

/**
 * Get all chapters for a specific book.
 * Returns memoized array of chapters sorted by chapter number.
 *
 * @param bookId - The book ID (1-4)
 * @returns Array of chapters for the book
 */
export function useChapters(bookId: number): Chapter[] {
  return useMemo(() => getChaptersByBook(bookId), [bookId])
}

/**
 * Get a single chapter by its ID.
 * Returns memoized chapter or undefined if not found.
 *
 * @param chapterId - The chapter ID (e.g., 105 for Book 1, Chapter 5)
 * @returns Chapter object or undefined
 */
export function useChapter(chapterId: number): Chapter | undefined {
  return useMemo(() => getChapter(chapterId), [chapterId])
}
