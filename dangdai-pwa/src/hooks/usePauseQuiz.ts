/**
 * usePauseQuiz Hook
 *
 * Mutation hooks for pausing, resuming, and deleting paused quizzes.
 * Interacts with the Supabase `paused_quizzes` table.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { PausedQuizState } from '@/types/paused-quiz'
import type { Json } from '@/types/supabase'

export interface PauseQuizParams {
  chapterId: number
  exerciseType: string
  quizState: PausedQuizState
}

export interface ResumeQuizParams {
  chapterId: number
  exerciseType: string
}

export interface DeletePausedQuizParams {
  chapterId: number
  exerciseType: string
}

export function usePauseQuiz() {
  const queryClient = useQueryClient()

  const pauseQuizMutation = useMutation({
    mutationFn: async ({ chapterId, exerciseType, quizState }: PauseQuizParams): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        throw new Error('No authenticated user — cannot pause quiz')
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('paused_quizzes')
        .upsert(
          {
            user_id: user.id,
            chapter_id: chapterId,
            exercise_type: exerciseType,
            quiz_state: quizState as unknown as Json,
            paused_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: 'user_id,chapter_id,exercise_type' },
        )

      if (error) {
        throw new Error(`Failed to pause quiz: ${error.message}`)
      }
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pausedQuizzes'] })
    },
  })

  const resumeQuizMutation = useMutation({
    mutationFn: async ({
      chapterId,
      exerciseType,
    }: ResumeQuizParams): Promise<PausedQuizState | null> => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) return null

      const { data, error } = await supabase
        .from('paused_quizzes')
        .select('quiz_state')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .eq('exercise_type', exerciseType)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to resume quiz: ${error.message}`)
      }

      if (!data) return null

      return data.quiz_state as unknown as PausedQuizState
    },
  })

  const deletePausedQuizMutation = useMutation({
    mutationFn: async ({
      chapterId,
      exerciseType,
    }: DeletePausedQuizParams): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) return

      const { error } = await supabase
        .from('paused_quizzes')
        .delete()
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .eq('exercise_type', exerciseType)

      if (error) {
        throw new Error(`Failed to delete paused quiz: ${error.message}`)
      }
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pausedQuizzes'] })
    },
  })

  return {
    pauseQuiz: pauseQuizMutation.mutateAsync,
    pauseQuizMutation,
    resumeQuiz: resumeQuizMutation.mutateAsync,
    resumeQuizMutation,
    deletePausedQuiz: deletePausedQuizMutation.mutateAsync,
    deletePausedQuizMutation,
  }
}
