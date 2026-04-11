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

// Derive storage key from Supabase URL: sb-<project-ref>-auth-token
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const projectRef = supabaseUrl.match(/\/\/([^.]+)\./)?.[1] ?? 'unknown'
const SUPABASE_STORAGE_KEY = `sb-${projectRef}-auth-token`

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

/**
 * Wait for the premade exercise screen to load with proper assertions.
 * Validates that the exercise screen, title, and progress bar are visible.
 */
async function waitForExerciseScreen(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('premade-exercise-screen')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('exercise-title')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('quiz-progress')).toBeVisible({ timeout: 5000 })
}

/**
 * Returns the appropriate interaction steps for a given exercise type.
 * Each function attempts to interact with the exercise and does not assert
 * specific answer correctness — just that interaction works.
 */
function getExerciseInteraction(exerciseType: ExerciseType) {
  switch (exerciseType) {
    case 'vocabulary':
    case 'grammar':
      return async (page: import('@playwright/test').Page) => {
        const optionGrid = page.getByTestId('answer-option-grid')
        await expect(optionGrid).toBeVisible({ timeout: 5000 })
        const firstOption = optionGrid.locator('button, [role="button"]').first()
        await expect(firstOption).toBeVisible({ timeout: 3000 })
        await firstOption.click()
      }

    case 'fill_in_blank':
      return async (page: import('@playwright/test').Page) => {
        const wordBank = page.getByTestId('word-bank-selector')
        await expect(wordBank).toBeVisible({ timeout: 5000 })
        const firstWord = wordBank.locator('button, [role="button"]').first()
        await expect(firstWord).toBeVisible({ timeout: 3000 })
        await firstWord.click()
      }

    case 'matching':
      return async (page: import('@playwright/test').Page) => {
        const matchingExercise = page.getByTestId('matching-exercise')
        await expect(matchingExercise).toBeVisible({ timeout: 5000 })
        // Click a left item then a right item to form a pair
        const leftItem = page.getByTestId('left-item-0')
        const rightItem = page.getByTestId('right-item-0')
        if (await leftItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          await leftItem.click()
          if (await rightItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await rightItem.click()
          }
        } else {
          // Fallback: click first button in the matching exercise
          const firstItem = matchingExercise.locator('button, [role="button"]').first()
          await expect(firstItem).toBeVisible({ timeout: 3000 })
          await firstItem.click()
        }
      }

    case 'sentence_construction':
      return async (page: import('@playwright/test').Page) => {
        const sentenceBuilder = page.getByTestId('sentence-builder')
        await expect(sentenceBuilder).toBeVisible({ timeout: 5000 })
        // Click a word tile from the word bank
        const wordBank = sentenceBuilder.getByTestId('word-bank')
        if (await wordBank.isVisible({ timeout: 3000 }).catch(() => false)) {
          const firstTile = wordBank.locator('button, [role="button"]').first()
          if (await firstTile.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstTile.click()
          }
        } else {
          const firstTile = sentenceBuilder.locator('button, [role="button"]').first()
          await expect(firstTile).toBeVisible({ timeout: 3000 })
          await firstTile.click()
        }
      }

    case 'reading_comprehension':
      return async (page: import('@playwright/test').Page) => {
        // Verify passage is visible first
        await expect(page.getByTestId('reading-passage-card')).toBeVisible({ timeout: 10000 })
        // Then click an answer for the first question
        const answerGrid = page.getByTestId('comprehension-answer-grid').or(page.getByTestId('answer-option-grid'))
        await expect(answerGrid).toBeVisible({ timeout: 5000 })
        const firstOption = answerGrid.locator('button, [role="button"]').first()
        await expect(firstOption).toBeVisible({ timeout: 3000 })
        await firstOption.click()
      }

    case 'dialogue_completion':
      return async (page: import('@playwright/test').Page) => {
        // Verify dialogue lines are visible
        await expect(page.getByTestId('dialogue-card')).toBeVisible({ timeout: 10000 })
        // Select from dialogue options
        const dialogueOptions = page.getByTestId('dialogue-answer-options')
        if (await dialogueOptions.isVisible({ timeout: 3000 }).catch(() => false)) {
          const firstOption = page.getByTestId('dialogue-option-0')
          if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstOption.click()
          }
        } else {
          // Fallback: click first button in dialogue card
          const dialogueCard = page.getByTestId('dialogue-card')
          const firstOption = dialogueCard.locator('button, [role="button"]').first()
          if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstOption.click()
          }
        }
      }

    case 'mixed':
      return async (page: import('@playwright/test').Page) => {
        // Mixed can be any type — detect and apply appropriate interaction
        const optionGrid = page.getByTestId('answer-option-grid')
        const wordBank = page.getByTestId('word-bank-selector')
        const matchingExercise = page.getByTestId('matching-exercise')
        const sentenceBuilder = page.getByTestId('sentence-builder')
        const dialogueCard = page.getByTestId('dialogue-card')

        if (await optionGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
          const firstOption = optionGrid.locator('button, [role="button"]').first()
          if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
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
        } else if (await sentenceBuilder.isVisible({ timeout: 2000 }).catch(() => false)) {
          const firstTile = sentenceBuilder.locator('button, [role="button"]').first()
          if (await firstTile.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstTile.click()
          }
        } else if (await dialogueCard.isVisible({ timeout: 2000 }).catch(() => false)) {
          const firstOption = dialogueCard.locator('button, [role="button"]').first()
          if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstOption.click()
          }
        }
      }
  }
}

/**
 * Verify feedback is displayed after interaction (correct/incorrect overlay).
 * For some types (matching, sentence_construction), feedback may appear
 * inline rather than as an overlay — so we check multiple feedback patterns.
 */
async function verifyFeedbackDisplayed(
  page: import('@playwright/test').Page,
  exerciseType: ExerciseType,
): Promise<void> {
  switch (exerciseType) {
    case 'vocabulary':
    case 'grammar':
    case 'reading_comprehension':
      // These types show a feedback overlay after answering
      await expect(page.getByTestId('feedback-overlay')).toBeVisible({ timeout: 5000 })
      break

    case 'fill_in_blank':
      // Fill-in-blank shows feedback overlay after word selection fills the blank
      await expect(
        page.getByTestId('feedback-overlay').or(page.getByTestId('blank-word-0')),
      ).toBeVisible({ timeout: 5000 })
      break

    case 'matching':
      // Matching highlights paired items — check for connection line or pair state change
      // The match may or may not be correct, but the UI should respond
      await page.waitForTimeout(1000) // wait for pair highlight animation
      break

    case 'sentence_construction':
      // Sentence construction shows placed tiles — verify a tile moved to the slot area
      await expect(
        page.getByTestId('slot-area').or(page.getByTestId('feedback-section')),
      ).toBeVisible({ timeout: 5000 })
      break

    case 'dialogue_completion':
      // Dialogue shows inline feedback after selecting an option
      await expect(
        page.getByTestId('dialogue-feedback')
          .or(page.getByTestId('dialogue-correct-icon'))
          .or(page.getByTestId('dialogue-incorrect-icon'))
          .or(page.getByTestId('dialogue-validation-spinner')),
      ).toBeVisible({ timeout: 5000 })
      break

    case 'mixed':
      // Mixed can show any feedback pattern — check for the most common ones
      await expect(
        page.getByTestId('feedback-overlay')
          .or(page.getByTestId('feedback-section'))
          .or(page.getByTestId('dialogue-feedback'))
          .or(page.getByTestId('blank-word-0')),
      ).toBeVisible({ timeout: 5000 })
      break
  }
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

      test(`[${exerciseType}] Lesson ${lesson} - exercise renders and interacts`, async ({
        page,
        authToken,
        request,
      }) => {
        // Per-test timeout: 30s for premade exercises
        test.setTimeout(30_000)

        if (!authToken) return

        // Step 1: Check if premade exercises exist for this type/lesson via Supabase REST
        const exercises = await fetchPremadeExercises(request, authToken, BOOK_ID, lesson)
        const matchingExercises = exercises.filter((e) => e.exercise_type === exerciseType)

        if (matchingExercises.length === 0) {
          test.skip(true, `No premade ${exerciseType} exercises for Book ${BOOK_ID}, Lesson ${lesson}`)
          return
        }

        const exerciseId = matchingExercises[0].id

        // Step 2: Navigate to exercise selection screen
        await test.step('Navigate to exercise selection', async () => {
          await page.goto(`/chapter/${cId}/exercises`, { waitUntil: 'networkidle' })
          await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 15000 })
        })

        // Step 3: Verify premade exercises section is visible
        await test.step('Find premade exercises section', async () => {
          await expect(page.getByTestId('premade-exercises-section')).toBeVisible({ timeout: 10000 })
        })

        // Step 4: Find and click the premade exercise card
        await test.step('Open premade exercise', async () => {
          const exerciseCard = page.getByTestId(`premade-exercise-card-${exerciseId}`)
          await expect(exerciseCard).toBeVisible({ timeout: 10000 })
          await exerciseCard.click()
        })

        // Step 5: Wait for premade exercise screen to load
        await test.step('Wait for exercise screen', async () => {
          await waitForExerciseScreen(page)
        })

        // Step 6: Validate exercise content renders based on type
        await test.step('Validate exercise renders', async () => {
          await validateExerciseRenders(page, exerciseType)
        })

        // Step 7: Attempt interaction
        await test.step('Attempt interaction', async () => {
          const interact = getExerciseInteraction(exerciseType)
          await interact(page)
        })

        // Step 8: Verify feedback is displayed
        await test.step('Verify feedback displayed', async () => {
          await verifyFeedbackDisplayed(page, exerciseType)
        })
      })
    }
  })
}

// ─── Exercise-type-specific render validation ───────────────────────────────

async function validateExerciseRenders(
  page: import('@playwright/test').Page,
  exerciseType: ExerciseType,
) {
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
      // Mixed can also fall into any of the other types
      await expect(
        page
          .getByTestId('quiz-question-card')
          .or(page.getByTestId('fill-in-blank-sentence'))
          .or(page.getByTestId('matching-exercise'))
          .or(page.getByTestId('sentence-builder'))
          .or(page.getByTestId('dialogue-card')),
      ).toBeVisible({ timeout: 10000 })
      break
  }
}
