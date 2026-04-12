import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

export interface UserStats {
  totalQuizzesCompleted: number
  totalQuestionsAnswered: number
  masteredExercises: number
  averageScore: number
}

export function useUserStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user) return { totalQuizzesCompleted: 0, totalQuestionsAnswered: 0, masteredExercises: 0, averageScore: 0 }

      const [attemptsRes, questionsRes, masteredRes] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('score', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('question_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('exercise_type_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('mastered_at', 'is', null),
      ])

      const attempts = attemptsRes.data ?? []
      const totalQuizzesCompleted = attemptsRes.count ?? attempts.length
      const totalQuestionsAnswered = questionsRes.count ?? 0
      const masteredExercises = masteredRes.count ?? 0
      const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0

      return { totalQuizzesCompleted, totalQuestionsAnswered, masteredExercises, averageScore }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })
}
