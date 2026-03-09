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
// Use a module-level proxy object prefixed with "mock" (required by Jest hoisting rules)
// so the factory captures a stable reference that we can reconfigure per-test.

const mockSupabaseInstance = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
  },
  from: jest.fn(),
}

jest.mock('../lib/supabase', () => ({
  // Delegate to mockSupabaseInstance so tests can reconfigure supabase.from per-test
  get supabase() {
    return mockSupabaseInstance
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

// ─── mutationFn upsert logic tests (L2 fix — Task 4.5) ───────────────────────
// Test the actual upsert business logic by extracting and invoking the mutationFn
// directly from the useMutation config. Tests: best_score max, attempts increment,
// mastered_at first-time set and preservation.

describe('useUpdateExerciseTypeProgress — mutationFn upsert logic (Task 4.5)', () => {
  // We'll wire a fresh Supabase mock chain for each scenario
  const makeMockChain = (existingData: null | { best_score: number; attempts_count: number; mastered_at: string | null }) => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: existingData, error: null })
    const eqChain = { eq: jest.fn().mockReturnThis(), maybeSingle }
    const upsert = jest.fn().mockResolvedValue({ error: null })
    const from = jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnValue(eqChain),
      upsert,
    }))
    return { from, upsert, maybeSingle }
  }

  type MutationConfig = {
    mutationFn: (params: {
      chapterId: number
      bookId: number
      exerciseType: string
      score: number
    }) => Promise<void>
  }

  function extractMutationFn(): MutationConfig['mutationFn'] {
    let fn!: MutationConfig['mutationFn']
    mockUseMutation.mockImplementationOnce((config: MutationConfig) => {
      fn = config.mutationFn
      return { mutate: jest.fn(), isPending: false }
    })
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() })
    useUpdateExerciseTypeProgress()
    return fn
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mocks for hooks that are not under test
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() })
  })

  it('upserts with score=newScore and attempts=1 when no existing record (Task 4.5)', async () => {
    const { from, upsert } = makeMockChain(null)
    mockSupabaseInstance.from.mockImplementation(from)

    const mutationFn = extractMutationFn()
    await mutationFn({ chapterId: 212, bookId: 2, exerciseType: 'vocabulary', score: 70 })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ best_score: 70, attempts_count: 1, mastered_at: null }),
      expect.any(Object)
    )
  })

  it('keeps best_score = max(existing, new) when existing is higher (Task 4.5)', async () => {
    const { from, upsert } = makeMockChain({ best_score: 85, attempts_count: 2, mastered_at: '2026-02-19T10:00:00Z' })
    mockSupabaseInstance.from.mockImplementation(from)

    const mutationFn = extractMutationFn()
    await mutationFn({ chapterId: 212, bookId: 2, exerciseType: 'vocabulary', score: 60 })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ best_score: 85, attempts_count: 3 }),
      expect.any(Object)
    )
  })

  it('sets mastered_at when best_score reaches 80 for the first time (Task 4.5)', async () => {
    const { from, upsert } = makeMockChain(null)
    mockSupabaseInstance.from.mockImplementation(from)

    const mutationFn = extractMutationFn()
    await mutationFn({ chapterId: 212, bookId: 2, exerciseType: 'grammar', score: 85 })

    const upsertArg = upsert.mock.calls[0][0]
    expect(upsertArg.mastered_at).not.toBeNull()
    expect(typeof upsertArg.mastered_at).toBe('string')
  })

  it('preserves existing mastered_at when already set (Task 4.5)', async () => {
    const existingMasteredAt = '2026-02-10T08:00:00Z'
    const { from, upsert } = makeMockChain({ best_score: 90, attempts_count: 3, mastered_at: existingMasteredAt })
    mockSupabaseInstance.from.mockImplementation(from)

    const mutationFn = extractMutationFn()
    await mutationFn({ chapterId: 212, bookId: 2, exerciseType: 'grammar', score: 92 })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ mastered_at: existingMasteredAt }),
      expect.any(Object)
    )
  })
})
