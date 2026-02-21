/**
 * useAnswerValidation Hook
 *
 * Hybrid answer validation for exercise types that support LLM-backed
 * "correct alternative" recognition (Dialogue Completion, Sentence Construction).
 *
 * Validation flow:
 * 1. Local exact match check (instant, no network)
 * 2. If no match → LLM validation via POST /api/quizzes/validate-answer (3s timeout)
 * 3. On timeout/error → fall back to local (mark as incorrect)
 *
 * Story 4.6: Dialogue Completion Exercise
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ExerciseType, AnswerValidationResponse } from '../types/quiz'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Result of answer validation (local or LLM). */
export interface ValidationResult {
  isCorrect: boolean
  /** Whether the answer was validated by LLM as a correct alternative */
  isAlternative: boolean
  /** Explanation for the answer (from quiz payload or LLM) */
  explanation: string
  /** Alternative valid answers (from LLM only) */
  alternatives?: string[]
  /** Whether LLM was used (vs local-only) */
  usedLlm: boolean
}

export interface ValidateParams {
  userAnswer: string
  correctAnswer: string
  questionText: string
  exerciseType: ExerciseType
  /** Pre-generated explanation from quiz payload (used for local validation feedback) */
  preGeneratedExplanation: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for hybrid answer validation.
 *
 * 1. Checks locally against answer key (exact match, trimmed)
 * 2. If no match → calls LLM validation endpoint (3s timeout)
 * 3. If LLM times out or errors → falls back to local (incorrect)
 *
 * Usage:
 * ```tsx
 * const { validate, isValidating } = useAnswerValidation()
 * const result = await validate({ userAnswer, correctAnswer, questionText, exerciseType, preGeneratedExplanation })
 * ```
 */
export function useAnswerValidation() {
  // Local state tracks the LLM validation in-flight status synchronously.
  // This avoids the one render-cycle gap between calling mutateAsync() and
  // llmMutation.isPending transitioning to true (which happens asynchronously
  // after React re-renders). The local flag is set before the async call so
  // the spinner appears on the same render as the blank bubble fill.
  const [isValidating, setIsValidating] = useState(false)

  const llmMutation = useMutation<
    AnswerValidationResponse,
    Error,
    { question: string; userAnswer: string; correctAnswer: string; exerciseType: string }
  >({
    mutationFn: (params) => api.validateAnswer(params),
    retry: 0, // No auto-retry — timeout fallback handles failure
  })

  async function validate(params: ValidateParams): Promise<ValidationResult> {
    // Step 1: Local exact match (case-sensitive, trimmed — Chinese text is case-sensitive)
    const localMatch = params.userAnswer.trim() === params.correctAnswer.trim()

    if (localMatch) {
      return {
        isCorrect: true,
        isAlternative: false,
        explanation: params.preGeneratedExplanation,
        usedLlm: false,
      }
    }

    // Step 2: LLM validation (3s timeout handled inside api.validateAnswer)
    // Set isValidating=true synchronously before the async call so the spinner
    // appears on the same render cycle as the blank bubble fill (M1 fix).
    setIsValidating(true)
    try {
      const llmResult = await llmMutation.mutateAsync({
        question: params.questionText,
        userAnswer: params.userAnswer,
        correctAnswer: params.correctAnswer,
        exerciseType: params.exerciseType,
      })

      return {
        isCorrect: llmResult.is_correct,
        isAlternative: llmResult.is_correct, // LLM confirmed it's correct but different from key
        explanation: llmResult.explanation,
        alternatives: llmResult.alternatives,
        usedLlm: true,
      }
    } catch {
      // Step 3: Fallback to local on timeout/network error — mark as incorrect
      return {
        isCorrect: false,
        isAlternative: false,
        explanation: params.preGeneratedExplanation,
        usedLlm: false,
      }
    } finally {
      setIsValidating(false)
    }
  }

  return {
    validate,
    isValidating,
  }
}
