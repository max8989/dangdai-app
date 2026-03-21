/**
 * Quiz Play Process E2E Tests
 *
 * Tests the quiz interaction experience after the quiz has been generated:
 *   - Answering questions (correct / incorrect)
 *   - Feedback overlay appearance and "Next" navigation
 *   - Progress tracking across questions
 *   - Pause / exit modal behaviour
 *   - Completion screen at the end
 *
 * Strategy: navigate directly to /quiz/play after injecting quiz state into
 * the Zustand store via localStorage. This avoids depending on a live LLM
 * call for every test — generation is covered separately in quiz-generation.test.ts.
 *
 * For the full integration test (generation → play in one flow) see the
 * "full flow" describe block at the bottom — that one hits the real API.
 *
 * Prerequisites: same as quiz-generation.test.ts
 */

import { type Page } from '@playwright/test'
import { test, expect } from './support/merged-fixtures'
import { createQuizQuestion, createQuizResult, type QuizResult } from './support/factories/quiz-factory'
import type { SupabaseSession } from './support/fixtures/auth-fixture'

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_STORAGE_KEY = 'sb-qhsjaybldyqsavjimxes-auth-token'
const ZUSTAND_QUIZ_STORAGE_KEY = 'quiz-storage'

const CHAPTER_ID = 101
const BOOK_ID = 1

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function injectAuth(page: Page, session: SupabaseSession) {
  await page.evaluate(
    ([key, sessionJson]) => {
      window.localStorage.setItem(key, sessionJson)
    },
    [SUPABASE_STORAGE_KEY, JSON.stringify(session)],
  )
}

/**
 * Inject a pre-built quiz into the Zustand quiz store so /quiz/play renders
 * immediately without hitting the API.
 *
 * The Zustand store key comes from useQuizStore's persist config.
 * State shape mirrors useQuizStore's initial state.
 */
async function injectQuizState(page: Page, quiz: QuizResult) {
  await page.evaluate(
    ([key, quizJson]) => {
      const quiz = JSON.parse(quizJson as string) as QuizResult

      // Shape expected by useQuizStore (zustand persist)
      const state = {
        state: {
          questions: quiz.questions,
          currentQuestionIndex: 0,
          answers: {},
          isComplete: false,
          score: 0,
          exerciseType: quiz.exercise_type,
          chapterId: quiz.chapter_id,
          bookId: Math.floor(quiz.chapter_id / 100),
          quizId: quiz.quiz_id,
          startedAt: new Date().toISOString(),
        },
        version: 0,
      }
      window.localStorage.setItem(key as string, JSON.stringify(state))
    },
    [ZUSTAND_QUIZ_STORAGE_KEY, JSON.stringify(quiz)],
  )
}

/**
 * Answer the current question by clicking the first available answer option.
 * Works for multiple-choice vocabulary and grammar questions.
 */
async function answerCurrentQuestion(page: Page) {
  const grid = page.getByTestId('answer-option-grid')
  await expect(grid).toBeVisible()
  // Click the first option
  await page.getByTestId('answer-option-0').click()
}

// ─── Shared setup ────────────────────────────────────────────────────────────

test.beforeEach(async ({ page, authToken }) => {
  if (!authToken) {
    test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured — skipping auth tests')
    return
  }

  // Establish origin via a lightweight page load, inject auth
  await page.goto('/', { waitUntil: 'commit' })
  await injectAuth(page, authToken)
})

// ─── Quiz play — state-injected (no live API) ─────────────────────────────────

test.describe('Quiz play — vocabulary (state injected)', () => {
  let quiz: QuizResult

  test.beforeEach(async ({ page }) => {
    // Build a deterministic 3-question vocabulary quiz
    quiz = createQuizResult({
      chapter_id: CHAPTER_ID,
      exercise_type: 'vocabulary',
      questions: [
        createQuizQuestion({
          exercise_type: 'vocabulary',
          chapter_id: CHAPTER_ID,
          question_text: '你好 means:',
          options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
          correct_answer: 'Hello',
        }),
        createQuizQuestion({
          exercise_type: 'vocabulary',
          chapter_id: CHAPTER_ID,
          question_text: '再見 means:',
          options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
          correct_answer: 'Goodbye',
        }),
        createQuizQuestion({
          exercise_type: 'vocabulary',
          chapter_id: CHAPTER_ID,
          question_text: '謝謝 means:',
          options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
          correct_answer: 'Thank you',
        }),
      ],
    })

    // Inject auth then quiz state
    await injectQuizState(page, quiz)

    // Navigate to the play screen
    await page.goto('/quiz/play', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 10000 })
  })

  test('renders first question with progress indicator', async ({ page }) => {
    await expect(page.getByTestId('quiz-question-card')).toBeVisible()
    await expect(page.getByTestId('quiz-progress')).toBeVisible()
    await expect(page.getByTestId('quiz-progress')).toContainText('1')
    await expect(page.getByTestId('answer-option-grid')).toBeVisible()

    // All 4 answer options rendered
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId(`answer-option-${i}`)).toBeVisible()
    }
  })

  test('answering a question shows feedback overlay', async ({ page }) => {
    await answerCurrentQuestion(page)

    // Feedback overlay must appear
    await expect(page.getByTestId('feedback-overlay')).toBeVisible({ timeout: 5000 })

    // Overlay shows result text and a next button
    await expect(page.getByTestId('feedback-result-text')).toBeVisible()
    await expect(page.getByTestId('feedback-next-button')).toBeVisible()
  })

  test('correct answer shows correct feedback and explanation', async ({ page }) => {
    // Click the first option which is 'Hello' — correct for question 1
    await page.getByTestId('answer-option-0').click()

    await expect(page.getByTestId('feedback-overlay')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('feedback-check-icon')).toBeVisible()
    await expect(page.getByTestId('feedback-explanation')).toBeVisible()
  })

  test('wrong answer shows incorrect feedback with correct answer revealed', async ({ page }) => {
    // Click the second option which is 'Goodbye' — wrong for question 1 ('Hello')
    await page.getByTestId('answer-option-1').click()

    await expect(page.getByTestId('feedback-overlay')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('feedback-x-icon')).toBeVisible()
    await expect(page.getByTestId('feedback-correct-answer')).toBeVisible()
  })

  test('tapping Next advances to question 2', async ({ page }) => {
    await answerCurrentQuestion(page)
    await expect(page.getByTestId('feedback-next-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('feedback-next-button').click()

    // Progress should now show question 2
    await expect(page.getByTestId('quiz-progress')).toContainText('2')
    await expect(page.getByTestId('quiz-question-card')).toBeVisible()
  })

  test('completing all questions shows completion screen', async ({ page }) => {
    // Answer all 3 questions
    for (let q = 0; q < 3; q++) {
      await answerCurrentQuestion(page)
      await expect(page.getByTestId('feedback-next-button')).toBeVisible({ timeout: 5000 })
      await page.getByTestId('feedback-next-button').click()

      if (q < 2) {
        // Still more questions — wait for next card to be ready
        await expect(page.getByTestId('quiz-question-card')).toBeVisible({ timeout: 5000 })
      }
    }

    // Completion screen must render
    await expect(page.getByTestId('completion-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('stats-score')).toBeVisible()
    await expect(page.getByTestId('continue-button')).toBeVisible()
  })

  test('completion screen continue button navigates back to books', async ({ page }) => {
    // Answer all 3 questions fast
    for (let q = 0; q < 3; q++) {
      await answerCurrentQuestion(page)
      await expect(page.getByTestId('feedback-next-button')).toBeVisible({ timeout: 5000 })
      await page.getByTestId('feedback-next-button').click()
      if (q < 2) await expect(page.getByTestId('quiz-question-card')).toBeVisible({ timeout: 5000 })
    }

    await expect(page.getByTestId('completion-screen')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('continue-button').click()

    // Should land back on the books / tabs area
    await expect(page).toHaveURL(/\/(tabs)|(books)/, { timeout: 10000 })
  })
})

// ─── Exit / pause modal ───────────────────────────────────────────────────────

test.describe('Exit confirmation modal', () => {
  test.beforeEach(async ({ page }) => {
    const quiz = createQuizResult({ chapter_id: CHAPTER_ID, exercise_type: 'vocabulary' })
    await injectQuizState(page, quiz)
    await page.goto('/quiz/play', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 10000 })
  })

  test('leave button opens exit confirmation modal', async ({ page }) => {
    await page.getByTestId('leave-button').click()
    await expect(page.getByTestId('exit-confirmation-modal')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('exit-modal-title')).toBeVisible()
  })

  test('stay button dismisses modal and resumes quiz', async ({ page }) => {
    await page.getByTestId('leave-button').click()
    await expect(page.getByTestId('exit-confirmation-modal')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('stay-button').click()

    await expect(page.getByTestId('exit-confirmation-modal')).not.toBeVisible()
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible()
  })

  test('cancel quiz button exits and returns to chapter screen', async ({ page }) => {
    await page.getByTestId('leave-button').click()
    await expect(page.getByTestId('exit-confirmation-modal')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('cancel-quiz-button').click()

    // Should navigate away from the play screen
    await expect(page.getByTestId('quiz-play-screen')).not.toBeVisible({ timeout: 10000 })
  })
})

// ─── Full integration flow (generation → play, hits real API) ────────────────

test.describe('Full flow — generation to completion (vocabulary, real API)', () => {
  test('generates and completes a vocabulary quiz end-to-end', async ({ page, authToken }) => {
    if (!authToken) test.skip(true, 'Credentials not configured')

    // Start from chapter detail
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })

    // Tap vocabulary (Tier 1 — algorithmic, fast, no LLM)
    await page.getByTestId('vocabulary-quiz-button').click()

    // Wait through loading
    await expect(page.getByTestId('quiz-loading-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 30000 })

    // Answer every question until the completion screen appears
    let questionsDone = 0
    const maxQuestions = 15 // safety ceiling

    while (questionsDone < maxQuestions) {
      const completionVisible = await page.getByTestId('completion-screen').isVisible()
      if (completionVisible) break

      // Wait for question card or completion screen (whichever comes first)
      await expect(
        page.getByTestId('quiz-question-card').or(page.getByTestId('completion-screen')),
      ).toBeVisible({ timeout: 10000 })

      if (await page.getByTestId('completion-screen').isVisible()) break

      // Answer: click the first available option
      const firstOption = page.getByTestId('answer-option-0')
      await expect(firstOption).toBeVisible({ timeout: 5000 })
      await firstOption.click()

      // Wait for feedback, then advance
      await expect(page.getByTestId('feedback-next-button')).toBeVisible({ timeout: 8000 })
      await page.getByTestId('feedback-next-button').click()
      questionsDone++
    }

    // Completion screen must have appeared
    await expect(page.getByTestId('completion-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('stats-score')).toBeVisible()
    await expect(page.getByTestId('stats-time')).toBeVisible()
    await expect(page.getByTestId('continue-button')).toBeVisible()
  })
})
