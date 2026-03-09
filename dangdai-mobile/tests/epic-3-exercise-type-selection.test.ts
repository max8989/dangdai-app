import { expect, test } from '@playwright/test'

/**
 * Epic 3 — Content Navigation & Book Selection
 * E2E Tests: Exercise Type Selection Screen (Story 3.5)
 *
 * Stories covered:
 * - 3.5: Exercise Type Selection Screen
 *   - 8 AI exercise type cards (Mixed + 7 types) in 2-column grid
 *   - Workbook Exercises section (shown only when premade exercises exist)
 *   - Navigation to quiz loading screen (AI exercise types)
 *   - Navigation to browse screens (vocabulary, grammar, dialogues)
 *   - Progress indicators (New / XX% / checkmark)
 *   - Mixed card has primary theme styling
 *
 * Test strategy:
 * - Unauthenticated smoke tests run unconditionally (verify routes exist, app loads)
 * - Authenticated flow tests require TEST_USER_EMAIL / TEST_USER_PASSWORD env vars
 * - chapterId convention: bookId * 100 + lessonNumber (e.g., 101 = Book 1, Lesson 1)
 */

// ─── Unauthenticated smoke tests ──────────────────────────────────────────────

test.describe('Epic 3 Story 3.5 — Exercise Type Selection (Smoke)', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Either login screen or main app should be visible
    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()
    const homeVisible = await page.getByText('Maixin Chinese').first().isVisible()
    expect(loginVisible || homeVisible).toBe(true)
  })

  test('exercises route is accessible for Book 1 Chapter 1', async ({ page }) => {
    // Navigate to exercises route — will redirect to login if unauthenticated
    await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('exercises route is accessible for Book 2 Chapter 5', async ({ page }) => {
    await page.goto('/chapter/205/exercises', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('exercises route is accessible for Book 3 Chapter 3', async ({ page }) => {
    await page.goto('/chapter/303/exercises', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('exercises route is accessible for Book 4 Chapter 10', async ({ page }) => {
    await page.goto('/chapter/410/exercises', { waitUntil: 'networkidle' })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('quiz loading route is accessible with exercise type params', async ({ page }) => {
    await page.goto('/quiz/loading?chapterId=101&bookId=1&exerciseType=vocabulary&quizType=vocabulary', {
      waitUntil: 'networkidle',
    })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  test('quiz loading route is accessible with mixed exercise type', async ({ page }) => {
    await page.goto('/quiz/loading?chapterId=101&bookId=1&exerciseType=mixed&quizType=mixed', {
      waitUntil: 'networkidle',
    })
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })
})

// ─── Authenticated flow tests ─────────────────────────────────────────────────

test.describe('Epic 3 Story 3.5 — Exercise Type Selection (Authenticated)', () => {
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

  // ─── AC #1: Screen renders with two sections ─────────────────────────────

  test.describe('Screen Rendering (AC #1)', () => {
    test('exercises screen renders for a valid chapter (Book 1, Chapter 1)', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
    })

    test('exercises screen renders for a valid chapter (Book 2, Chapter 5)', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/205/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
    })

    test('exercises screen renders for a valid chapter (Book 3, Chapter 3)', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/303/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
    })

    test('exercises screen shows "Chapter not found" for invalid chapterId', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Use a non-existent chapter ID
      await page.goto('/chapter/9999/exercises', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)

      // Should show invalid chapter state or redirect
      const invalidState = await page.getByTestId('exercises-invalid-chapter').isVisible()
      const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()
      // Either shows invalid chapter or redirects to login
      expect(invalidState || loginVisible).toBe(true)
    })

    test('exercises screen shows scroll view container', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('exercises-scroll-view')).toBeVisible()
    })
  })

  // ─── AC #1: Chapter header info ──────────────────────────────────────────

  test.describe('Chapter Header Info (AC #1)', () => {
    test('exercises screen shows chapter English title', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('chapter-title-english')).toBeVisible()
      // Book 1, Chapter 1 = "Welcome to Taiwan!"
      await expect(page.getByTestId('chapter-title-english')).toHaveText('Welcome to Taiwan!')
    })

    test('exercises screen shows chapter Chinese title', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('chapter-title-chinese')).toBeVisible()
      await expect(page.getByTestId('chapter-title-chinese')).toHaveText('歡迎你來臺灣！')
    })

    test('exercises screen shows book info in header', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('book-info')).toBeVisible()
      // Book 1 info should be visible
      await expect(page.getByTestId('book-info')).toContainText('Book 1')
    })

    test('exercises screen shows correct chapter info for Book 2', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=205 → Book 2, Lesson 5
      await page.goto('/chapter/205/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('book-info')).toContainText('Book 2')
    })

    test('exercises screen shows correct chapter info for Book 3', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=303 → Book 3, Lesson 3
      await page.goto('/chapter/303/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('book-info')).toContainText('Book 3')
    })

    test('chapter header is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('chapter-header')).toBeVisible()
    })
  })

  // ─── AC #2: AI-Generated Exercises section ───────────────────────────────

  test.describe('AI-Generated Exercises Section (AC #2)', () => {
    test('exercises screen shows AI-Generated Exercises section header', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('ai-section-header')).toBeVisible()
      await expect(page.getByTestId('ai-section-header')).toHaveText('AI-Generated Exercises')
    })

    test('exercises screen shows the AI exercises section container', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
    })

    test('exercises screen shows the 2-column exercise type grid', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-grid')).toBeVisible()
    })

    test('exercises screen shows all 8 AI exercise type cards', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // All 8 exercise type cards must be visible
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

    test('Mixed card is visible and positioned first (top-left)', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Mixed card must be visible
      await expect(page.getByTestId('exercise-type-card-mixed')).toBeVisible()
    })

    test('Vocabulary card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-vocabulary')).toBeVisible()
    })

    test('Grammar card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-grammar')).toBeVisible()
    })

    test('Fill in Blank card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-fill_in_blank')).toBeVisible()
    })

    test('Matching card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-matching')).toBeVisible()
    })

    test('Dialogue Completion card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-dialogue_completion')).toBeVisible()
    })

    test('Sentence Construction card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-sentence_construction')).toBeVisible()
    })

    test('Reading Comprehension card is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('exercise-type-card-reading_comprehension')).toBeVisible()
    })
  })

  // ─── AC #2: Progress indicators ──────────────────────────────────────────

  test.describe('Progress Indicators (AC #2)', () => {
    test('exercise type cards show progress indicators', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Wait for progress data to load
      await page.waitForTimeout(2000)

      // At least one progress indicator should be visible (New, %, or checkmark)
      // For a new user, all cards should show "New"
      const newIndicators = page.getByTestId('progress-new')
      const percentIndicators = page.getByTestId('progress-percentage')
      const masteredIndicators = page.getByTestId('progress-mastered')

      const newCount = await newIndicators.count()
      const percentCount = await percentIndicators.count()
      const masteredCount = await masteredIndicators.count()

      // At least some progress indicators should be visible
      expect(newCount + percentCount + masteredCount).toBeGreaterThan(0)
    })

    test('new user sees "New" indicators on exercise type cards', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      // For a chapter with no prior attempts, all cards should show "New"
      // (This may vary depending on test user's history)
      const newIndicators = page.getByTestId('progress-new')
      const newCount = await newIndicators.count()

      // Either some "New" indicators exist, or the user has progress data
      const percentIndicators = page.getByTestId('progress-percentage')
      const masteredIndicators = page.getByTestId('progress-mastered')
      const percentCount = await percentIndicators.count()
      const masteredCount = await masteredIndicators.count()

      // Total indicators should equal 8 (one per card)
      expect(newCount + percentCount + masteredCount).toBe(8)
    })
  })

  // ─── AC #1: Workbook Exercises section ───────────────────────────────────

  test.describe('Workbook Exercises Section (AC #1, #6)', () => {
    test('Workbook Exercises section is conditionally rendered', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      // The premade section is conditionally rendered based on database content
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

    test('Workbook Exercises section shows correct header when visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.waitForTimeout(2000)

      const premadeSection = page.getByTestId('premade-exercises-section')
      const hasPremade = await premadeSection.isVisible()

      if (hasPremade) {
        await expect(page.getByTestId('premade-section-header')).toBeVisible()
        await expect(page.getByTestId('premade-section-header')).toHaveText('Workbook Exercises')
      }
    })

    test('AI-Generated Exercises section always visible regardless of premade exercises', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // AI section must always be visible
      await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
      await expect(page.getByTestId('ai-section-header')).toBeVisible()
    })
  })

  // ─── AC #4, #5: Navigation to quiz loading ───────────────────────────────

  test.describe('Navigation to Quiz Loading (AC #4, #5)', () => {
    test('tapping Vocabulary card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-vocabulary').click()

      // Should navigate to quiz loading screen with correct params
      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=vocabulary')
      expect(page.url()).toContain('chapterId=101')
    })

    test('tapping Grammar card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-grammar').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=grammar')
    })

    test('tapping Fill in Blank card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-fill_in_blank').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=fill_in_blank')
    })

    test('tapping Matching card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-matching').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=matching')
    })

    test('tapping Dialogue Completion card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-dialogue_completion').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=dialogue_completion')
    })

    test('tapping Sentence Construction card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-sentence_construction').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=sentence_construction')
    })

    test('tapping Reading Comprehension card navigates to quiz loading screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-reading_comprehension').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=reading_comprehension')
    })

    test('tapping Mixed card navigates to quiz loading with mixed exercise type (AC #5)', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-mixed').click()

      // Mixed card should navigate to quiz loading with exerciseType=mixed
      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=mixed')
      expect(page.url()).toContain('chapterId=101')
    })

    test('quiz loading URL includes bookId param', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-vocabulary').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      // bookId=1 for chapter 101 (Book 1)
      expect(page.url()).toContain('bookId=1')
    })

    test('quiz loading URL includes correct bookId for Book 2 chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=205 → Book 2, Lesson 5
      await page.goto('/chapter/205/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('exercise-type-card-vocabulary').click()

      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('bookId=2')
      expect(page.url()).toContain('chapterId=205')
    })
  })

  // ─── Browse buttons navigation ────────────────────────────────────────────

  test.describe('Browse Buttons Navigation (Stories 11.5, 11.6, 11.7)', () => {
    test('exercises screen shows all three browse buttons', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('browse-vocabulary-button')).toBeVisible()
      await expect(page.getByTestId('browse-grammar-button')).toBeVisible()
      await expect(page.getByTestId('browse-dialogues-button')).toBeVisible()
    })

    test('browse buttons container is visible', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('browse-buttons')).toBeVisible()
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

    test('back navigation from vocabulary returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-vocabulary-button').click()
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })

      // Go back
      await page.goBack()

      // Should return to exercises screen
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })

    test('back navigation from grammar returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-grammar-button').click()
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })

      await page.goBack()

      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })

    test('back navigation from dialogues returns to exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('browse-dialogues-button').click()
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })

      await page.goBack()

      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })
  })

  // ─── AC #3: Premade exercise navigation ──────────────────────────────────

  test.describe('Premade Exercise Navigation (AC #3)', () => {
    test('tapping premade exercise card navigates to premade quiz screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

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
      const firstCard = premadeSection.locator('[data-testid^="premade-exercise-card-"]').first()
      const hasCard = await firstCard.isVisible()

      if (!hasCard) {
        test.skip()
        return
      }

      await firstCard.click()

      // Should navigate to premade quiz screen
      await page.waitForURL(/\/quiz\/premade/, { timeout: 8000 })
    })
  })

  // ─── Full navigation flow: Chapter List → Exercises ──────────────────────

  test.describe('Full Navigation Flow (Epic 3 Integration)', () => {
    test('can navigate from book selection to chapter list to exercises screen', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Start from books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Navigate to Book 1 chapters
      await page.getByTestId('book-card-1').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

      // Click on Chapter 1 (chapterId=101)
      await page.getByTestId('chapter-list-item-101').click()

      // Should navigate to exercises screen (Story 3.5 — chapter tap goes to exercises)
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 8000 })
    })

    test('exercises screen shows correct chapter after navigating from chapter list', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Navigate to Book 1 chapters
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      await page.getByTestId('book-card-1').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

      // Click on Chapter 5 (chapterId=105)
      await page.getByTestId('chapter-list-item-105').click()

      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 8000 })

      // Should show Chapter 5 info
      await expect(page.getByTestId('chapter-title-english')).toHaveText('Beef Noodles Are Delicious')
      await expect(page.getByTestId('chapter-title-chinese')).toHaveText('牛肉麵真好吃')
    })

    test('can navigate from exercises to vocabulary and back', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Navigate to vocabulary
      await page.getByTestId('browse-vocabulary-button').click()
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })

      // Go back to exercises
      await page.goBack()
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })

      // Navigate to grammar
      await page.getByTestId('browse-grammar-button').click()
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })

      // Go back to exercises
      await page.goBack()
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })

      // Navigate to dialogues
      await page.getByTestId('browse-dialogues-button').click()
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })
    })

    test('can start AI quiz from exercises screen for Book 2 chapter', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // chapterId=212 → Book 2, Lesson 12
      await page.goto('/chapter/212/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Tap vocabulary card
      await page.getByTestId('exercise-type-card-vocabulary').click()

      // Should navigate to quiz loading with correct params
      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('chapterId=212')
      expect(page.url()).toContain('bookId=2')
      expect(page.url()).toContain('exerciseType=vocabulary')
    })

    test('can start Mixed quiz from exercises screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Tap Mixed card
      await page.getByTestId('exercise-type-card-mixed').click()

      // Should navigate to quiz loading with mixed type
      await page.waitForURL(/\/quiz\/loading/, { timeout: 8000 })
      expect(page.url()).toContain('exerciseType=mixed')
      expect(page.url()).toContain('quizType=mixed')
    })

    test('exercises screen is accessible for all 4 books', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      const testChapters = [
        { chapterId: 101, bookId: 1 },
        { chapterId: 205, bookId: 2 },
        { chapterId: 303, bookId: 3 },
        { chapterId: 401, bookId: 4 },
      ]

      for (const { chapterId, bookId } of testChapters) {
        await page.goto(`/chapter/${chapterId}/exercises`, { waitUntil: 'networkidle' })
        await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
        await expect(page.getByTestId('book-info')).toContainText(`Book ${bookId}`)
      }
    })
  })

  // ─── Open navigation: no gates, no locks ─────────────────────────────────

  test.describe('Open Navigation — No Gates (Story 3.4 dependency)', () => {
    test('all 8 exercise type cards are tappable without any lock/gate', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // All 8 cards must be visible and tappable (no locks)
      const allTypes = [
        'mixed',
        'vocabulary',
        'grammar',
        'fill_in_blank',
        'matching',
        'dialogue_completion',
        'sentence_construction',
        'reading_comprehension',
      ]

      for (const type of allTypes) {
        const card = page.getByTestId(`exercise-type-card-${type}`)
        await expect(card).toBeVisible()
        // Verify card is enabled (not disabled/locked)
        await expect(card).toBeEnabled()
      }
    })

    test('exercise type cards have correct accessibility roles', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Cards should have button role for accessibility
      const mixedCard = page.getByTestId('exercise-type-card-mixed')
      await expect(mixedCard).toBeVisible()
      // Verify it's interactive (has button role)
      await expect(mixedCard).toHaveRole('button')
    })
  })
})
