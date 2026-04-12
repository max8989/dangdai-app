/**
 * useAnswerValidation Hook Tests
 *
 * Tests for local-only answer validation logic (Story 4.17):
 * - Exact match against correctAnswer → isCorrect=true, isAlternative=false
 * - Match via acceptableAnswerVariants → isCorrect=true, isAlternative=true
 * - No match → isCorrect=false
 * - Case-insensitive matching
 * - Punctuation-normalized matching (Chinese 。 and others stripped)
 * - Empty variants array → falls through to no match
 * - No variants supplied → falls through to no match
 *
 * Validation is entirely synchronous — no LLM calls, no api.validateAnswer.
 */

import { renderHook } from '@testing-library/react-native'

import { useAnswerValidation } from './useAnswerValidation'

const BASE_PARAMS = {
  userAnswer: '咖啡',
  correctAnswer: '咖啡',
  questionText: 'Complete the conversation by selecting the best response.',
  exerciseType: 'dialogue_completion' as const,
  preGeneratedExplanation: 'The question asks what you want to drink. 咖啡 (coffee) is the appropriate response.',
}

describe('useAnswerValidation', () => {
  describe('exact match', () => {
    it('returns isCorrect=true, isAlternative=false when answer exactly matches correctAnswer', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate(BASE_PARAMS)

      expect(validationResult).toEqual({
        isCorrect: true,
        isAlternative: false,
        explanation: BASE_PARAMS.preGeneratedExplanation,
        usedLlm: false,
      })
    })

    it('always returns usedLlm=false on exact match', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate(BASE_PARAMS)

      expect(validationResult.usedLlm).toBe(false)
    })
  })

  describe('acceptableAnswerVariants match', () => {
    it('returns isCorrect=true, isAlternative=true when answer matches a variant', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: ['茶', '水'],
      })

      expect(validationResult.isCorrect).toBe(true)
      expect(validationResult.isAlternative).toBe(true)
      expect(validationResult.usedLlm).toBe(false)
    })

    it('returns the other variants in alternatives when a variant matches', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: ['茶', '水', '果汁'],
      })

      expect(validationResult.alternatives).toEqual(['水', '果汁'])
    })

    it('uses the preGeneratedExplanation as explanation on variant match', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: ['茶'],
      })

      expect(validationResult.explanation).toBe(BASE_PARAMS.preGeneratedExplanation)
    })
  })

  describe('no match', () => {
    it('returns isCorrect=false when answer does not match correctAnswer or any variant', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '你好',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: ['茶', '水'],
      })

      expect(validationResult.isCorrect).toBe(false)
      expect(validationResult.isAlternative).toBe(false)
      expect(validationResult.usedLlm).toBe(false)
    })

    it('returns isCorrect=false when acceptableAnswerVariants is an empty array', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: [],
      })

      expect(validationResult.isCorrect).toBe(false)
    })

    it('returns isCorrect=false when acceptableAnswerVariants is not supplied', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶',
        correctAnswer: '咖啡',
        // acceptableAnswerVariants intentionally omitted
      })

      expect(validationResult.isCorrect).toBe(false)
    })
  })

  describe('case-insensitive matching', () => {
    it('matches correctAnswer regardless of case', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: 'Hello',
        correctAnswer: 'hello',
      })

      expect(validationResult.isCorrect).toBe(true)
      expect(validationResult.isAlternative).toBe(false)
    })

    it('matches a variant regardless of case', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: 'BYE',
        correctAnswer: 'hello',
        acceptableAnswerVariants: ['bye', 'goodbye'],
      })

      expect(validationResult.isCorrect).toBe(true)
      expect(validationResult.isAlternative).toBe(true)
    })
  })

  describe('punctuation-normalized matching', () => {
    it('matches correctAnswer when Chinese period 。 is present in userAnswer', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '咖啡。',
        correctAnswer: '咖啡',
      })

      expect(validationResult.isCorrect).toBe(true)
      expect(validationResult.isAlternative).toBe(false)
    })

    it('matches correctAnswer when English punctuation is present in userAnswer', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: 'hello,',
        correctAnswer: 'hello',
      })

      expect(validationResult.isCorrect).toBe(true)
    })

    it('matches a variant after stripping punctuation', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '茶！',
        correctAnswer: '咖啡',
        acceptableAnswerVariants: ['茶'],
      })

      expect(validationResult.isCorrect).toBe(true)
      expect(validationResult.isAlternative).toBe(true)
    })

    it('matches correctAnswer after collapsing internal whitespace', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const validationResult = result.current.validate({
        ...BASE_PARAMS,
        userAnswer: '  咖啡  ',
        correctAnswer: '咖啡',
      })

      expect(validationResult.isCorrect).toBe(true)
    })
  })

  describe('hook contract', () => {
    it('exposes a validate function', () => {
      const { result } = renderHook(() => useAnswerValidation())

      expect(typeof result.current.validate).toBe('function')
    })

    it('isValidating is always false (synchronous, no async work)', () => {
      const { result } = renderHook(() => useAnswerValidation())

      expect(result.current.isValidating).toBe(false)

      result.current.validate(BASE_PARAMS)

      expect(result.current.isValidating).toBe(false)
    })

    it('validate returns synchronously (not a Promise)', () => {
      const { result } = renderHook(() => useAnswerValidation())

      const returnValue = result.current.validate(BASE_PARAMS)

      // A Promise has a .then method; a plain object does not
      expect(typeof (returnValue as unknown as Promise<unknown>).then).toBe('undefined')
    })
  })
})
