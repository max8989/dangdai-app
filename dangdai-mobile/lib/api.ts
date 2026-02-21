/**
 * Python Backend API Client
 *
 * Provides methods for communicating with the Python backend API.
 * Uses Supabase JWT for authentication.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import { supabase } from './supabase'
import { QuizGenerationError, EXERCISE_TYPE_LABELS } from '../types/quiz'
import type { QuizGenerationParams, QuizResponse, ExerciseType, AnswerValidationResponse } from '../types/quiz'

const apiUrl = process.env.EXPO_PUBLIC_API_URL

if (!apiUrl) {
  console.warn('EXPO_PUBLIC_API_URL not configured. Python backend API will not be available.')
}

/**
 * Base URL for the Python backend API.
 */
export const API_BASE_URL = apiUrl ?? 'http://localhost:8000'

/** Client-side timeout for quiz generation requests (10 seconds). */
const QUIZ_GENERATION_TIMEOUT_MS = 10_000

/** Client-side timeout for answer validation requests (3 seconds). */
const ANSWER_VALIDATION_TIMEOUT_MS = 3_000

/**
 * Categorize an HTTP error response into a typed QuizGenerationError.
 */
function categorizeHttpError(status: number, exerciseTypeLabel: string): QuizGenerationError {
  switch (status) {
    case 401:
      return new QuizGenerationError('auth', 'Your session has expired. Please sign in again.')
    case 400:
      return new QuizGenerationError('validation', 'Invalid request. Please go back and try again.')
    case 404:
      return new QuizGenerationError(
        'not_found',
        `Not enough content for ${exerciseTypeLabel} in this chapter. Try Vocabulary or Grammar instead.`,
      )
    case 504:
      return new QuizGenerationError(
        'timeout',
        'Generation is taking too long. Please try again.',
      )
    default:
      return new QuizGenerationError(
        'server',
        `Couldn't generate ${exerciseTypeLabel} exercise. Try another type or retry.`,
      )
  }
}

/**
 * API client for communicating with the Python backend.
 */
export const api = {
  baseUrl: API_BASE_URL,

  /**
   * Generate a quiz via the backend API.
   *
   * @param params - Quiz generation parameters (chapterId, bookId, exerciseType).
   * @returns The generated quiz response.
   * @throws {QuizGenerationError} Typed error with category and user-friendly message.
   */
  async generateQuiz(params: QuizGenerationParams): Promise<QuizResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), QUIZ_GENERATION_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chapter_id: params.chapterId,
          book_id: params.bookId,
          exercise_type: params.exerciseType,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const label = EXERCISE_TYPE_LABELS[params.exerciseType as ExerciseType] ?? params.exerciseType
        throw categorizeHttpError(response.status, label)
      }

      return (await response.json()) as QuizResponse
    } catch (error) {
      clearTimeout(timeoutId)

      // Already a QuizGenerationError — rethrow
      if (error instanceof QuizGenerationError) {
        throw error
      }

      // AbortController timeout (AbortError name works across environments)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new QuizGenerationError(
          'timeout',
          'Generation is taking too long. Please try again.',
        )
      }

      // Network / fetch failure
      throw new QuizGenerationError('network', 'Check your connection and try again.')
    }
  },

  /**
   * Validate an answer via the LLM backend.
   *
   * Used for Dialogue Completion and Sentence Construction exercise types
   * when the user's answer differs from the pre-generated answer key.
   *
   * @param params - Validation parameters.
   * @returns LLM validation result with is_correct, explanation, alternatives.
   * @throws {QuizGenerationError} On timeout, network, or server error.
   */
  async validateAnswer(params: {
    question: string
    userAnswer: string
    correctAnswer: string
    exerciseType: string
  }): Promise<AnswerValidationResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ANSWER_VALIDATION_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question: params.question,
          user_answer: params.userAnswer,
          correct_answer: params.correctAnswer,
          exercise_type: params.exerciseType,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new QuizGenerationError('server', 'Answer validation failed.')
      }

      return (await response.json()) as AnswerValidationResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof QuizGenerationError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new QuizGenerationError('timeout', 'Validation timed out.')
      }

      throw new QuizGenerationError('network', 'Validation request failed.')
    }
  },
}
