/**
 * useExerciseTypeProgress Hook
 *
 * TanStack Query hook for reading and updating exercise_type_progress data.
 * Fetches all exercise type progress rows for a given chapter from Supabase.
 * Also exports useUpdateExerciseTypeProgress mutation for upserting progress
 * on quiz completion.
 *
 * Data source: exercise_type_progress table (applied via Story 4.11 migration).
 *
 * Upsert logic:
 *   - best_score = max(existing.best_score, newScore)
 *   - attempts_count = existing.attempts_count + 1
 *   - mastered_at = set on first time best_score >= 80, preserved thereafter
 *   - onConflict: 'user_id,chapter_id,exercise_type' (unique constraint)
 *
 * Cache invalidation on mutation success:
 *   - exerciseTypeProgress(chapterId)
 *   - chapterProgress(userId, bookId)
 *   - userProgress(userId)
 *
 * Story 4.11: Quiz Results Screen — Task 4
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { queryKeys } from '../lib/queryKeys'
import type { Tables } from '../types/supabase'
import type { ExerciseType } from '../types/quiz'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Row type from Supabase exercise_type_progress table */
export type ExerciseTypeProgressRow = Tables<'exercise_type_progress'>

/** Parameters for the updateExerciseTypeProgress mutation */
export interface UpdateExerciseTypeProgressParams {
  /** Chapter ID for this quiz (e.g. 212 for Book 2 Chapter 12) */
  chapterId: number
  /** Book ID — used for chapterProgress cache invalidation */
  bookId: number
  /** Exercise type just completed */
  exerciseType: ExerciseType
  /** Score as a percentage (0–100) */
  score: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all exercise_type_progress rows for a chapter.
 * Returns undefined while loading, or an array of progress rows.
 *
 * Gracefully handles missing table (42P01) by returning an empty array.
 * Query is disabled when the user is not authenticated.
 */
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
        // Gracefully handle missing table (not yet migrated)
        if (error.code === '42P01') {
          console.warn('exercise_type_progress table not found. Returning empty progress.')
          return []
        }
        throw error
      }

      return data ?? []
    },
    // Disable query when user is not authenticated or chapterId is 0/falsy
    // (chapterId=0 is the fallback used in play.tsx when store context is missing)
    enabled: !!user && chapterId > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Mutation for upserting exercise_type_progress on quiz completion.
 *
 * Upsert strategy:
 * 1. Fetch existing record for (user_id, chapter_id, exercise_type)
 * 2. Compute best_score = max(existing, new)
 * 3. Increment attempts_count
 * 4. Set mastered_at if best_score >= 80 (preserve existing value if already set)
 * 5. Upsert with onConflict to handle concurrent writes safely
 *
 * After success, invalidates relevant query keys.
 */
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

      // Fetch existing record (if any) to compute best_score and attempts_count
      const { data: existing } = await supabase
        .from('exercise_type_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .eq('exercise_type', exerciseType)
        .maybeSingle()

      const bestScore = existing ? Math.max(existing.best_score, score) : score
      const attemptsCount = existing ? existing.attempts_count + 1 : 1

      // Set mastered_at when reaching 80%+ for the first time; preserve if already set
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
          { onConflict: 'user_id,chapter_id,exercise_type' }
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
      // Invalidate exercise type progress to trigger refetch of progress bars
      void queryClient.invalidateQueries({
        queryKey: queryKeys.exerciseTypeProgress(chapterId),
      })
      // Invalidate chapter progress since it's derived from exercise type coverage
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chapterProgress(user.id, bookId),
      })
      // Invalidate user progress for dashboard updates
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userProgress(user.id),
      })
    },
  })
}
