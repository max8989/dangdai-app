/**
 * usePremadeExercises Hook
 *
 * Fetches premade workbook exercises (metadata only) from Supabase.
 * Gracefully handles missing table (42P01) by returning [].
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'

export interface PremadeExercise {
  id: string
  exercise_type: string
  exercise_order: number
  title: string | null
  instructions: string | null
  difficulty: string | null
}

export function usePremadeExercises(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.premadeExercises(bookId, lessonId),
    queryFn: async (): Promise<PremadeExercise[]> => {
      const { data, error } = await supabase
        .from('premade_exercises')
        .select('id, exercise_type, exercise_order, title, instructions, difficulty')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('exercise_order', { ascending: true })

      if (error) {
        if (error.code === '42P01') {
          console.warn('premade_exercises table not found. Hiding premade section.')
          return []
        }
        throw error
      }

      return data ?? []
    },
    enabled: !!bookId && !!lessonId,
    staleTime: 1000 * 60 * 30,
  })
}
