/**
 * usePremadeExercise Hook
 *
 * Fetches a single premade exercise with its full content JSONB.
 * Used by the premade quiz screen when the user opens an exercise.
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'

export interface PremadeExerciseWithContent {
  id: string
  exercise_type: string
  exercise_order: number
  title: string | null
  instructions: string | null
  difficulty: string | null
  content: Record<string, unknown>
  book_id: number
  lesson_id: number
}

export function usePremadeExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: queryKeys.premadeExercise(exerciseId ?? ''),
    queryFn: async (): Promise<PremadeExerciseWithContent | null> => {
      if (!exerciseId) return null

      const { data, error } = await supabase
        .from('premade_exercises')
        .select(
          'id, exercise_type, exercise_order, title, instructions, difficulty, content, book_id, lesson_id',
        )
        .eq('id', exerciseId)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01') {
          console.warn('[usePremadeExercise] premade_exercises table not found.')
          return null
        }
        throw error
      }

      if (!data) return null

      return {
        ...data,
        content: data.content as unknown as Record<string, unknown>,
      }
    },
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 30,
  })
}
