/**
 * usePremadeExercise Hook
 *
 * TanStack Query hook for fetching a single premade exercise with its full
 * content JSONB from Supabase. This hook is used by the premade exercise screen
 * (app/quiz/premade.tsx) when the user opens an exercise.
 *
 * Key design decisions:
 * - Only fetches full content JSONB when the user opens the exercise (not on list screen)
 * - The list screen (usePremadeExercises) only fetches metadata for performance
 * - content JSONB is cast as unknown as ExerciseContent for type safety
 * - Gracefully handles missing table (42P01) by returning null
 *
 * Story 11.8: Premade Exercise Completion Flow — Task 2
 */

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Full premade exercise data including content JSONB */
export interface PremadeExerciseWithContent {
  id: string
  exercise_type: string
  exercise_order: number
  title: string | null
  instructions: string | null
  difficulty: string | null
  /** Full content JSONB — cast as unknown, then to specific content type in adapter */
  content: Record<string, unknown>
  book_id: number
  lesson_id: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a single premade exercise with its full content JSONB.
 *
 * Returns null when:
 * - The premade_exercises table doesn't exist yet (42P01 graceful degradation)
 * - No exercise exists with the given ID
 *
 * @param exerciseId - The UUID of the premade exercise to fetch
 */
export function usePremadeExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: queryKeys.premadeExercise(exerciseId ?? ''),
    queryFn: async (): Promise<PremadeExerciseWithContent | null> => {
      if (!exerciseId) return null

      const { data, error } = await supabase
        .from('premade_exercises')
        .select('id, exercise_type, exercise_order, title, instructions, difficulty, content, book_id, lesson_id')
        .eq('id', exerciseId)
        .maybeSingle()

      if (error) {
        // Gracefully handle missing table (not yet migrated — Story 1.10 dependency)
        if (error.code === '42P01') {
          console.warn('[usePremadeExercise] premade_exercises table not found.')
          return null
        }
        throw error
      }

      if (!data) return null

      return {
        ...data,
        // Cast content JSONB from Supabase to Record<string, unknown>
        content: data.content as unknown as Record<string, unknown>,
      }
    },
    enabled: !!exerciseId,
    // Static content — 30 minute stale time (same as list hook)
    staleTime: 1000 * 60 * 30,
  })
}
