/**
 * Quiz Generation Hook
 *
 * @deprecated Story 4.16 — All exercise types now use pre-generated content from
 * the premade_exercises table. This hook is no longer used in user-facing flows.
 * Retained only for the quiz loading screen (which is no longer navigated to)
 * and potential batch testing use cases.
 */

import { useMutation } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { QuizGenerationError } from '@/types/quiz'
import type { QuizGenerationParams, QuizResponse } from '@/types/quiz'

export function useQuizGeneration() {
  return useMutation<QuizResponse, QuizGenerationError, QuizGenerationParams>({
    mutationFn: (params) => api.generateQuiz(params),
    retry: 0,
  })
}
