/**
 * Quiz Types
 *
 * Type definitions for quiz generation API requests/responses.
 * Matches the API contract from Story 4.1.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import type { TablesInsert } from './supabase'

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
  correct_pairs?: number[][]  // Backend format: [[left_idx, right_idx], ...]
  // Reading comprehension fields (Story 4.8)
  passage?: string
  passage_pinyin?: string
  comprehension_questions?: ComprehensionSubQuestion[]
  // Text input fields (Story 4.12)
  input_type?: 'multiple_choice' | 'text_input'
  input_placeholder?: string
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
 * A sub-question within a reading comprehension passage.
 * Story 4.8: Reading Comprehension Exercise
 */
export interface ComprehensionSubQuestion {
  /** The question text */
  question: string
  /** Multiple choice options for this sub-question */
  options: string[]
  /** Index of the correct option (0-based, from backend API) */
  correct?: number
  /** The correct answer text (resolved from backend's correct index) */
  correct_answer: string
  /** Optional per-sub-question explanation */
  explanation?: string
  /** Optional per-sub-question source citation */
  source_citation?: string
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
 * Derived from Supabase generated types (TablesInsert<'question_results'>).
 * Column names match architecture.md exactly — do NOT rename.
 */
export type QuestionResultInsert = TablesInsert<'question_results'>

/**
 * Insert type for quiz_attempts table (Story 4.10, Task 3.2).
 *
 * Derived from Supabase generated types (TablesInsert<'quiz_attempts'>).
 * Column names match architecture.md exactly — do NOT rename.
 */
export type QuizAttemptInsert = TablesInsert<'quiz_attempts'>

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
