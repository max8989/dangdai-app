/**
 * usePausedQuiz Hook
 *
 * TanStack Query hook for fetching a paused quiz by chapter ID and exercise type.
 * Returns the paused quiz record or null if none exists.
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import type { PausedQuiz } from '@/types/paused-quiz'

export function usePausedQuiz(chapterId: number, exerciseType: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['pausedQuizzes', chapterId, exerciseType],
    queryFn: async (): Promise<PausedQuiz | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('paused_quizzes')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .eq('exercise_type', exerciseType)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01') {
          console.warn('paused_quizzes table not found. Returning null.')
          return null
        }
        throw error
      }

      if (!data) return null

      return data as unknown as PausedQuiz
    },
    enabled: !!user && chapterId > 0 && !!exerciseType,
    staleTime: 1000 * 30,
  })
}

export function useAllPausedQuizzes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['pausedQuizzes'],
    queryFn: async (): Promise<PausedQuiz[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('paused_quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('paused_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('paused_quizzes table not found. Returning empty array.')
          return []
        }
        throw error
      }

      return (data ?? []) as unknown as PausedQuiz[]
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  })
}
