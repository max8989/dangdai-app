/**
 * useChapters Hook Tests
 *
 * Tests for chapter retrieval hooks.
 * Since chapters are static data, these hooks use memoization rather than TanStack Query.
 */

import { renderHook } from '@testing-library/react-native'

import { useChapters, useChapter } from './useChapters'
import type { Chapter } from '../types/chapter'

describe('useChapters', () => {
  it('returns 15 chapters for Book 1', () => {
    const { result } = renderHook(() => useChapters(1))

    expect(result.current).toHaveLength(15)
    result.current.forEach((chapter) => {
      expect(chapter.bookId).toBe(1)
    })
  })

  it('returns 15 chapters for Book 2', () => {
    const { result } = renderHook(() => useChapters(2))

    expect(result.current).toHaveLength(15)
    result.current.forEach((chapter) => {
      expect(chapter.bookId).toBe(2)
    })
  })

  it('returns 12 chapters for Book 3', () => {
    const { result } = renderHook(() => useChapters(3))

    expect(result.current).toHaveLength(12)
    result.current.forEach((chapter) => {
      expect(chapter.bookId).toBe(3)
    })
  })

  it('returns 12 chapters for Book 4', () => {
    const { result } = renderHook(() => useChapters(4))

    expect(result.current).toHaveLength(12)
    result.current.forEach((chapter) => {
      expect(chapter.bookId).toBe(4)
    })
  })

  it('returns empty array for non-existent book', () => {
    const { result } = renderHook(() => useChapters(999))

    expect(result.current).toHaveLength(0)
  })

  it('returns chapters in sorted order', () => {
    const { result } = renderHook(() => useChapters(1))

    for (let i = 1; i < result.current.length; i++) {
      expect(result.current[i].chapterNumber).toBeGreaterThan(
        result.current[i - 1].chapterNumber
      )
    }
  })

  it('memoizes result for same bookId', () => {
    const { result, rerender } = renderHook<Chapter[], { bookId: number }>(
      ({ bookId }) => useChapters(bookId),
      { initialProps: { bookId: 1 } }
    )

    const firstResult = result.current

    rerender({ bookId: 1 })

    expect(result.current).toBe(firstResult)
  })

  it('returns new result when bookId changes', () => {
    const { result, rerender } = renderHook<Chapter[], { bookId: number }>(
      ({ bookId }) => useChapters(bookId),
      { initialProps: { bookId: 1 } }
    )

    const firstResult = result.current

    rerender({ bookId: 2 })

    expect(result.current).not.toBe(firstResult)
    expect(result.current[0].bookId).toBe(2)
  })
})

describe('useChapter', () => {
  it('returns chapter by ID', () => {
    const { result } = renderHook(() => useChapter(105))

    expect(result.current).toBeDefined()
    expect(result.current?.id).toBe(105)
    expect(result.current?.bookId).toBe(1)
    expect(result.current?.chapterNumber).toBe(5)
    expect(result.current?.titleEnglish).toBe('Dates')
  })

  it('returns undefined for non-existent chapter', () => {
    const { result } = renderHook(() => useChapter(999))

    expect(result.current).toBeUndefined()
  })

  it('can find first chapter of Book 1', () => {
    const { result } = renderHook(() => useChapter(101))

    expect(result.current?.chapterNumber).toBe(1)
    expect(result.current?.bookId).toBe(1)
  })

  it('can find first chapter of Book 4', () => {
    const { result } = renderHook(() => useChapter(401))

    expect(result.current?.chapterNumber).toBe(1)
    expect(result.current?.bookId).toBe(4)
  })

  it('memoizes result for same chapterId', () => {
    const { result, rerender } = renderHook<Chapter | undefined, { chapterId: number }>(
      ({ chapterId }) => useChapter(chapterId),
      { initialProps: { chapterId: 101 } }
    )

    const firstResult = result.current

    rerender({ chapterId: 101 })

    expect(result.current).toBe(firstResult)
  })

  it('returns new result when chapterId changes', () => {
    const { result, rerender } = renderHook<Chapter | undefined, { chapterId: number }>(
      ({ chapterId }) => useChapter(chapterId),
      { initialProps: { chapterId: 101 } }
    )

    const firstResult = result.current

    rerender({ chapterId: 201 })

    expect(result.current).not.toBe(firstResult)
    expect(result.current?.bookId).toBe(2)
  })
})
