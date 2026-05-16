/**
 * useQuizPersistence Hook
 *
 * Provides Supabase write helpers and crash recovery logic for quiz sessions.
 *
 *   - saveQuestionResult(): Fire-and-forget Supabase insert for per-question data
 *   - saveQuizAttempt(): Supabase insert for full quiz completion record
 *   - checkForResumableQuiz(): Reads store state to detect in-progress quiz
 *   - clearResumableQuiz(): Clears persisted quiz state (calls resetQuiz)
 *
 * - saveQuestionResult is async and NON-BLOCKING — callers should NOT await it
 * - All Supabase writes are wrapped in try/catch — NEVER throws to callers
 * - Network errors are queued in a module-level array for retry on next successful write
 */

import { useCallback } from 'react'

import { supabase, insertQuestionResult, insertQuizAttempt } from '@/lib/supabase'
import { useQuizStore } from '@/stores/useQuizStore'
import type { QuestionResultInsert, QuizAttemptInsert } from '@/types/quiz'
import type { Json } from '@/types/supabase'

export interface SaveQuestionResultParams {
  chapterId: number
  bookId: number
  exerciseType: string
  vocabularyItem: string | null
  grammarPattern: string | null
  correct: boolean
  timeSpentMs: number
}

export interface SaveQuizAttemptParams {
  chapterId: number
  bookId: number
  exerciseType: string
  score: number
  totalQuestions: number
  answersJson: Json
  chapterIdEnd?: number | null
}

export interface ResumableQuizInfo {
  hasResumable: true
  quizId: string
  currentQuestion: number
  totalQuestions: number
  exerciseType: string | null
}

const MAX_RETRY_QUEUE_SIZE = 10
let _retryQueue: QuestionResultInsert[] = []

export function useQuizPersistence() {
  const flushRetryQueue = useCallback(async (): Promise<void> => {
    if (_retryQueue.length === 0) return

    const toFlush = [..._retryQueue]
    _retryQueue = []

    for (const item of toFlush) {
      try {
        await insertQuestionResult(item)
      } catch {
        if (_retryQueue.length >= MAX_RETRY_QUEUE_SIZE) {
          _retryQueue.shift()
        }
        _retryQueue.push(item)
      }
    }
  }, [])

  const saveQuestionResult = useCallback(
    async (params: SaveQuestionResultParams): Promise<void> => {
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
        await flushRetryQueue()
      } catch (err) {
        console.warn(
          '[useQuizPersistence] Network error saving question_result, queuing for retry:',
          err,
        )

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

            if (_retryQueue.length >= MAX_RETRY_QUEUE_SIZE) {
              _retryQueue.shift()
            }
            _retryQueue.push(insertData)
          }
        } catch {
          // Ignore errors during retry queuing
        }
      }
    },
    [flushRetryQueue],
  )

  const saveQuizAttempt = useCallback(
    async (params: SaveQuizAttemptParams): Promise<void> => {
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
          ...(params.chapterIdEnd != null ? { chapter_id_end: params.chapterIdEnd } : {}),
        }

        await insertQuizAttempt(insertData)
      } catch (err) {
        console.warn('[useQuizPersistence] Unexpected error saving quiz_attempt:', err)
      }
    },
    [],
  )

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
