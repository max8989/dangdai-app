/**
 * Quiz Types
 *
 * Type definitions for quiz generation API requests/responses.
 * Matches the API contract from Story 4.1.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

/**
 * Supported exercise types.
 * Maps to the backend's exercise_type enum.
 */
export type ExerciseType =
  | 'vocabulary'
  | 'grammar'
  | 'fill_in_blank'
  | 'matching'
  | 'dialogue_completion'
  | 'sentence_construction'
  | 'reading_comprehension'
  | 'mixed'

/**
 * User-friendly display labels for exercise types.
 */
export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  fill_in_blank: 'Fill-in-the-Blank',
  matching: 'Matching',
  dialogue_completion: 'Dialogue Completion',
  sentence_construction: 'Sentence Construction',
  reading_comprehension: 'Reading Comprehension',
  mixed: 'Mixed',
}

/**
 * Parameters for quiz generation API request.
 */
export interface QuizGenerationParams {
  chapterId: number
  bookId: number
  exerciseType: string
}

/**
 * A single quiz question from the API response.
 */
export interface QuizQuestion {
  question_id: string
  exercise_type: ExerciseType
  question_text: string
  correct_answer: string
  explanation: string
  source_citation: string
  options?: string[]
  character?: string
  pinyin?: string
}

/**
 * Full quiz generation API response.
 */
export interface QuizResponse {
  quiz_id: string
  chapter_id: number
  book_id: number
  exercise_type: ExerciseType
  question_count: number
  questions: QuizQuestion[]
}

/**
 * Categorized quiz generation error.
 */
export type QuizErrorType = 'auth' | 'validation' | 'not_found' | 'server' | 'timeout' | 'network'

/**
 * Typed error for quiz generation failures.
 */
export class QuizGenerationError extends Error {
  type: QuizErrorType

  constructor(type: QuizErrorType, message: string) {
    super(message)
    this.name = 'QuizGenerationError'
    this.type = type
  }
}
