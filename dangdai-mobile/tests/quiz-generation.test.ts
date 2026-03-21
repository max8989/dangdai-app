/**
 * Quiz Generation E2E Tests
 *
 * Tests the full quiz generation flow:
 *   Chapter detail screen → Exercise type selection → Loading screen → Quiz play screen
 *
 * Prerequisites:
 *   - Expo web build running (managed by playwright.config.ts webServer)
 *   - FastAPI backend running on API_URL (default: http://localhost:8000)
 *   - TEST_USER_EMAIL + TEST_USER_PASSWORD set (Supabase test user)
 *   - EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY set
 *
 * Auth strategy: inject Supabase session via localStorage — bypasses the login
 * UI entirely. Fails fast (test.skip) when credentials are not configured.
 */

import { test, expect } from './support/merged-fixtures'
import type { SupabaseSession } from './support/fixtures/auth-fixture'

// ─── Constants ──────────────────────────────────────────────────────────────

const SUPABASE_STORAGE_KEY = 'sb-qhsjaybldyqsavjimxes-auth-token'

/** Book 1, Chapter 1 = chapterId 101 */
const CHAPTER_ID = 101
const BOOK_ID = 1

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Inject a full Supabase session into localStorage so the app treats the
 * browser as already logged in. Must be called AFTER page.goto() so the
 * localStorage belongs to the correct origin.
 */
async function injectAuth(page: import('@playwright/test').Page, session: SupabaseSession) {
  await page.evaluate(
    ([key, sessionJson]) => {
      window.localStorage.setItem(key, sessionJson)
    },
    [SUPABASE_STORAGE_KEY, JSON.stringify(session)],
  )
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page, authToken }) => {
  if (!authToken) {
    test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured — skipping auth tests')
    return
  }

  // Land on app root to establish the correct localStorage origin
  await page.goto('/', { waitUntil: 'commit' })
  await injectAuth(page, authToken)

  // Reload so the app picks up the injected session
  await page.reload({ waitUntil: 'networkidle' })

  // Confirm we are authenticated — should NOT see the login screen
  await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible({ timeout: 8000 })
})

// ─── Chapter detail screen ───────────────────────────────────────────────────

test.describe('Chapter detail screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })
  })

  test('shows chapter info and all exercise type buttons', async ({ page }) => {
    // Chapter metadata
    await expect(page.getByTestId('book-info')).toBeVisible()

    // All 8 exercise type entry points must be present
    const buttons = [
      'mixed-quiz-button',
      'vocabulary-quiz-button',
      'grammar-quiz-button',
      'fill-in-blank-quiz-button',
      'matching-quiz-button',
      'dialogue-completion-quiz-button',
      'sentence-construction-quiz-button',
      'reading-comprehension-quiz-button',
    ]
    for (const testId of buttons) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  test('shows progress card', async ({ page }) => {
    await expect(page.getByTestId('progress-card')).toBeVisible()
  })
})

// ─── Quiz generation — happy path ────────────────────────────────────────────

test.describe('Quiz generation — vocabulary (Tier 1, no LLM)', () => {
  test('vocabulary button navigates to loading screen and generates quiz', async ({ page }) => {
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })

    // Tap vocabulary — fastest exercise type (algorithmic, no LLM call, <200ms)
    await page.getByTestId('vocabulary-quiz-button').click()

    // Loading screen must appear
    await expect(page.getByTestId('quiz-loading-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('loading-spinner')).toBeVisible()

    // Loading screen must eventually transition to the play screen
    // Vocabulary uses Tier 1 (algorithmic) so generation is very fast
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 30000 })
  })

  test('first question is rendered with content', async ({ page }) => {
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('vocabulary-quiz-button').click()
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 30000 })

    // Question card and answer options must be rendered
    await expect(page.getByTestId('quiz-question-card')).toBeVisible()
    await expect(page.getByTestId('answer-option-grid')).toBeVisible()

    // Progress indicator shows "1 / N"
    await expect(page.getByTestId('quiz-progress')).toBeVisible()
    await expect(page.getByTestId('quiz-progress')).toContainText('1')
  })
})

test.describe('Quiz generation — grammar (Tier 2, single LLM call)', () => {
  test('grammar button generates quiz within reasonable time', async ({ page }) => {
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('grammar-quiz-button').click()
    await expect(page.getByTestId('quiz-loading-screen')).toBeVisible({ timeout: 5000 })

    // Tier 2 (single LLM call): allow up to 30s
    await expect(page.getByTestId('quiz-play-screen')).toBeVisible({ timeout: 30000 })
    await expect(page.getByTestId('quiz-question-card')).toBeVisible()
  })
})

// ─── Quiz generation — error states ──────────────────────────────────────────

test.describe('Quiz generation — error and cancel states', () => {
  test('cancel button on loading screen returns to chapter detail', async ({ page }) => {
    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })

    // Start generation — use grammar (slower LLM call, gives us time to cancel)
    await page.getByTestId('grammar-quiz-button').click()
    await expect(page.getByTestId('loading-spinner')).toBeVisible({ timeout: 5000 })

    // Cancel immediately
    await page.getByTestId('cancel-button').click()

    // Must navigate back to chapter detail
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })
  })

  test('error state shows retry and back buttons when API is unreachable', async ({
    page,
    network,
  }) => {
    // Stub the quiz generation endpoint to return a 500
    await network.stub('POST', '**/api/quizzes/generate', { detail: 'Internal Server Error' }, { status: 500 })

    await page.goto(`/quiz/${CHAPTER_ID}?bookId=${BOOK_ID}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('chapter-detail-screen')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('grammar-quiz-button').click()

    // Error state must appear (the network stub makes it fail fast)
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('retry-button')).toBeVisible()
    await expect(page.getByTestId('back-button')).toBeVisible()
  })
})
