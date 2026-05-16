/**
 * useAnswerValidation Hook
 *
 * Local-only answer validation for all exercise types including free-text types
 * (Dialogue Completion, Sentence Construction) that support multiple valid answers.
 *
 * Story 4.17: Validation is entirely local — no LLM call. Runtime matches user
 * answers against stored correct_answer and acceptable_answer_variants[] using
 * case-insensitive, punctuation-normalized comparison.
 */

export interface ValidationResult {
  isCorrect: boolean
  isAlternative: boolean
  explanation: string
  alternatives?: string[]
  usedLlm: boolean
}

export interface ValidateParams {
  userAnswer: string
  correctAnswer: string
  questionText: string
  exerciseType: string
  preGeneratedExplanation: string
  acceptableAnswerVariants?: string[]
}

function normalizeForComparison(answer: string): string {
  return answer
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/[。，！？、；：.!?,;:]/g, '')
}

export function useAnswerValidation() {
  function validate(params: ValidateParams): ValidationResult {
    const normalized = normalizeForComparison(params.userAnswer)
    const normalizedCorrect = normalizeForComparison(params.correctAnswer)

    if (normalized === normalizedCorrect) {
      return {
        isCorrect: true,
        isAlternative: false,
        explanation: params.preGeneratedExplanation,
        usedLlm: false,
      }
    }

    const variants = params.acceptableAnswerVariants ?? []
    for (const variant of variants) {
      if (normalizeForComparison(variant) === normalized) {
        return {
          isCorrect: true,
          isAlternative: true,
          explanation: params.preGeneratedExplanation,
          alternatives: variants.filter(
            (v) => normalizeForComparison(v) !== normalized,
          ),
          usedLlm: false,
        }
      }
    }

    return {
      isCorrect: false,
      isAlternative: false,
      explanation: params.preGeneratedExplanation,
      usedLlm: false,
    }
  }

  return {
    validate,
    isValidating: false,
  }
}
