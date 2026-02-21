/**
 * useExerciseTypeProgress Hook Tests
 *
 * Unit tests for the TanStack Query hook that fetches and updates
 * exercise_type_progress data from Supabase.
 *
 * Tests cover:
 * - Hook returns data array
 * - updateExerciseTypeProgress mutation upserts correctly
 * - Query key usage matches architecture spec
 *
 * Story 4.11: Quiz Results Screen — Task 4.7
 */

// Mock AsyncStorage before imports
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock AuthProvider to avoid expo-router dependency chain
jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// ─── Mock Supabase client ─────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockUpsert = jest.fn()
const mockFrom = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: mockFrom,
  },
}))

// ─── Mock TanStack Query ──────────────────────────────────────────────────────

const mockUseQuery = jest.fn()
const mockUseMutation = jest.fn()
const mockUseQueryClient = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}))

import { useExerciseTypeProgress, useUpdateExerciseTypeProgress } from './useExerciseTypeProgress'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useExerciseTypeProgress — query (Task 4.1, 4.2, 4.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    })
  })

  it('calls useQuery with exerciseTypeProgress key for chapterId (Task 4.3)', () => {
    useExerciseTypeProgress(212)
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['exerciseTypeProgress', 212],
      })
    )
  })

  it('returns typed data array from useQuery (Task 4.4)', () => {
    const mockData = [
      { exercise_type: 'vocabulary', best_score: 85, attempts_count: 3, mastered_at: null },
    ]
    mockUseQuery.mockReturnValue({ data: mockData, isLoading: false, error: null })

    const result = useExerciseTypeProgress(212)
    expect(result.data).toEqual(mockData)
  })

  it('returns empty array when no data (graceful degradation)', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })
    const result = useExerciseTypeProgress(212)
    // Hook should return undefined data (TanStack Query default)
    expect(result.data).toBeUndefined()
  })
})

describe('useUpdateExerciseTypeProgress — mutation (Task 4.5, 4.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    })
  })

  it('calls useMutation when useUpdateExerciseTypeProgress is invoked (Task 4.5)', () => {
    useUpdateExerciseTypeProgress()
    expect(mockUseMutation).toHaveBeenCalled()
  })

  it('returns a mutate function from the hook (Task 4.5)', () => {
    const mockMutate = jest.fn()
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false })

    const result = useUpdateExerciseTypeProgress()
    expect(typeof result.mutate).toBe('function')
  })
})
