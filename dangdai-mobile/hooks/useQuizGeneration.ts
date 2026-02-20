/**
 * Quiz Generation Hook
 *
 * TanStack Query mutation hook for generating quizzes via the backend API.
 * Uses useMutation (not useQuery) because quiz generation is a side-effect
 * triggered by user action, not a cacheable query.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { QuizGenerationParams, QuizResponse } from '../types/quiz'
import { QuizGenerationError } from '../types/quiz'

/**
 * Hook for quiz generation via the backend API.
 *
 * Exposes mutation states: isPending, isError, error, data, mutate, reset.
 *
 * Usage:
 * ```tsx
 * const { mutate, isPending, isError, error, data } = useQuizGeneration();
 * mutate({ chapterId: 212, bookId: 2, exerciseType: 'vocabulary' });
 * ```
 */
export function useQuizGeneration() {
  return useMutation<QuizResponse, QuizGenerationError, QuizGenerationParams>({
    mutationFn: (params) => api.generateQuiz(params),
    retry: 0, // No auto-retry - user decides via Retry button
  })
}
