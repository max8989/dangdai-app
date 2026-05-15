/**
 * Paused Quiz Types
 *
 * Type definitions for the quiz pause/resume feature.
 * Matches the Supabase `paused_quizzes` table schema.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 2
 */

import type { QuizQuestion, ExerciseType } from './quiz'

/**
 * The quiz state stored in the `quiz_state` JSONB column.
 * Captures everything needed to fully restore a paused quiz session.
 */
export interface PausedQuizState {
  /** All quiz questions (full payload) */
  questions: QuizQuestion[]
  /** Index of the current question when the quiz was paused */
  currentQuestionIndex: number
  /** Map of question index → user's answer string */
  answers: Record<number, string>
  /** ISO timestamp when the quiz was originally started */
  startedAt: string
  /** Time elapsed in milliseconds before pausing */
  timeElapsed: number
  /** Exercise type for this quiz session */
  exerciseType: ExerciseType
  /** Chapter ID (e.g., 105 for Book 1 Chapter 5) */
  chapterId: number
  /** Book ID (e.g., 1) */
  bookId: number
}

/**
 * A row from the `paused_quizzes` Supabase table.
 * Represents a single paused quiz session for a user.
 */
export interface PausedQuiz {
  /** UUID primary key */
  id: string
  /** UUID of the authenticated user */
  user_id: string
  /** Chapter ID (e.g., 105 for Book 1 Chapter 5) */
  chapter_id: number
  /** Exercise type string (e.g., 'vocabulary', 'grammar') */
  exercise_type: string
  /** Full quiz state JSONB — cast to PausedQuizState on read */
  quiz_state: PausedQuizState
  /** ISO timestamp when the quiz was paused */
  paused_at: string
  /** ISO timestamp when this record expires (7 days after pausing) */
  expires_at: string
  /** ISO timestamp when the record was created */
  created_at: string
  /** ISO timestamp when the record was last updated */
  updated_at: string
}
