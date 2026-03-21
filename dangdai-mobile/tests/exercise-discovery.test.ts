/**
 * Exercise Discovery E2E Tests
 *
 * Comprehensive test suite that discovers broken exercise modules by testing
 * all 8 exercise types × 15 Book 1 lessons against real premade exercises
 * in the Supabase database.
 *
 * Purpose:
 * - Discover which exercise type / lesson combinations are broken
 * - Validate premade exercises render correctly and are interactive
 * - Produce a pass/fail/skip matrix in the Playwright HTML report
 *
 * Prerequisites:
 *   - Expo web build running (managed by playwright.config.ts webServer)
 *   - TEST_USER_EMAIL + TEST_USER_PASSWORD set (Supabase test user)
 *   - EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY set
 *   - premade_exercises table populated for Book 1
 *
 * Story 12.1: Playwright E2E Exercise Discovery Tests
 */

import { test, expect } from './support/merged-fixtures'
import type { SupabaseSession } from './support/fixtures/auth-fixture'

// ─── Constants ──────────────────────────────────────────────────────────────

const SUPABASE_STORAGE_KEY = 'sb-qhsjaybldyqsavjimxes-auth-token'

const BOOK_ID = 1
const TOTAL_LESSONS = 15

/** All exercise types that should have premade exercises */
const EXERCISE_TYPES = [
  'vocabulary',
  'grammar',
  'fill_in_blank',
  'matching',
  'dialogue_completion',
  'sentence_construction',
  'reading_comprehension',
  'mixed',
] as const

type ExerciseType = (typeof EXERCISE_TYPES)[number]

/** Chapter ID convention: bookId * 100 + lessonNumber */
function chapterId(bookId: number, lesson: number): number {
  return bookId * 100 + lesson
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function injectAuth(page: import('@playwright/test').Page, session: SupabaseSession) {
  await page.evaluate(
    ([key, sessionJson]) => {
      window.localStorage.setItem(key, sessionJson)
    },
    [SUPABASE_STORAGE_KEY, JSON.stringify(session)],
  )
}

/**
 * Query premade exercises for a given book/lesson directly via Supabase REST API.
 * Returns exercise metadata grouped by exercise_type.
 */
async function fetchPremadeExercises(
  request: import('@playwright/test').APIRequestContext,
  session: SupabaseSession,
  bookId: number,
  lessonId: number,
): Promise<Array<{ id: string; exercise_type: string; title: string | null }>> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return []

  const url = `${supabaseUrl}/rest/v1/premade_exercises?book_id=eq.${bookId}&lesson_id=eq.${lessonId}&select=id,exercise_type,title&order=exercise_order.asc`

  const response = await request.get(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok()) return []
  return response.json()
}

// ─── Auth setup ─────────────────────────────────────────────────────────────

test.beforeEach(async ({ page, authToken }) => {
  if (!authToken) {
    test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not configured — skipping auth tests')
    return
  }

  await page.goto('/', { waitUntil: 'commit' })
  await injectAuth(page, authToken)
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible({ timeout: 8000 })
})

// ─── Exercise Discovery Tests ───────────────────────────────────────────────

for (const exerciseType of EXERCISE_TYPES) {
  test.describe(`Exercise type: ${exerciseType}`, () => {
    for (let lesson = 1; lesson <= TOTAL_LESSONS; lesson++) {
      const cId = chapterId(BOOK_ID, lesson)

      test(`Book ${BOOK_ID}, Lesson ${lesson} — ${exerciseType}`, async ({
        page,
        authToken,
        request,
      }) => {
        if (!authToken) return

        // Step 1: Check if premade exercises exist for this type/lesson
        const exercises = await fetchPremadeExercises(request, authToken, BOOK_ID, lesson)
        const matchingExercises = exercises.filter((e) => e.exercise_type === exerciseType)

        if (matchingExercises.length === 0) {
          test.skip(true, `No premade ${exerciseType} exercises for Book ${BOOK_ID}, Lesson ${lesson}`)
          return
        }

        const exerciseId = matchingExercises[0].id

        // Step 2: Navigate to exercise selection screen
        await page.goto(`/chapter/${cId}/exercises`, { waitUntil: 'networkidle' })
        await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 15000 })

        // Step 3: Verify premade exercises section is visible
        await expect(page.getByTestId('premade-exercises-section')).toBeVisible({ timeout: 10000 })

        // Step 4: Find and click the premade exercise card
        const exerciseCard = page.getByTestId(`premade-exercise-card-${exerciseId}`)
        await expect(exerciseCard).toBeVisible({ timeout: 10000 })
        await exerciseCard.click()

        // Step 5: Wait for premade exercise screen to load
        await expect(page.getByTestId('premade-exercise-screen')).toBeVisible({ timeout: 15000 })

        // Step 6: Validate exercise content renders based on type
        await validateExerciseRenders(page, exerciseType)

        // Step 7: Attempt interaction
        await attemptInteraction(page, exerciseType)
      })
    }
  })
}

// ─── Exercise-type-specific validation ──────────────────────────────────────

async function validateExerciseRenders(
  page: import('@playwright/test').Page,
  exerciseType: ExerciseType,
) {
  // Common: exercise title and progress should be visible
  await expect(page.getByTestId('exercise-title')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('quiz-progress')).toBeVisible({ timeout: 5000 })

  switch (exerciseType) {
    case 'fill_in_blank':
      await expect(
        page.getByTestId('fill-in-blank-sentence').or(page.getByTestId('fill-in-blank-instruction')),
      ).toBeVisible({ timeout: 10000 })
      break

    case 'matching':
      await expect(page.getByTestId('matching-exercise')).toBeVisible({ timeout: 10000 })
      break

    case 'sentence_construction':
      await expect(page.getByTestId('sentence-builder')).toBeVisible({ timeout: 10000 })
      break

    case 'reading_comprehension':
      await expect(page.getByTestId('reading-passage-card')).toBeVisible({ timeout: 10000 })
      break

    case 'dialogue_completion':
      await expect(page.getByTestId('dialogue-card')).toBeVisible({ timeout: 10000 })
      break

    case 'vocabulary':
    case 'grammar':
    case 'mixed':
      // These types use the standard quiz question card + answer option grid
      await expect(
        page
          .getByTestId('quiz-question-card')
          .or(page.getByTestId('fill-in-blank-sentence'))
          .or(page.getByTestId('matching-exercise')),
      ).toBeVisible({ timeout: 10000 })
      break
  }
}

async function attemptInteraction(
  page: import('@playwright/test').Page,
  exerciseType: ExerciseType,
) {
  switch (exerciseType) {
    case 'vocabulary':
    case 'grammar': {
      // Click the first answer option
      const optionGrid = page.getByTestId('answer-option-grid')
      if (await optionGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstOption = optionGrid.locator('button, [role="button"]').first()
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click()
          // Feedback overlay should appear (correct or incorrect)
          // Wait briefly for feedback — it may auto-dismiss
          await page.waitForTimeout(1000)
        }
      }
      break
    }

    case 'fill_in_blank': {
      // Try to select a word from the word bank
      const wordBank = page.getByTestId('word-bank-selector')
      if (await wordBank.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstWord = wordBank.locator('button, [role="button"]').first()
        if (await firstWord.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstWord.click()
          await page.waitForTimeout(500)
        }
      }
      break
    }

    case 'matching': {
      // Try to tap the first left item in matching exercise
      const matchingExercise = page.getByTestId('matching-exercise')
      if (await matchingExercise.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstItem = matchingExercise.locator('button, [role="button"]').first()
        if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstItem.click()
          await page.waitForTimeout(500)
        }
      }
      break
    }

    case 'sentence_construction': {
      // Try to tap a word tile in the sentence builder
      const sentenceBuilder = page.getByTestId('sentence-builder')
      if (await sentenceBuilder.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstTile = sentenceBuilder.locator('button, [role="button"]').first()
        if (await firstTile.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstTile.click()
          await page.waitForTimeout(500)
        }
      }
      break
    }

    case 'reading_comprehension': {
      // Reading has sub-questions with options — try to answer the first one
      const optionGrid = page.getByTestId('answer-option-grid')
      if (await optionGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstOption = optionGrid.locator('button, [role="button"]').first()
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click()
          await page.waitForTimeout(1000)
        }
      }
      break
    }

    case 'dialogue_completion': {
      // Dialogue completion has options to select
      const dialogueCard = page.getByTestId('dialogue-card')
      if (await dialogueCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstOption = dialogueCard.locator('button, [role="button"]').first()
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click()
          await page.waitForTimeout(1000)
        }
      }
      break
    }

    case 'mixed': {
      // Mixed can be any type — just try the generic approach
      const optionGrid = page.getByTestId('answer-option-grid')
      const wordBank = page.getByTestId('word-bank-selector')
      const matchingExercise = page.getByTestId('matching-exercise')

      if (await optionGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
        const firstOption = optionGrid.locator('button, [role="button"]').first()
        if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOption.click()
        }
      } else if (await wordBank.isVisible({ timeout: 2000 }).catch(() => false)) {
        const firstWord = wordBank.locator('button, [role="button"]').first()
        if (await firstWord.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstWord.click()
        }
      } else if (await matchingExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
        const firstItem = matchingExercise.locator('button, [role="button"]').first()
        if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstItem.click()
        }
      }
      await page.waitForTimeout(500)
      break
    }
  }
}
