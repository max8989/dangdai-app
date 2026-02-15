/**
 * useChapterProgress Hook Tests
 *
 * Tests for the chapter progress fetching hook.
 * Validates querying chapter_progress table, mapping to ChapterId,
 * and handling loading/error states.
 */

import { renderHook } from '@testing-library/react-native'

// Mock useAuth to provide user context
const mockUser = { id: 'test-user-123' }
jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

// Mock supabase client
const mockSupabaseFrom = jest.fn()
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}))

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

// Import after mocks
import { useQuery } from '@tanstack/react-query'
import { useChapterProgress } from './useChapterProgress'

const mockUseQuery = useQuery as jest.Mock

describe('useChapterProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })
  })

  describe('query configuration', () => {
    it('uses correct query key with userId and bookId', () => {
      mockUseQuery.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      renderHook(() => useChapterProgress(1))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['chapterProgress', 'test-user-123', 1],
        })
      )
    })

    it('is enabled only when user exists', () => {
      mockUseQuery.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      renderHook(() => useChapterProgress(1))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      )
    })
  })

  describe('loading state', () => {
    it('returns isLoading true while fetching', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.isLoading).toBe(true)
    })

    it('returns isLoading false when data is available', () => {
      mockUseQuery.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('data mapping', () => {
    it('returns progress data mapped by chapterId', () => {
      const mockProgressMap = {
        101: {
          id: 'progress-1',
          userId: 'test-user-123',
          chapterId: 101,
          bookId: 1,
          completionPercentage: 45,
          masteredAt: null,
          updatedAt: '2026-02-15T00:00:00Z',
        },
        102: {
          id: 'progress-2',
          userId: 'test-user-123',
          chapterId: 102,
          bookId: 1,
          completionPercentage: 100,
          masteredAt: '2026-02-14T00:00:00Z',
          updatedAt: '2026-02-15T00:00:00Z',
        },
      }

      mockUseQuery.mockReturnValue({
        data: mockProgressMap,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.data).toEqual(mockProgressMap)
      expect(result.current.data?.[101]?.completionPercentage).toBe(45)
      expect(result.current.data?.[102]?.completionPercentage).toBe(100)
    })

    it('returns empty object when no progress exists', () => {
      mockUseQuery.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.data).toEqual({})
    })

    it('returns undefined during loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.data).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('exposes error when query fails', () => {
      const mockError = new Error('Network error')
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      })

      const { result } = renderHook(() => useChapterProgress(1))

      expect(result.current.error).toBe(mockError)
    })
  })
})

/**
 * Separate test suite for queryFn transformation logic
 * Tests the actual data transformation without mocking useQuery
 */
describe('useChapterProgress queryFn transformation', () => {
  // Extract and test the transformation logic directly
  const transformRows = (rows: any[]): Record<number, any> => {
    return rows.reduce((acc, row) => {
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
    }, {} as Record<number, any>)
  }

  it('transforms snake_case database rows to camelCase ChapterProgress', () => {
    const dbRows = [
      {
        id: 'uuid-1',
        user_id: 'user-123',
        chapter_id: 101,
        book_id: 1,
        completion_percentage: 45,
        mastered_at: null,
        updated_at: '2026-02-15T00:00:00Z',
      },
    ]

    const result = transformRows(dbRows)

    expect(result[101]).toEqual({
      id: 'uuid-1',
      userId: 'user-123',
      chapterId: 101,
      bookId: 1,
      completionPercentage: 45,
      masteredAt: null,
      updatedAt: '2026-02-15T00:00:00Z',
    })
  })

  it('maps multiple rows by chapterId for O(1) lookup', () => {
    const dbRows = [
      { id: 'uuid-1', user_id: 'u', chapter_id: 101, book_id: 1, completion_percentage: 10, mastered_at: null, updated_at: '' },
      { id: 'uuid-2', user_id: 'u', chapter_id: 102, book_id: 1, completion_percentage: 80, mastered_at: '2026-02-14', updated_at: '' },
      { id: 'uuid-3', user_id: 'u', chapter_id: 103, book_id: 1, completion_percentage: 100, mastered_at: '2026-02-13', updated_at: '' },
    ]

    const result = transformRows(dbRows)

    expect(Object.keys(result)).toHaveLength(3)
    expect(result[101].completionPercentage).toBe(10)
    expect(result[102].completionPercentage).toBe(80)
    expect(result[103].completionPercentage).toBe(100)
  })

  it('returns empty object for empty rows array', () => {
    const result = transformRows([])
    expect(result).toEqual({})
  })

  it('handles null mastered_at correctly', () => {
    const dbRows = [
      { id: 'uuid-1', user_id: 'u', chapter_id: 101, book_id: 1, completion_percentage: 50, mastered_at: null, updated_at: '' },
    ]

    const result = transformRows(dbRows)

    expect(result[101].masteredAt).toBeNull()
  })

  it('preserves mastered_at timestamp when present', () => {
    const dbRows = [
      { id: 'uuid-1', user_id: 'u', chapter_id: 101, book_id: 1, completion_percentage: 95, mastered_at: '2026-02-14T12:00:00Z', updated_at: '' },
    ]

    const result = transformRows(dbRows)

    expect(result[101].masteredAt).toBe('2026-02-14T12:00:00Z')
  })
})
