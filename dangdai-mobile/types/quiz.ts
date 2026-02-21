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
 * A matched pair for matching exercises.
 * Story 4.5: Matching Exercise (Tap-to-Pair)
 */
export interface MatchingPair {
  /** Left column item (e.g., Chinese character) */
  left: string
  /** Right column item (e.g., pinyin) */
  right: string
}

/**
 * A single quiz question from the API response.
 *
 * Story 4.4: Extended with fill-in-blank specific fields.
 * Story 4.5: Extended with matching-specific fields.
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
  // Fill-in-blank fields (Story 4.4)
  sentence_with_blanks?: string
  word_bank?: string[]
  blank_positions?: number[]
  // Dialogue completion fields (Story 4.6)
  dialogue_lines?: DialogueLine[]
  // Sentence construction fields (Story 4.7)
  scrambled_words?: string[]
  correct_order?: string[]
  // Matching exercise fields (Story 4.5)
  pairs?: MatchingPair[]
  left_items?: string[]
  right_items?: string[]
}

/**
 * A single line in a dialogue completion exercise.
 * Story 4.6: Dialogue Completion Exercise
 */
export interface DialogueLine {
  /** Speaker identifier */
  speaker: 'a' | 'b'
  /** The text content of this line. Empty string if this is the blank. */
  text: string
  /** Whether this line is the blank the user must fill */
  isBlank: boolean
}

/**
 * Extended question type for dialogue completion exercises.
 * Story 4.6: Dialogue Completion Exercise
 */
export interface DialogueQuestion extends QuizQuestion {
  exercise_type: 'dialogue_completion'
  /** The conversation lines with one blank */
  dialogue_lines: DialogueLine[]
  /** Answer options for the blank (required for dialogue — displayed as vertical list) */
  options: string[]
}

/**
 * Request body for POST /api/quizzes/validate-answer.
 * Story 4.6: Dialogue Completion Exercise
 * Story 4.7: Sentence Construction Exercise (alias exported)
 */
export interface AnswerValidationRequest {
  question: string
  user_answer: string
  correct_answer: string
  exercise_type: string
}

/** Alias used by Story 4.7 Sentence Construction. */
export type AnswerValidationParams = AnswerValidationRequest

/**
 * Response from POST /api/quizzes/validate-answer.
 * Story 4.6: Dialogue Completion Exercise
 */
export interface AnswerValidationResponse {
  is_correct: boolean
  explanation: string
  alternatives: string[]
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
 * Insert type for question_results table (Story 4.10, Task 3.1).
 *
 * Used when writing per-question performance data to Supabase.
 * The table may not exist yet (Story 1.3 in-progress) — all inserts must be
 * wrapped in try/catch with graceful 42P01 error handling.
 *
 * Column names match architecture.md exactly — do NOT rename.
 */
export interface QuestionResultInsert {
  user_id: string
  chapter_id: number
  book_id: number
  exercise_type: string
  vocabulary_item: string | null
  grammar_pattern: string | null
  correct: boolean
  time_spent_ms: number
}

/**
 * Insert type for quiz_attempts table (Story 4.10, Task 3.2).
 *
 * Used when recording full quiz completion data to Supabase.
 * The table may not exist yet (Story 1.3 in-progress) — all inserts must be
 * wrapped in try/catch with graceful 42P01 error handling.
 *
 * Column names match architecture.md exactly — do NOT rename.
 */
export interface QuizAttemptInsert {
  user_id: string
  chapter_id: number
  book_id: number
  exercise_type: string
  score: number
  total_questions: number
  answers_json: Record<string, unknown>
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
