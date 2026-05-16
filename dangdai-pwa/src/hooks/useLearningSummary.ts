import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, LearningSummaryError } from '@/lib/api'
import type { LearningSummaryPayload } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

export interface CachedLearningSummary {
  summary: LearningSummaryPayload
  exercisesAnalyzed: number
  model: string
  generatedAt: string
}

/**
 * Read the persisted learning summary for the authenticated user.
 *
 * Returns `null` when no summary has been generated yet (so the UI can render
 * an empty-state CTA instead of a card).
 */
export function useLearningSummary() {
  const { user } = useAuth()

  return useQuery<CachedLearningSummary | null>({
    queryKey: user ? queryKeys.learningSummary(user.id) : ['learningSummary', 'anon'],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('learning_summaries')
        .select('summary, exercises_analyzed, model, generated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01') {
          console.warn('learning_summaries table not found. Returning null.')
          return null
        }
        throw error
      }
      if (!data) return null

      return {
        summary: data.summary as unknown as LearningSummaryPayload,
        exercisesAnalyzed: data.exercises_analyzed,
        model: data.model,
        generatedAt: data.generated_at,
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Trigger backend regeneration of the learning summary, then invalidate the
 * cached query so the UI refetches the persisted row.
 */
export function useGenerateLearningSummary() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<CachedLearningSummary> => {
      const response = await api.generateLearningSummary()
      return {
        summary: response.summary,
        exercisesAnalyzed: response.exercises_analyzed,
        model: response.model,
        generatedAt: response.generated_at,
      }
    },
    onSuccess: (data) => {
      if (!user) return
      queryClient.setQueryData(queryKeys.learningSummary(user.id), data)
    },
    onError: (error) => {
      const message =
        error instanceof LearningSummaryError
          ? error.message
          : "Couldn't generate your summary. Please try again."
      toast.error(message)
    },
  })
}
