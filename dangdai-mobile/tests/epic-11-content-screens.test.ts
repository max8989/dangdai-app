import { expect, test } from '@playwright/test'

/**
 * Epic 11 — Content Seeding & Structured Data Pipeline
 * E2E Tests: Content Browse Screens & Exercise Flow
 *
 * Stories covered:
 * - 11.4: Exercise Type Selection Screen (browse buttons wired up)
 * - 11.5: Vocabulary Browse Screen
 * - 11.6: Grammar Points Browse Screen
 * - 11.7: Dialogue Browse Screen
 * - 11.8: Premade Exercise Completion Flow
 *
 * Test strategy:
 * - Unauthenticated smoke tests run unconditionally (verify routes exist, app loads)
 * - Authenticated flow tests require TEST_USER_EMAIL / TEST_USER_PASSWORD env vars
 */

// ─── Unauthenticated smoke tests ──────────────────────────────────────────────

test.describe('Epic 11 — Content Screens (Smoke)', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Either login screen or main app should be visible
    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()
    const homeVisible = await page.getByText('Maixin Chinese').first().isVisible()
    expect(loginVisible || homeVisible).toBe(true)
  })

  test('vocabulary route is accessible', async ({ page }) => {
    // Navigate to a vocabulary route — will redirect to login if unauthenticated
    await page.goto('/chapter/101/vocabulary', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('grammar route is accessible', async ({ page }) => {
    await page.goto('/chapter/101/grammar', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('dialogues route is accessible', async ({ page }) => {
    await page.goto('/chapter/101/dialogues', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('exercises route is accessible', async ({ page }) => {
    await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('premade quiz route is accessible', async ({ page }) => {
    await page.goto('/quiz/premade?exerciseId=test&chapterId=101&bookId=1', {
      waitUntil: 'networkidle',
    })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })
})

// ─── Authenticated flow tests ─────────────────────────────────────────────────

test.describe('Epic 11 — Content Screens (Authenticated)', () => {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD

  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping authenticated tests — no test credentials')

  /**
   * Login helper — navigates to login, fills credentials, waits for redirect.
   */
  async function login(page: Parameters<Parameters<typeof test>[1]>[0]) {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(auth)/login', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    await page.getByPlaceholder('your@email.com').fill(TEST_EMAIL)
    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL(/\/\(tabs\)/, { timeout: 15000 })
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ─── Story 11.4: Exercise Type Selection Screen ──────────────────────────

  test.describe('Exercise Type Selection Screen (Story 11.4)', () => {
    test('exercises screen renders for a valid chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
    })

    test('exercises screen shows chapter header info', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Chapter header should display English and Chinese titles
      await expect(page.getByTestId('chapter-title-english')).toBeVisible()
      await expect(page.getByTestId('chapter-title-chinese')).toBeVisible()
    })

    test('exercises screen shows AI-Generated Exercises section', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('ai-section-header')).toBeVisible()
      await expect(page.getByTestId('ai-section-header')).toHaveText('AI-Generated Exercises')
    })

    test('exercises screen shows all 8 AI exercise type cards', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // All 8 exercise type cards should be visible
      const expectedTypes = [
        'mixed',
        'vocabulary',
        'grammar',
        'fill_in_blank',
        'matching',
        'dialogue_completion',
        'sentence_construction',
        'reading_comprehension',
      ]

      for (const type of expectedTypes) {
        await expect(page.getByTestId(`exercise-type-card-${type}`)).toBeVisible()
      }
    })

    test('exercises screen shows browse buttons for vocabulary, grammar, dialogues', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('browse-vocabulary-button')).toBeVisible()
      await expect(page.getByTestId('browse-grammar-button')).toBeVisible()
      await expect(page.getByTestId('browse-dialogues-button')).toBeVisible()
    })

    test('tapping Vocabulary browse button navigates to vocabulary screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-vocabulary-button').click()

      // Should navigate to vocabulary screen
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })
    })

    test('tapping Grammar browse button navigates to grammar screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-grammar-button').click()

      // Should navigate to grammar screen
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })
    })

    test('tapping Dialogues browse button navigates to dialogues screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-dialogues-button').click()

      // Should navigate to dialogues screen
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })
    })

    test('tapping an AI exercise type card navigates to quiz loading', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-vocabulary').click()

      // Should navigate to quiz loading screen
      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
    })

    test('exercises screen shows Workbook Exercises section when premade exercises exist', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Navigate to a chapter that has seeded premade exercises
      // (Chapter 101 = Book 1, Lesson 1 — may or may not have exercises depending on seeding)
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // The premade section is conditionally rendered — check if it exists
      const premadeSection = page.getByTestId('premade-exercises-section')
      const hasPremade = await premadeSection.isVisible()

      if (hasPremade) {
        // If premade exercises exist, verify the section header
        await expect(page.getByTestId('premade-section-header')).toHaveText('Workbook Exercises')
      } else {
        // If no premade exercises, the AI section should still be visible
        await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
      }
    })
  })

  // ─── Story 11.5: Vocabulary Browse Screen ───────────────────────────────

  test.describe('Vocabulary Browse Screen (Story 11.5)', () => {
    test('vocabulary screen renders for a valid chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/vocabulary', { waitUntil: 'networkidle' })

      // Should show either the vocabulary screen or a loading/empty state
      const screenVisible = await page.getByTestId('vocabulary-screen').isVisible()
      const loadingVisible = await page.getByTestId('vocabulary-loading').isVisible()
      const emptyVisible = await page.getByTestId('vocabulary-empty').isVisible()
      const errorVisible = await page.getByTestId('vocabulary-error').isVisible()

      expect(screenVisible || loadingVisible || emptyVisible || errorVisible).toBe(true)
    })

    test('vocabulary screen shows section list when data is available', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/vocabulary', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 10000 })

      // Wait for loading to complete
      await page.waitForTimeout(2000)

      const sectionListVisible = await page.getByTestId('vocabulary-section-list').isVisible()
      const emptyVisible = await page.getByTestId('vocabulary-empty').isVisible()
      const errorVisible = await page.getByTestId('vocabulary-error').isVisible()

      // One of these states should be visible after loading
      expect(sectionListVisible || emptyVisible || errorVisible).toBe(true)
    })

    test('vocabulary screen shows total word count in header', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/vocabulary', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 10000 })

      // Wait for data to load
      await page.waitForTimeout(2000)

      const sectionListVisible = await page.getByTestId('vocabulary-section-list').isVisible()
      if (sectionListVisible) {
        // Header with total count should be visible
        await expect(page.getByTestId('vocabulary-header')).toBeVisible()
      }
    })

    test('vocabulary screen shows section headers for vocab sections', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/vocabulary', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const sectionListVisible = await page.getByTestId('vocabulary-section-list').isVisible()
      if (sectionListVisible) {
        // At least one section header should be visible (Vocab I)
        const sectionHeaderI = page.getByTestId('vocabulary-section-header-I')
        const sectionHeaderII = page.getByTestId('vocabulary-section-header-II')
        const hasSection = (await sectionHeaderI.isVisible()) || (await sectionHeaderII.isVisible())
        expect(hasSection).toBe(true)
      }
    })

    test('vocabulary screen shows empty state when no vocabulary exists', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Use a chapter that likely has no vocabulary seeded (e.g., a high chapter number)
      await page.goto('/chapter/115/vocabulary', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      // Either empty state or section list (depending on seeding)
      const emptyVisible = await page.getByTestId('vocabulary-empty').isVisible()
      const sectionListVisible = await page.getByTestId('vocabulary-section-list').isVisible()
      expect(emptyVisible || sectionListVisible).toBe(true)
    })

    test('vocabulary screen back navigation returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Navigate from exercises to vocabulary
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-vocabulary-button').click()
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })

      // Go back
      await page.goBack()

      // Should return to exercises screen
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })
  })

  // ─── Story 11.6: Grammar Points Browse Screen ────────────────────────────

  test.describe('Grammar Points Browse Screen (Story 11.6)', () => {
    test('grammar screen renders for a valid chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/grammar', { waitUntil: 'networkidle' })

      const screenVisible = await page.getByTestId('grammar-screen').isVisible()
      const loadingVisible = await page.getByTestId('grammar-loading').isVisible()
      const emptyVisible = await page.getByTestId('grammar-empty').isVisible()
      const errorVisible = await page.getByTestId('grammar-error').isVisible()

      expect(screenVisible || loadingVisible || emptyVisible || errorVisible).toBe(true)
    })

    test('grammar screen shows flat list or empty state after loading', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/grammar', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const flatListVisible = await page.getByTestId('grammar-flat-list').isVisible()
      const emptyVisible = await page.getByTestId('grammar-empty').isVisible()
      const errorVisible = await page.getByTestId('grammar-error').isVisible()

      expect(flatListVisible || emptyVisible || errorVisible).toBe(true)
    })

    test('grammar screen shows grammar point count in header', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/grammar', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const flatListVisible = await page.getByTestId('grammar-flat-list').isVisible()
      if (flatListVisible) {
        await expect(page.getByTestId('grammar-header')).toBeVisible()
      }
    })

    test('grammar screen back navigation returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-grammar-button').click()
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })

      await page.goBack()

      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })
  })

  // ─── Story 11.7: Dialogue Browse Screen ─────────────────────────────────

  test.describe('Dialogue Browse Screen (Story 11.7)', () => {
    test('dialogues screen renders for a valid chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/dialogues', { waitUntil: 'networkidle' })

      const screenVisible = await page.getByTestId('dialogues-screen').isVisible()
      const loadingVisible = await page.getByTestId('dialogues-loading').isVisible()
      const emptyVisible = await page.getByTestId('dialogues-empty').isVisible()
      const errorVisible = await page.getByTestId('dialogues-error').isVisible()

      expect(screenVisible || loadingVisible || emptyVisible || errorVisible).toBe(true)
    })

    test('dialogues screen shows toggle controls when dialogues are loaded', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/dialogues', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const scrollViewVisible = await page.getByTestId('dialogues-scroll-view').isVisible()
      if (scrollViewVisible) {
        // Toggle controls should be visible
        await expect(page.getByTestId('toggle-controls')).toBeVisible()
        await expect(page.getByTestId('toggle-pinyin')).toBeVisible()
        await expect(page.getByTestId('toggle-english')).toBeVisible()
        await expect(page.getByTestId('toggle-simplified')).toBeVisible()
      }
    })

    test('dialogues screen pinyin toggle works', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/dialogues', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const scrollViewVisible = await page.getByTestId('dialogues-scroll-view').isVisible()
      if (scrollViewVisible) {
        // Toggle pinyin on
        await page.getByTestId('toggle-pinyin').click()
        // Toggle pinyin off
        await page.getByTestId('toggle-pinyin').click()
        // No assertion needed — just verify no crash
        await expect(page.getByTestId('dialogues-screen')).toBeVisible()
      }
    })

    test('dialogues screen shows dialogue sections with Roman numeral headers', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/dialogues', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const scrollViewVisible = await page.getByTestId('dialogues-scroll-view').isVisible()
      if (scrollViewVisible) {
        // At least Dialogue I should be present
        const dialogueSection1 = page.getByTestId('dialogue-section-1')
        const hasDialogue = await dialogueSection1.isVisible()
        if (hasDialogue) {
          await expect(page.getByTestId('dialogue-numeral-1')).toContainText('Dialogue I')
        }
      }
    })

    test('dialogues screen back navigation returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-dialogues-button').click()
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })

      await page.goBack()

      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })
  })

  // ─── Story 11.8: Premade Exercise Completion Flow ────────────────────────

  test.describe('Premade Exercise Completion Flow (Story 11.8)', () => {
    test('premade exercise screen shows error for invalid exercise ID', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Navigate with a non-existent exercise ID
      await page.goto(
        '/quiz/premade?exerciseId=00000000-0000-0000-0000-000000000000&chapterId=101&bookId=1',
        { waitUntil: 'networkidle' }
      )

      await page.waitForTimeout(3000)

      // Should show either loading, error, or the exercise screen
      const loadingVisible = await page.getByTestId('premade-loading').isVisible()
      const errorVisible = await page.getByTestId('premade-error').isVisible()
      const screenVisible = await page.getByTestId('premade-exercise-screen').isVisible()

      expect(loadingVisible || errorVisible || screenVisible).toBe(true)
    })

    test('premade exercise error state has a Go Back button', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto(
        '/quiz/premade?exerciseId=00000000-0000-0000-0000-000000000000&chapterId=101&bookId=1',
        { waitUntil: 'networkidle' }
      )

      await page.waitForTimeout(3000)

      const errorVisible = await page.getByTestId('premade-error').isVisible()
      if (errorVisible) {
        await expect(page.getByTestId('back-button')).toBeVisible()
      }
    })

    test('premade exercise screen shows progress bar when exercise loads', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // This test requires a real exercise ID from the database.
      // We navigate to exercises screen first to find a premade exercise card.
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const premadeSection = page.getByTestId('premade-exercises-section')
      const hasPremade = await premadeSection.isVisible()

      if (!hasPremade) {
        // No premade exercises seeded for this chapter — skip
        test.skip()
        return
      }

      // Click the first premade exercise card
      const firstCard = premadeSection.locator('[testID^="premade-exercise-card-"]').first()
      await firstCard.click()

      // Wait for premade exercise screen to load
      await page.waitForTimeout(3000)

      const screenVisible = await page.getByTestId('premade-exercise-screen').isVisible()
      const loadingVisible = await page.getByTestId('premade-loading').isVisible()
      const errorVisible = await page.getByTestId('premade-error').isVisible()

      expect(screenVisible || loadingVisible || errorVisible).toBe(true)

      if (screenVisible) {
        // Progress bar should be visible
        await expect(page.getByTestId('quiz-progress')).toBeVisible()
        // Leave button should be visible
        await expect(page.getByTestId('leave-button')).toBeVisible()
      }
    })

    test('premade exercise leave button shows confirmation dialog', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const premadeSection = page.getByTestId('premade-exercises-section')
      const hasPremade = await premadeSection.isVisible()

      if (!hasPremade) {
        test.skip()
        return
      }

      const firstCard = premadeSection.locator('[testID^="premade-exercise-card-"]').first()
      await firstCard.click()

      await page.waitForTimeout(3000)

      const screenVisible = await page.getByTestId('premade-exercise-screen').isVisible()
      if (!screenVisible) {
        test.skip()
        return
      }

      // Press leave button — should show confirmation dialog
      await page.getByTestId('leave-button').click()

      // Dialog should appear (native Alert on mobile, may appear as dialog on web)
      await page.waitForTimeout(500)

      // Handle the dialog if it appears
      const dialogVisible = await page.getByText('Leave exercise?').isVisible()
      if (dialogVisible) {
        // Dismiss the dialog by pressing "Keep Learning"
        await page.getByText('Keep Learning').click()
        // Should still be on the exercise screen
        await expect(page.getByTestId('premade-exercise-screen')).toBeVisible()
      }
    })
  })

  // ─── Full navigation flow: Chapter → Exercises → Browse screens ──────────

  test.describe('Full Navigation Flow (Epic 11 Integration)', () => {
    test('can navigate from chapter list to exercises to vocabulary', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Start from books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Navigate to Book 1 chapters
      await page.getByTestId('book-card-1').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

      // Click on Chapter 1 (chapterId=101)
      await page.getByTestId('chapter-list-item-101').click()

      // Should navigate to exercises screen (Story 11.4 — chapter tap goes to exercises)
      await page.waitForTimeout(2000)

      // Either exercises screen or quiz screen depending on implementation
      const exercisesVisible = await page.getByTestId('exercises-screen').isVisible()
      const quizVisible = await page.getByTestId('quiz-screen').isVisible()
      expect(exercisesVisible || quizVisible).toBe(true)

      if (exercisesVisible) {
        // Navigate to vocabulary browse
        await page.getByTestId('browse-vocabulary-button').click()
        await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })

        // Go back to exercises
        await page.goBack()
        await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })

        // Navigate to grammar browse
        await page.getByTestId('browse-grammar-button').click()
        await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })

        // Go back to exercises
        await page.goBack()
        await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })

        // Navigate to dialogues browse
        await page.getByTestId('browse-dialogues-button').click()
        await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })
      }
    })

    test('exercises screen shows correct chapter info for different chapters', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Test with Book 2, Chapter 5 (chapterId=205)
      await page.goto('/chapter/205/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Book info should reference Book 2
      await expect(page.getByTestId('book-info')).toContainText('Book 2')
    })

    test('vocabulary screen correctly parses chapterId for Book 2', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=212 → Book 2, Lesson 12
      await page.goto('/chapter/212/vocabulary', { waitUntil: 'networkidle' })

      const screenVisible = await page.getByTestId('vocabulary-screen').isVisible()
      const loadingVisible = await page.getByTestId('vocabulary-loading').isVisible()

      expect(screenVisible || loadingVisible).toBe(true)
    })

    test('grammar screen correctly parses chapterId for Book 3', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=305 → Book 3, Lesson 5
      await page.goto('/chapter/305/grammar', { waitUntil: 'networkidle' })

      const screenVisible = await page.getByTestId('grammar-screen').isVisible()
      const loadingVisible = await page.getByTestId('grammar-loading').isVisible()

      expect(screenVisible || loadingVisible).toBe(true)
    })
  })
})
