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

/**
 * Result of answer validation (local or LLM).
 *
 * Reading guide for callers (Stories 4.9, 4.10):
 * - Exact local match:       isCorrect=true,  isAlternative=false, usedLlm=false
 * - LLM-confirmed correct:   isCorrect=true,  isAlternative=true,  usedLlm=true
 * - LLM-confirmed incorrect: isCorrect=false, isAlternative=false, usedLlm=true
 * - LLM timeout/error:       isCorrect=false, isAlternative=false, usedLlm=false
 *
 * `isAlternative` is ONLY true when: the user's answer differed from the key
 * AND the LLM confirmed it was still correct. It is never true for local matches.
 */
export interface ValidationResult {
  /** Whether the answer is considered correct (by local match or LLM). */
  isCorrect: boolean
  /**
   * Whether correctness came via LLM as a valid alternative ordering/phrasing.
   * False for exact local matches. True only when usedLlm=true AND isCorrect=true.
   */
  isAlternative: boolean
  /** Explanation for the answer (pre-generated from quiz payload or from LLM). */
  explanation: string
  /** Other valid answers returned by LLM (populated only when isAlternative=true). */
  alternatives?: string[]
  /**
   * Whether the LLM validation endpoint was called.
   * Useful for Stories 4.9/4.10 to distinguish scoring sources.
   */
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize an answer for local comparison:
 * - Trim surrounding whitespace
 * - Collapse all internal whitespace (handles Chinese sentences where tiles
 *   may be joined with or without spaces, and Latin text with extra spaces)
 *
 * Callers do NOT need to pre-normalize before calling `validate()`.
 */
function normalizeForComparison(answer: string): string {
  return answer.trim().replace(/\s+/g, '')
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for hybrid answer validation.
 *
 * 1. Checks locally against answer key (normalized: trimmed + whitespace-collapsed)
 * 2. If no match → calls LLM validation endpoint (3s timeout)
 * 3. If LLM times out or errors → falls back to local (incorrect)
 *
 * Callers do NOT need to pre-normalize answers — the hook handles it.
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
    // Step 1: Local exact match (case-sensitive, whitespace-normalized).
    // Normalization strips surrounding and internal whitespace so callers do not
    // need to pre-process answers. This ensures consistent behaviour across
    // exercise types (sentence_construction, dialogue_completion, etc.).
    const localMatch =
      normalizeForComparison(params.userAnswer) === normalizeForComparison(params.correctAnswer)

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
        // isAlternative=true only when LLM confirmed a valid non-key answer (H3 fix).
        // When LLM says incorrect, isAlternative must be false.
        isAlternative: llmResult.is_correct,
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
