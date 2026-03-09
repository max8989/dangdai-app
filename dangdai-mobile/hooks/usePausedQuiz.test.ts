/**
 * usePausedQuiz Hook Tests
 *
 * Unit tests for the paused quiz query hook.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 4.4
 */

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

// Mock AuthProvider
jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}))

import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePausedQuiz, useAllPausedQuizzes } from './usePausedQuiz'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import type { PausedQuiz, PausedQuizState } from '../types/paused-quiz'

const mockFrom = supabase.from as jest.Mock
const mockUseAuth = useAuth as jest.Mock

// ─── Test data ────────────────────────────────────────────────────────────────

const mockPausedQuizState: PausedQuizState = {
  questions: [
    {
      question_id: 'q1',
      exercise_type: 'vocabulary',
      question_text: 'What does this mean?',
      correct_answer: 'hello',
      explanation: 'It means hello.',
      source_citation: 'Book 1, Ch 1',
      character: '你好',
      options: ['hello', 'goodbye', 'thank you', 'sorry'],
    },
  ],
  currentQuestionIndex: 0,
  answers: {},
  startedAt: '2026-03-09T10:00:00.000Z',
  timeElapsed: 0,
  exerciseType: 'vocabulary',
  chapterId: 101,
  bookId: 1,
}

const mockPausedQuiz: PausedQuiz = {
  id: 'pq-uuid-1',
  user_id: 'test-user-id',
  chapter_id: 101,
  exercise_type: 'vocabulary',
  quiz_state: mockPausedQuizState,
  paused_at: '2026-03-09T10:05:00.000Z',
  expires_at: '2026-03-16T10:05:00.000Z',
  created_at: '2026-03-09T10:05:00.000Z',
  updated_at: '2026-03-09T10:05:00.000Z',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function setupMaybeSingleMock(data: unknown, error: unknown = null) {
  const maybeSingleMock = jest.fn().mockResolvedValue({ data, error })
  const eqMock3 = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
  const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
  const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
  const selectMock = jest.fn().mockReturnValue({ eq: eqMock1 })
  mockFrom.mockReturnValue({ select: selectMock })
  return maybeSingleMock
}

function setupSelectAllMock(data: unknown[], error: unknown = null) {
  const orderMock = jest.fn().mockResolvedValue({ data, error })
  const eqMock = jest.fn().mockReturnValue({ order: orderMock })
  const selectMock = jest.fn().mockReturnValue({ eq: eqMock })
  mockFrom.mockReturnValue({ select: selectMock })
  return orderMock
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePausedQuiz — Story 4.10b (Task 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: 'test-user-id' } })
  })

  describe('usePausedQuiz(chapterId, exerciseType) (Task 4.2)', () => {
    it('returns paused quiz when one exists', async () => {
      setupMaybeSingleMock(mockPausedQuiz)
      const { result } = renderHook(
        () => usePausedQuiz(101, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockPausedQuiz)
    })

    it('returns null when no paused quiz exists (no rows case)', async () => {
      setupMaybeSingleMock(null)
      const { result } = renderHook(
        () => usePausedQuiz(101, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeNull()
    })

    it('returns null when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null })
      const { result } = renderHook(
        () => usePausedQuiz(101, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      // Query is disabled when user is null — data stays undefined
      expect(result.current.data).toBeUndefined()
      expect(result.current.fetchStatus).toBe('idle')
    })

    it('is disabled when chapterId is 0', async () => {
      const { result } = renderHook(
        () => usePausedQuiz(0, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      expect(result.current.fetchStatus).toBe('idle')
    })

    it('is disabled when exerciseType is empty string', async () => {
      const { result } = renderHook(
        () => usePausedQuiz(101, ''),
        { wrapper: createWrapper() }
      )

      expect(result.current.fetchStatus).toBe('idle')
    })

    it('handles 42P01 table not found error gracefully', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      })
      const eqMock3 = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
      const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock1 })
      mockFrom.mockReturnValue({ select: selectMock })

      const { result } = renderHook(
        () => usePausedQuiz(101, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeNull()
    })
  })

  describe('useAllPausedQuizzes()', () => {
    it('returns all paused quizzes for the user', async () => {
      setupSelectAllMock([mockPausedQuiz])
      const { result } = renderHook(
        () => useAllPausedQuizzes(),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]).toEqual(mockPausedQuiz)
    })

    it('returns empty array when no paused quizzes exist', async () => {
      setupSelectAllMock([])
      const { result } = renderHook(
        () => useAllPausedQuizzes(),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('returns empty array when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null })
      const { result } = renderHook(
        () => useAllPausedQuizzes(),
        { wrapper: createWrapper() }
      )

      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  // ─── Edge case: multiple paused quizzes ordering ──────────────────────────

  describe('edge case: multiple paused quizzes ordering', () => {
    /**
     * Positive test — verifies that useAllPausedQuizzes returns quizzes in
     * descending order by paused_at (most recent first), matching the Supabase
     * .order('paused_at', { ascending: false }) call.
     * Objective: dashboard continue card must show the MOST RECENT paused quiz.
     */
    it('returns multiple paused quizzes ordered most-recent-first', async () => {
      // Arrange: two paused quizzes — newer one first (as Supabase would return)
      const olderPausedQuiz: PausedQuiz = {
        ...mockPausedQuiz,
        id: 'pq-uuid-2',
        chapter_id: 102,
        exercise_type: 'grammar',
        paused_at: '2026-03-08T08:00:00.000Z', // older
      }
      const newerPausedQuiz: PausedQuiz = {
        ...mockPausedQuiz,
        id: 'pq-uuid-1',
        chapter_id: 101,
        exercise_type: 'vocabulary',
        paused_at: '2026-03-09T10:05:00.000Z', // newer
      }
      // Supabase returns them ordered by paused_at DESC (newer first)
      setupSelectAllMock([newerPausedQuiz, olderPausedQuiz])

      const { result } = renderHook(
        () => useAllPausedQuizzes(),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Assert: two quizzes returned, most recent first
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].id).toBe('pq-uuid-1') // newer
      expect(result.current.data?.[1].id).toBe('pq-uuid-2') // older
    })
  })

  // ─── Edge case: non-42P01 error propagation ───────────────────────────────

  describe('edge case: non-42P01 error propagation', () => {
    /**
     * Negative test — verifies that usePausedQuiz re-throws unknown Supabase
     * errors (not the 42P01 "table not found" code) so TanStack Query can
     * handle them (retry, error state, etc.).
     * Objective: only 42P01 is swallowed; all other errors must propagate.
     */
    it('throws for non-42P01 Supabase errors in usePausedQuiz', async () => {
      // Arrange: simulate a permission denied error (not 42P01)
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for table paused_quizzes' },
      })
      const eqMock3 = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
      const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock1 })
      mockFrom.mockReturnValue({ select: selectMock })

      const { result } = renderHook(
        () => usePausedQuiz(101, 'vocabulary'),
        { wrapper: createWrapper() }
      )

      // Act: wait for the query to settle into error state
      await waitFor(() => expect(result.current.isError).toBe(true))

      // Assert: query is in error state (error was re-thrown, not swallowed)
      expect(result.current.isError).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    /**
     * Negative test — verifies that useAllPausedQuizzes re-throws unknown
     * Supabase errors (not 42P01) so TanStack Query can handle them.
     * Objective: only 42P01 is swallowed; all other errors must propagate.
     */
    it('throws for non-42P01 Supabase errors in useAllPausedQuizzes', async () => {
      // Arrange: simulate a connection error (not 42P01)
      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'connection refused' },
      })
      const eqMock = jest.fn().mockReturnValue({ order: orderMock })
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock })
      mockFrom.mockReturnValue({ select: selectMock })

      const { result } = renderHook(
        () => useAllPausedQuizzes(),
        { wrapper: createWrapper() }
      )

      // Act: wait for the query to settle into error state
      await waitFor(() => expect(result.current.isError).toBe(true))

      // Assert: query is in error state (error was re-thrown, not swallowed)
      expect(result.current.isError).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
  })
})
