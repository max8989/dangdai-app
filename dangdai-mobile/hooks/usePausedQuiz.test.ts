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
})
