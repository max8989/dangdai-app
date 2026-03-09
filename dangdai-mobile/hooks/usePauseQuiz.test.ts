/**
 * usePauseQuiz Hook Tests
 *
 * Unit tests for the pause/resume/delete mutations.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 3.6
 */

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn(),
  },
}))

// Mock AuthProvider
jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' },
  }),
}))

import { renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePauseQuiz } from './usePauseQuiz'
import { supabase } from '../lib/supabase'
import type { PausedQuizState } from '../types/paused-quiz'

const mockFrom = supabase.from as jest.Mock
const mockGetUser = supabase.auth.getUser as jest.Mock

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

function setupUpsertMock(error: unknown = null) {
  const upsertMock = jest.fn().mockResolvedValue({ error })
  mockFrom.mockReturnValue({ upsert: upsertMock })
  return upsertMock
}

function setupDeleteMock(error: unknown = null) {
  const eqMock3 = jest.fn().mockResolvedValue({ error })
  const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
  const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
  const deleteMock = jest.fn().mockReturnValue({ eq: eqMock1 })
  mockFrom.mockReturnValue({ delete: deleteMock })
  return deleteMock
}

function setupSelectMock(data: unknown, error: unknown = null) {
  const maybeSingleMock = jest.fn().mockResolvedValue({ data, error })
  const eqMock3 = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
  const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
  const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
  const selectMock = jest.fn().mockReturnValue({ eq: eqMock1 })
  mockFrom.mockReturnValue({ select: selectMock })
  return selectMock
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePauseQuiz — Story 4.10b (Task 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
  })

  describe('pauseQuiz mutation (Task 3.2)', () => {
    it('calls supabase.from("paused_quizzes").upsert() with correct params', async () => {
      const upsertMock = setupUpsertMock()
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.pauseQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
          quizState: mockPausedQuizState,
        })
      })

      expect(mockFrom).toHaveBeenCalledWith('paused_quizzes')
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          chapter_id: 101,
          exercise_type: 'vocabulary',
          quiz_state: mockPausedQuizState,
        }),
        { onConflict: 'user_id,chapter_id,exercise_type' }
      )
    })

    it('throws when supabase returns an error', async () => {
      setupUpsertMock({ message: 'Database error' })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await expect(
          result.current.pauseQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
            quizState: mockPausedQuizState,
          })
        ).rejects.toThrow('Failed to pause quiz')
      })
    })

    it('throws when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await expect(
          result.current.pauseQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
            quizState: mockPausedQuizState,
          })
        ).rejects.toThrow('No authenticated user')
      })
    })
  })

  describe('resumeQuiz mutation (Task 3.3)', () => {
    it('fetches paused quiz state from supabase', async () => {
      setupSelectMock({ quiz_state: mockPausedQuizState })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      let resumedState: PausedQuizState | null = null
      await act(async () => {
        resumedState = await result.current.resumeQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
      })

      expect(mockFrom).toHaveBeenCalledWith('paused_quizzes')
      expect(resumedState).toEqual(mockPausedQuizState)
    })

    it('returns null when no paused quiz exists', async () => {
      setupSelectMock(null)
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      let resumedState: PausedQuizState | null = undefined as unknown as null
      await act(async () => {
        resumedState = await result.current.resumeQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
      })

      expect(resumedState).toBeNull()
    })

    it('returns null when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      let resumedState: PausedQuizState | null = undefined as unknown as null
      await act(async () => {
        resumedState = await result.current.resumeQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
      })

      expect(resumedState).toBeNull()
    })
  })

  describe('deletePausedQuiz mutation (Task 3.4)', () => {
    it('calls supabase.from("paused_quizzes").delete() with correct params', async () => {
      const deleteMock = setupDeleteMock()
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.deletePausedQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
      })

      expect(mockFrom).toHaveBeenCalledWith('paused_quizzes')
      expect(deleteMock).toHaveBeenCalled()
    })

    it('does not throw when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await expect(
          result.current.deletePausedQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
          })
        ).resolves.not.toThrow()
      })
    })

    it('throws when supabase returns an error', async () => {
      setupDeleteMock({ message: 'Delete failed' })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      await act(async () => {
        await expect(
          result.current.deletePausedQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
          })
        ).rejects.toThrow('Failed to delete paused quiz')
      })
    })
  })

  // ─── Edge case: offline / network error ───────────────────────────────────

  describe('edge case: offline pause attempt (network error)', () => {
    /**
     * Negative test — verifies that a network-level failure during pauseQuiz
     * (e.g., device is offline) surfaces as a thrown error with a meaningful message.
     * Objective: pauseQuiz must not silently swallow network errors.
     */
    it('throws with "Failed to pause quiz" when upsert rejects with a network error', async () => {
      // Arrange: simulate a network error (Promise rejection, not a Supabase error object)
      const upsertMock = jest.fn().mockRejectedValue(new Error('Network request failed'))
      mockFrom.mockReturnValue({ upsert: upsertMock })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      // Act + Assert: pauseQuiz should propagate the network error
      await act(async () => {
        await expect(
          result.current.pauseQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
            quizState: mockPausedQuizState,
          })
        ).rejects.toThrow('Network request failed')
      })
    })

    /**
     * Negative test — verifies that a network-level failure during deletePausedQuiz
     * (e.g., device is offline) surfaces as a thrown error.
     * Objective: deletePausedQuiz must not silently swallow network errors.
     */
    it('throws when deletePausedQuiz rejects with a network error', async () => {
      // Arrange: simulate a network error on delete
      const eqMock3 = jest.fn().mockRejectedValue(new Error('Network request failed'))
      const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
      const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock1 })
      mockFrom.mockReturnValue({ delete: deleteMock })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      // Act + Assert: deletePausedQuiz should propagate the network error
      await act(async () => {
        await expect(
          result.current.deletePausedQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
          })
        ).rejects.toThrow('Network request failed')
      })
    })
  })

  // ─── Edge case: corrupted quiz state recovery ─────────────────────────────

  describe('edge case: corrupted quiz state recovery', () => {
    /**
     * Negative test — verifies that resumeQuiz handles a null quiz_state in the
     * database row gracefully (returns null instead of crashing).
     * Objective: corrupted/missing quiz_state must not crash the resume flow.
     */
    it('returns null when database row has null quiz_state (corrupted data)', async () => {
      // Arrange: database returns a row but quiz_state is null (corrupted)
      setupSelectMock({ quiz_state: null })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      let resumedState: PausedQuizState | null = undefined as unknown as null

      // Act: attempt to resume with corrupted state
      await act(async () => {
        resumedState = await result.current.resumeQuiz({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
      })

      // Assert: returns null rather than crashing (null quiz_state → null return)
      expect(resumedState).toBeNull()
    })

    /**
     * Negative test — verifies that resumeQuiz propagates a Supabase error
     * (non-null error object) as a thrown error, not a silent null return.
     * Objective: real DB errors during resume must surface to the caller.
     */
    it('throws when resumeQuiz encounters a non-null Supabase error', async () => {
      // Arrange: simulate a real Supabase error (not 42P01)
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'unique constraint violation' },
      })
      const eqMock3 = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqMock2 = jest.fn().mockReturnValue({ eq: eqMock3 })
      const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 })
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock1 })
      mockFrom.mockReturnValue({ select: selectMock })
      const { result } = renderHook(() => usePauseQuiz(), { wrapper: createWrapper() })

      // Act + Assert: resumeQuiz should throw with the Supabase error message
      await act(async () => {
        await expect(
          result.current.resumeQuiz({
            chapterId: 101,
            exerciseType: 'vocabulary',
          })
        ).rejects.toThrow('Failed to resume quiz')
      })
    })
  })
})
