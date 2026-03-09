/**
 * useQuizGeneration Hook Tests
 *
 * Tests for the quiz generation mutation hook.
 * Mocks the API client to test success, error, and timeout scenarios.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useQuizGeneration } from './useQuizGeneration'
import { api } from '../lib/api'
import { QuizGenerationError } from '../types/quiz'
import type { QuizResponse } from '../types/quiz'

// Mock the api module
jest.mock('../lib/api', () => ({
  api: {
    baseUrl: 'http://localhost:8000',
    generateQuiz: jest.fn(),
  },
}))

const mockGenerateQuiz = api.generateQuiz as jest.MockedFunction<typeof api.generateQuiz>

const mockQuizResponse: QuizResponse = {
  quiz_id: 'test-quiz-id-123',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'vocabulary',
  question_count: 10,
  questions: [
    {
      question_id: 'q1',
      exercise_type: 'vocabulary',
      question_text: 'What does this mean?',
      correct_answer: 'hello',
      explanation: 'Common greeting',
      source_citation: 'Chapter 1',
      options: ['hello', 'goodbye', 'thanks', 'sorry'],
    },
  ],
}

/** Create a wrapper with a fresh QueryClient for each test */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    )
  }
}

describe('useQuizGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('transitions to pending on mutate', async () => {
    // Hold the promise to keep it pending
    let resolvePromise: (value: QuizResponse) => void
    mockGenerateQuiz.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve }),
    )

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Cleanup: resolve the pending promise
    act(() => {
      resolvePromise!(mockQuizResponse)
    })
  })

  it('returns quiz data on success', async () => {
    mockGenerateQuiz.mockResolvedValue(mockQuizResponse)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockQuizResponse)
    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('calls api.generateQuiz with correct params', async () => {
    mockGenerateQuiz.mockResolvedValue(mockQuizResponse)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    const params = {
      chapterId: 315,
      bookId: 3,
      exerciseType: 'grammar',
    }

    act(() => {
      result.current.mutate(params)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGenerateQuiz).toHaveBeenCalledWith(params)
  })

  it('returns error on server failure', async () => {
    const serverError = new QuizGenerationError(
      'server',
      "Couldn't generate Vocabulary exercise. Try another type or retry.",
    )
    mockGenerateQuiz.mockRejectedValue(serverError)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(QuizGenerationError)
    expect(result.current.error?.type).toBe('server')
    expect(result.current.isPending).toBe(false)
  })

  it('returns timeout error', async () => {
    const timeoutError = new QuizGenerationError(
      'timeout',
      'Generation is taking too long. Please try again.',
    )
    mockGenerateQuiz.mockRejectedValue(timeoutError)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.type).toBe('timeout')
  })

  it('returns not_found error for insufficient content', async () => {
    const notFoundError = new QuizGenerationError(
      'not_found',
      'Not enough content for Matching in this chapter. Try Vocabulary or Grammar instead.',
    )
    mockGenerateQuiz.mockRejectedValue(notFoundError)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'matching',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.type).toBe('not_found')
  })

  it('returns auth error', async () => {
    const authError = new QuizGenerationError(
      'auth',
      'Not authenticated. Please sign in.',
    )
    mockGenerateQuiz.mockRejectedValue(authError)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.type).toBe('auth')
  })

  it('does not retry on failure', async () => {
    const serverError = new QuizGenerationError('server', 'Server error')
    mockGenerateQuiz.mockRejectedValue(serverError)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should only be called once (no retry)
    expect(mockGenerateQuiz).toHaveBeenCalledTimes(1)
  })

  it('can reset after error and retry', async () => {
    const serverError = new QuizGenerationError('server', 'Server error')
    mockGenerateQuiz.mockRejectedValueOnce(serverError)
    mockGenerateQuiz.mockResolvedValueOnce(mockQuizResponse)

    const { result } = renderHook(() => useQuizGeneration(), {
      wrapper: createWrapper(),
    })

    // First attempt - fail
    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Reset and wait for state update
    act(() => {
      result.current.reset()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(false)
    })
    expect(result.current.error).toBeNull()

    // Second attempt - succeed
    act(() => {
      result.current.mutate({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockQuizResponse)
  })
})
