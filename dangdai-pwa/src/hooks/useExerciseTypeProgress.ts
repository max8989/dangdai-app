/**
 * useExerciseTypeProgress Hook
 *
 * Reads and updates exercise_type_progress. Returns all rows for a chapter.
 * Mutation upserts on quiz completion, computing best_score, attempts_count, and
 * mastered_at preserving on first reach of 80%.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { queryKeys } from '@/lib/queryKeys'
import type { Tables } from '@/types/supabase'
import type { ExerciseType } from '@/types/quiz'

export type ExerciseTypeProgressRow = Tables<'exercise_type_progress'>

export interface UpdateExerciseTypeProgressParams {
  chapterId: number
  bookId: number
  exerciseType: ExerciseType
  score: number
}

export function useExerciseTypeProgress(chapterId: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.exerciseTypeProgress(chapterId),
    queryFn: async (): Promise<ExerciseTypeProgressRow[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('exercise_type_progress')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)

      if (error) {
        if (error.code === '42P01') {
          console.warn('exercise_type_progress table not found. Returning empty progress.')
          return []
        }
        throw error
      }

      return data ?? []
    },
    enabled: !!user && chapterId > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpdateExerciseTypeProgress() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      chapterId,
      exerciseType,
      score,
    }: UpdateExerciseTypeProgressParams): Promise<void> => {
      if (!user) return

      const { data: existing } = await supabase
        .from('exercise_type_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .eq('exercise_type', exerciseType)
        .maybeSingle()

      const bestScore = existing ? Math.max(existing.best_score, score) : score
      const attemptsCount = existing ? existing.attempts_count + 1 : 1

      let masteredAt: string | null = null
      if (bestScore >= 80) {
        masteredAt = existing?.mastered_at ?? new Date().toISOString()
      }

      const { error } = await supabase
        .from('exercise_type_progress')
        .upsert(
          {
            user_id: user.id,
            chapter_id: chapterId,
            exercise_type: exerciseType,
            best_score: bestScore,
            attempts_count: attemptsCount,
            mastered_at: masteredAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,chapter_id,exercise_type' },
        )

      if (error) {
        if (error.code === '42P01') {
          console.warn('exercise_type_progress table not found during upsert. Skipping.')
          return
        }
        throw error
      }
    },

    onSuccess: (_, { chapterId, bookId }) => {
      if (!user) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.exerciseTypeProgress(chapterId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chapterProgress(user.id, bookId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userProgress(user.id),
      })
    },
  })
}
