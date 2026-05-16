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
import type {
  QuizGenerationParams,
  QuizResponse,
  ExerciseType,
  MultiChapterQuizParams,
  MultiChapterQuizResponse,
  CustomQuizParams,
  CustomQuizResponse,
} from '../types/quiz'

const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  console.warn('VITE_API_URL not configured. Python backend API will not be available.')
}

/**
 * Base URL for the Python backend API.
 */
export const API_BASE_URL = apiUrl ?? 'http://localhost:8000'

/** Client-side timeout for quiz generation requests (2 minutes). */
const QUIZ_GENERATION_TIMEOUT_MS = 120_000

/** Client-side timeout for multi-chapter generation. Backend caps at 180s. */
const MULTI_CHAPTER_TIMEOUT_MS = 200_000

/** Client-side timeout for on-the-fly exercise generation (Story 4.17). */
const EXERCISE_GENERATION_TIMEOUT_MS = 130_000

/** Client-side timeout for chat / RAG Q&A requests. */
const CHAT_TIMEOUT_MS = 60_000

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
 * Transform a quiz API response to resolve reading comprehension sub-question
 * correct indices into correct_answer strings.
 *
 * The backend sends `correct: number` (0-based index into options) for each
 * comprehension sub-question. The frontend expects `correct_answer: string`
 * (the actual answer text). This function resolves the index to the text.
 */
function resolveComprehensionAnswers(response: QuizResponse): QuizResponse {
  return {
    ...response,
    questions: response.questions.map((q) => {
      if (
        q.exercise_type === 'reading_comprehension' &&
        q.comprehension_questions
      ) {
        return {
          ...q,
          comprehension_questions: q.comprehension_questions.map((subQ) => {
            // If correct_answer is already populated (e.g., in tests), keep it
            if (subQ.correct_answer) return subQ
            // Resolve correct index to answer text
            const correctIndex = subQ.correct ?? 0
            return {
              ...subQ,
              correct_answer: subQ.options[correctIndex] ?? '',
            }
          }),
        }
      }
      return q
    }),
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
   * @deprecated Story 4.16 — No longer called from user-facing flows. All exercises
   * now use pre-generated content from the premade_exercises table.
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

      const quizResponse = (await response.json()) as QuizResponse
      return resolveComprehensionAnswers(quizResponse)
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
   * Generate an exercise on-the-fly via AI (Story 4.17).
   *
   * Returns the same content shape as premade_exercises.content so the mobile
   * adapter can consume both paths identically.
   *
   * @param params - Generation parameters (bookId, chapterId, exerciseType).
   * @param options - Optional { signal } for external AbortController.
   * @throws {QuizGenerationError} Typed error with category and user-friendly message.
   */
  async generateExercise(
    params: { bookId: number; chapterId: number; exerciseType: string },
    options?: { signal?: AbortSignal },
  ): Promise<ExerciseGenerateResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), EXERCISE_GENERATION_TIMEOUT_MS)

    // Thread external signal — abort our controller if the caller aborts
    const externalSignal = options?.signal
    const onExternalAbort = () => controller.abort()
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId)
        controller.abort()
      } else {
        externalSignal.addEventListener('abort', onExternalAbort)
      }
    }

    const url = `${API_BASE_URL}/api/exercises/generate`
    const body = {
      chapter_id: params.chapterId,
      book_id: params.bookId,
      exercise_type: params.exerciseType,
    }
    console.log('[api.generateExercise] POST', url, JSON.stringify(body))

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', onExternalAbort)

      console.log('[api.generateExercise] response status:', response.status)

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        console.error('[api.generateExercise] HTTP', response.status, 'body:', errorBody)
        const label = EXERCISE_TYPE_LABELS[params.exerciseType as ExerciseType] ?? params.exerciseType
        throw categorizeHttpError(response.status, label)
      }

      const result = (await response.json()) as ExerciseGenerateResponse
      console.log('[api.generateExercise] success, exercise_type:', result.exercise_type)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', onExternalAbort)

      console.error('[api.generateExercise] caught error:', error instanceof Error ? `${error.name}: ${error.message}` : String(error))

      if (error instanceof QuizGenerationError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new QuizGenerationError(
          'timeout',
          "Couldn't generate exercise — please try again.",
        )
      }

      throw new QuizGenerationError('network', 'Check your connection and try again.')
    }
  },

  /**
   * Generate a quiz spanning a range of chapters.
   *
   * Calls POST /api/quizzes/generate-multi with the start/end chapter IDs,
   * desired question count, and selected exercise types. Returns a single
   * merged quiz. Persistence on completion is handled by the existing
   * quiz_attempts flow (mobile-side via useQuizPersistence).
   */
  async generateMultiChapterQuiz(
    params: MultiChapterQuizParams,
  ): Promise<MultiChapterQuizResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MULTI_CHAPTER_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/generate-multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chapter_id_start: params.chapterIdStart,
          chapter_id_end: params.chapterIdEnd,
          question_count: params.questionCount,
          exercise_types: params.exerciseTypes,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const label =
          params.exerciseTypes.length === 1
            ? (EXERCISE_TYPE_LABELS[params.exerciseTypes[0]] ?? params.exerciseTypes[0])
            : 'mixed'
        throw categorizeHttpError(response.status, label)
      }

      const result = (await response.json()) as MultiChapterQuizResponse
      return result
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof QuizGenerationError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new QuizGenerationError(
          'timeout',
          'Generation is taking too long. Please try again.',
        )
      }

      throw new QuizGenerationError('network', 'Check your connection and try again.')
    }
  },

  /**
   * Generate a quiz from an explicit list of chapter IDs (any order, non-contiguous).
   *
   * Calls POST /api/quizzes/generate-custom. Unlike generate-multi (range),
   * this endpoint:
   * - Accepts any list of chapter_ids spanning any books.
   * - Uses a per-call diversity seed and higher LLM temperature so repeated
   *   requests with the same inputs produce noticeably different quizzes.
   * - Optionally accepts `avoidQuestionTexts` to skip recently-seen questions.
   * - Never caches output — every call is fresh.
   */
  async generateCustomQuiz(params: CustomQuizParams): Promise<CustomQuizResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new QuizGenerationError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MULTI_CHAPTER_TIMEOUT_MS)

    try {
      const body: Record<string, unknown> = {
        chapter_ids: params.chapterIds,
        question_count: params.questionCount,
        exercise_types: params.exerciseTypes,
      }
      if (params.seed != null) body.seed = params.seed
      if (params.avoidQuestionTexts && params.avoidQuestionTexts.length > 0) {
        body.avoid_question_texts = params.avoidQuestionTexts
      }
      if (params.temperature != null) body.temperature = params.temperature

      const response = await fetch(`${API_BASE_URL}/api/quizzes/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const label =
          params.exerciseTypes.length === 1
            ? (EXERCISE_TYPE_LABELS[params.exerciseTypes[0]] ?? params.exerciseTypes[0])
            : 'mixed'
        throw categorizeHttpError(response.status, label)
      }

      return (await response.json()) as CustomQuizResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof QuizGenerationError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new QuizGenerationError(
          'timeout',
          'Generation is taking too long. Please try again.',
        )
      }

      throw new QuizGenerationError('network', 'Check your connection and try again.')
    }
  },

  /**
   * Ask the textbook/workbook RAG agent a question.
   *
   * Calls POST /api/chat with the query and optional book/lesson/content_type
   * filters. Returns the generated answer plus source citations.
   */
  async askChat(params: ChatParams): Promise<ChatApiResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new ChatError('auth', 'Not authenticated. Please sign in.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: params.query,
          book: params.book ?? null,
          lesson: params.lesson ?? null,
          content_type: params.contentType ?? null,
          num_chunks: params.numChunks ?? 5,
          history: params.history ?? [],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          throw new ChatError('auth', 'Your session has expired. Please sign in again.')
        }
        throw new ChatError('server', "Couldn't get an answer. Please try again.")
      }

      return (await response.json()) as ChatApiResponse
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ChatError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ChatError('timeout', 'The agent is taking too long. Please try again.')
      }

      throw new ChatError('network', 'Check your connection and try again.')
    }
  },
}

/** One prior message turn sent with a chat request. */
export interface ChatHistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

/** Parameters for askChat(). */
export interface ChatParams {
  query: string
  book?: number | null
  lesson?: number | null
  contentType?: 'textbook' | 'workbook' | null
  numChunks?: number
  /** Prior turns (oldest first), excluding the current query. */
  history?: ChatHistoryTurn[]
}

/** A single source citation returned with a chat answer. */
export interface ChatSource {
  book: number | null
  lesson: number | null
  section: string | null
  content_type: string | null
  exercise_type: string | null
  similarity: number | null
  page_range: string | null
}

/** Response shape from POST /api/chat. */
export interface ChatApiResponse {
  answer: string
  sources: ChatSource[]
  model: string
}

/** Typed error for chat / RAG requests. */
export class ChatError extends Error {
  category: 'auth' | 'network' | 'timeout' | 'server'
  constructor(category: ChatError['category'], message: string) {
    super(message)
    this.category = category
    this.name = 'ChatError'
  }
}

/** Response shape from POST /api/exercises/generate (Story 4.17). */
export interface ExerciseGenerateResponse {
  exercise_type: string
  book_id: number
  lesson_id: number
  title: string
  instructions: string
  content: { questions: any[] }
}
