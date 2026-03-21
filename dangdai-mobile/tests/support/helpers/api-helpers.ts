/**
 * API helpers — thin wrappers around Playwright's APIRequestContext
 * scoped to the dangdai-api backend.
 *
 * These are pure functions (no class, no inheritance) so they are
 * unit-testable independently of Playwright.
 *
 * Usage:
 *   import { quizApi } from '../support/helpers/api-helpers'
 *
 *   test('generate quiz', async ({ request, authToken }) => {
 *     const result = await quizApi.generate(request, authToken!, {
 *       chapter_id: 101,
 *       exercise_type: 'vocabulary',
 *       num_questions: 5,
 *     })
 *     expect(result.questions).toHaveLength(5)
 *   })
 */
import type { APIRequestContext } from '@playwright/test'
import type { QuizRequest, QuizResult } from '../factories/quiz-factory'

const API_BASE = process.env.API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------
export async function apiPost<T>(
  request: APIRequestContext,
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await request.post(`${API_BASE}${path}`, { data: body, headers })

  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`POST ${path} failed: ${response.status()} ${text}`)
  }
  return response.json() as Promise<T>
}

export async function apiGet<T>(
  request: APIRequestContext,
  path: string,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await request.get(`${API_BASE}${path}`, { headers })

  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`GET ${path} failed: ${response.status()} ${text}`)
  }
  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Quiz API
// ---------------------------------------------------------------------------
export const quizApi = {
  generate: (
    request: APIRequestContext,
    token: string | null,
    payload: QuizRequest,
  ): Promise<QuizResult> => apiPost<QuizResult>(request, '/api/v1/quiz/generate', payload, token),

  health: (request: APIRequestContext): Promise<{ status: string }> =>
    apiGet<{ status: string }>(request, '/health'),
}
