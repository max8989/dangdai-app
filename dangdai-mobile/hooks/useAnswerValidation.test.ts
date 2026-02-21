/**
 * useAnswerValidation Hook Tests
 *
 * Tests for hybrid answer validation logic:
 * - Local exact match → instant correct, no LLM call
 * - Non-match → LLM call → returns LLM result
 * - LLM timeout → fallback to local (incorrect)
 * - LLM network error → fallback to local (incorrect)
 *
 * Story 4.6: Dialogue Completion Exercise
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAnswerValidation } from './useAnswerValidation'
import { api } from '../lib/api'
import { QuizGenerationError } from '../types/quiz'
import type { AnswerValidationResponse } from '../types/quiz'

// Mock the api module
jest.mock('../lib/api', () => ({
  api: {
    baseUrl: 'http://localhost:8000',
    generateQuiz: jest.fn(),
    validateAnswer: jest.fn(),
  },
}))

const mockValidateAnswer = api.validateAnswer as jest.MockedFunction<typeof api.validateAnswer>

const BASE_PARAMS = {
  userAnswer: '咖啡',
  correctAnswer: '咖啡',
  questionText: 'Complete the conversation by selecting the best response.',
  exerciseType: 'dialogue_completion' as const,
  preGeneratedExplanation: 'The question asks what you want to drink. 咖啡 (coffee) is the appropriate response.',
}

const mockLlmCorrectResponse: AnswerValidationResponse = {
  is_correct: true,
  explanation: '茶 (tea) is also a valid drink to order in this context.',
  alternatives: ['咖啡', '水', '茶'],
}

const mockLlmIncorrectResponse: AnswerValidationResponse = {
  is_correct: false,
  explanation: '你好 means "hello" and is not an appropriate response to what you want to drink.',
  alternatives: [],
}

/** Create a wrapper with a fresh QueryClient for each test */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useAnswerValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('local exact match', () => {
    it('returns instant correct result when answer exactly matches correct answer', async () => {
      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate(BASE_PARAMS)
      })

      expect(validationResult).toEqual({
        isCorrect: true,
        isAlternative: false,
        explanation: BASE_PARAMS.preGeneratedExplanation,
        usedLlm: false,
      })
    })

    it('does NOT call LLM when local match succeeds', async () => {
      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.validate(BASE_PARAMS)
      })

      expect(mockValidateAnswer).not.toHaveBeenCalled()
    })

    it('trims whitespace when comparing answers', async () => {
      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '  咖啡  ',
          correctAnswer: '咖啡',
        })
      })

      expect(validationResult?.isCorrect).toBe(true)
      expect(mockValidateAnswer).not.toHaveBeenCalled()
    })
  })

  describe('LLM validation path', () => {
    it('calls LLM when answer does not match correct answer', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmCorrectResponse)

      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '茶',
          correctAnswer: '咖啡',
        })
      })

      expect(mockValidateAnswer).toHaveBeenCalledWith({
        question: BASE_PARAMS.questionText,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        exerciseType: BASE_PARAMS.exerciseType,
      })
    })

    it('returns isAlternative=true when LLM confirms a correct alternative', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmCorrectResponse)

      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '茶',
          correctAnswer: '咖啡',
        })
      })

      expect(validationResult).toEqual({
        isCorrect: true,
        isAlternative: true,
        explanation: mockLlmCorrectResponse.explanation,
        alternatives: mockLlmCorrectResponse.alternatives,
        usedLlm: true,
      })
    })

    it('returns isCorrect=false when LLM confirms incorrect answer', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmIncorrectResponse)

      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '你好',
          correctAnswer: '咖啡',
        })
      })

      expect(validationResult?.isCorrect).toBe(false)
      expect(validationResult?.isAlternative).toBe(false)
      expect(validationResult?.usedLlm).toBe(true)
      expect(validationResult?.explanation).toBe(mockLlmIncorrectResponse.explanation)
    })
  })

  describe('LLM timeout fallback', () => {
    it('falls back to local (incorrect) when LLM times out', async () => {
      const timeoutError = new QuizGenerationError('timeout', 'Validation timed out.')
      mockValidateAnswer.mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '茶',
          correctAnswer: '咖啡',
        })
      })

      expect(validationResult).toEqual({
        isCorrect: false,
        isAlternative: false,
        explanation: BASE_PARAMS.preGeneratedExplanation,
        usedLlm: false,
      })
    })

    it('falls back to local (incorrect) when LLM network fails', async () => {
      const networkError = new QuizGenerationError('network', 'Validation request failed.')
      mockValidateAnswer.mockRejectedValue(networkError)

      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })

      let validationResult: Awaited<ReturnType<typeof result.current.validate>> | undefined
      await act(async () => {
        validationResult = await result.current.validate({
          ...BASE_PARAMS,
          userAnswer: '茶',
          correctAnswer: '咖啡',
        })
      })

      expect(validationResult?.isCorrect).toBe(false)
      expect(validationResult?.isAlternative).toBe(false)
      expect(validationResult?.usedLlm).toBe(false)
    })
  })

  describe('isValidating state', () => {
    it('starts as false (not validating)', () => {
      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })
      expect(result.current.isValidating).toBe(false)
    })

    it('returns validate function', () => {
      const { result } = renderHook(() => useAnswerValidation(), { wrapper: createWrapper() })
      expect(typeof result.current.validate).toBe('function')
    })
  })
})
