/**
 * useQuizPersistence Hook
 *
 * Provides Supabase write helpers and crash recovery logic for quiz sessions.
 *
 * Exports:
 *   - saveQuestionResult(): Fire-and-forget Supabase insert for per-question data
 *   - saveQuizAttempt(): Supabase insert for full quiz completion record
 *   - checkForResumableQuiz(): Reads store state to detect in-progress quiz
 *   - clearResumableQuiz(): Clears persisted quiz state (calls resetQuiz)
 *
 * Key design decisions (per story Dev Notes):
 *   - saveQuestionResult is async and NON-BLOCKING — caller should NOT await it
 *   - All Supabase writes are wrapped in try/catch — NEVER throws to callers
 *   - Missing tables (42P01) are logged + skipped (not retried)
 *   - Network errors are queued in a module-level array for retry on next successful write
 *   - Retry queue is module-level (survives hook remounts), holds max 10 items (FIFO eviction)
 *   - Auth errors (no user) skip the write gracefully
 *
 * Story 4.10: Quiz Progress Saving — Task 4
 */

import { useCallback } from 'react'

import { supabase, insertQuestionResult, insertQuizAttempt } from '../lib/supabase'
import { useQuizStore } from '../stores/useQuizStore'
import type { QuestionResultInsert, QuizAttemptInsert } from '../types/quiz'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Parameters for saveQuestionResult */
export interface SaveQuestionResultParams {
  chapterId: number
  bookId: number
  exerciseType: string
  vocabularyItem: string | null
  grammarPattern: string | null
  correct: boolean
  timeSpentMs: number
}

/** Parameters for saveQuizAttempt */
export interface SaveQuizAttemptParams {
  chapterId: number
  bookId: number
  exerciseType: string
  score: number
  totalQuestions: number
  answersJson: Record<string, unknown>
}

/** Return value of checkForResumableQuiz */
export interface ResumableQuizInfo {
  hasResumable: true
  quizId: string
  currentQuestion: number
  totalQuestions: number
  exerciseType: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of failed writes to queue for retry */
const MAX_RETRY_QUEUE_SIZE = 10

// ─── Module-level retry queue ─────────────────────────────────────────────────
//
// The retry queue is module-level (not per-hook-instance) so that failed writes
// survive component remounts and navigation. A queue per hook instance would lose
// all queued retries when the component unmounts (e.g. navigating away mid-quiz).
//
// FIFO eviction when queue exceeds MAX_RETRY_QUEUE_SIZE.

let _retryQueue: QuestionResultInsert[] = []

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Quiz persistence hook providing Supabase write helpers and crash recovery.
 *
 * Can be called from functional components or from outside React (via direct
 * import since the helpers do not require React context).
 */
export function useQuizPersistence() {
  /**
   * Flush the retry queue: attempt to re-insert queued items.
   * Called automatically after a successful write.
   * Items that fail during flush are re-queued (up to MAX_RETRY_QUEUE_SIZE)
   * so they are not permanently discarded on a transient retry failure.
   */
  const flushRetryQueue = useCallback(async (): Promise<void> => {
    if (_retryQueue.length === 0) return

    // Drain current queue — we will re-queue any that fail during this flush
    const toFlush = [..._retryQueue]
    _retryQueue = []

    for (const item of toFlush) {
      try {
        await insertQuestionResult(item)
      } catch {
        // Re-queue failed item (with FIFO eviction) so the next successful
        // write can retry it rather than silently discarding it.
        if (_retryQueue.length >= MAX_RETRY_QUEUE_SIZE) {
          _retryQueue.shift()
        }
        _retryQueue.push(item)
      }
    }
  }, [])

  /**
   * Save a per-question result to Supabase (Task 4.2).
   *
   * This is async and NON-BLOCKING — callers should NOT await it.
   * The answer handler should call this as fire-and-forget:
   *   saveQuestionResult({ ... })  // no await
   *
   * On success: also flushes the retry queue.
   * On network failure: queues the item for retry (max 10 items, FIFO eviction).
   * On table-missing / auth errors: logs warning, no retry.
   */
  const saveQuestionResult = useCallback(async (params: SaveQuestionResultParams): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        console.warn('[useQuizPersistence] No authenticated user — skipping question_result write')
        return
      }

      const insertData: QuestionResultInsert = {
        user_id: user.id,
        chapter_id: params.chapterId,
        book_id: params.bookId,
        exercise_type: params.exerciseType,
        vocabulary_item: params.vocabularyItem,
        grammar_pattern: params.grammarPattern,
        correct: params.correct,
        time_spent_ms: params.timeSpentMs,
      }

      await insertQuestionResult(insertData)

      // Success — flush any queued retries
      await flushRetryQueue()
    } catch (err) {
      // Network error (not a table-missing or auth error, those are handled inside
      // insertQuestionResult and logged there). Queue for retry.
      console.warn('[useQuizPersistence] Network error saving question_result, queuing for retry:', err)

      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (user) {
          const insertData: QuestionResultInsert = {
            user_id: user.id,
            chapter_id: params.chapterId,
            book_id: params.bookId,
            exercise_type: params.exerciseType,
            vocabulary_item: params.vocabularyItem,
            grammar_pattern: params.grammarPattern,
            correct: params.correct,
            time_spent_ms: params.timeSpentMs,
          }

          // FIFO eviction: if queue is full, drop the oldest item
          if (_retryQueue.length >= MAX_RETRY_QUEUE_SIZE) {
            _retryQueue.shift()
          }
          _retryQueue.push(insertData)
        }
      } catch {
        // Ignore errors during retry queuing
      }
    }
  }, [flushRetryQueue])

  /**
   * Save a full quiz completion record to Supabase (Task 4.4).
   *
   * Called on quiz completion (last question answered).
   * Async but callers may await it before navigating away.
   */
  const saveQuizAttempt = useCallback(async (params: SaveQuizAttemptParams): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        console.warn('[useQuizPersistence] No authenticated user — skipping quiz_attempt write')
        return
      }

      const insertData: QuizAttemptInsert = {
        user_id: user.id,
        chapter_id: params.chapterId,
        book_id: params.bookId,
        exercise_type: params.exerciseType,
        score: params.score,
        total_questions: params.totalQuestions,
        answers_json: params.answersJson,
      }

      await insertQuizAttempt(insertData)
    } catch (err) {
      console.warn('[useQuizPersistence] Unexpected error saving quiz_attempt:', err)
    }
  }, [])

  /**
   * Check if there is an in-progress quiz that can be resumed (Task 4.6).
   *
   * Reads from useQuizStore (hydrated from AsyncStorage after app launch).
   * Should only be called after _hasHydrated === true to avoid false negatives.
   *
   * @returns ResumableQuizInfo if a quiz is in progress, null otherwise
   */
  const checkForResumableQuiz = useCallback((): ResumableQuizInfo | null => {
    const state = useQuizStore.getState()

    if (!state.hasActiveQuiz()) return null

    return {
      hasResumable: true,
      quizId: state.currentQuizId!,
      currentQuestion: state.currentQuestion,
      totalQuestions: state.quizPayload?.questions.length ?? 0,
      exerciseType: state.exerciseType,
    }
  }, [])

  /**
   * Clear the persisted quiz state (Task 4.7).
   *
   * Calls useQuizStore.resetQuiz() which clears all fields and the Zustand
   * persist middleware automatically removes the data from AsyncStorage.
   */
  const clearResumableQuiz = useCallback(() => {
    useQuizStore.getState().resetQuiz()
  }, [])

  return {
    saveQuestionResult,
    saveQuizAttempt,
    checkForResumableQuiz,
    clearResumableQuiz,
  }
}
