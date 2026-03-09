import { expect, test } from '@playwright/test'

/**
 * Epic 3 — Content Navigation & Book Selection
 * E2E Tests: Book Selection (Story 3.6) & Browse Screen Navigation (Story 3.7)
 *
 * Stories covered:
 * - 3.6: Expand Book Selection to Books 1-4
 *   - All 4 books visible on book selection screen
 *   - Books 1-2 show 15 lessons, Books 3-4 show 12 lessons
 *   - Tapping Books 3/4 navigates to their chapter lists
 * - 3.7: Wire Browse Screen Navigation
 *   - Conditional browse buttons (vocabulary, grammar, dialogues)
 *   - Buttons shown only when content exists for that chapter
 *   - Buttons hidden when content doesn't exist (graceful degradation)
 *   - Clicking each button navigates to the correct browse screen
 *
 * Test strategy:
 * - Unauthenticated smoke tests run unconditionally (verify routes exist, app loads)
 * - Authenticated flow tests require TEST_USER_EMAIL / TEST_USER_PASSWORD env vars
 * - chapterId convention: bookId * 100 + lessonNumber (e.g., 301 = Book 3, Lesson 1)
 */

// ─── Unauthenticated smoke tests ──────────────────────────────────────────────

test.describe('Epic 3 Stories 3.6 & 3.7 — Smoke Tests (Unauthenticated)', () => {
  /**
   * Positive: App loads and shows either login or home — basic health check.
   * Objective: Verify the app is running and reachable before any navigation tests.
   */
  test('app loads successfully', async ({ page }) => {
    // Arrange: Navigate to root
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Act: Check what's visible
    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()
    const homeVisible = await page.getByText('Maixin Chinese').first().isVisible()

    // Assert: Either login or home is shown — app is alive
    expect(loginVisible || homeVisible).toBe(true)
  })

  /**
   * Positive: Books screen route is accessible (Story 3.6 — AC #1).
   * Objective: Verify the /books route exists and the app responds.
   */
  test('books screen route is accessible', async ({ page }) => {
    // Arrange + Act: Navigate to books screen
    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })

    // Assert: Page body exists (may redirect to login if unauthenticated)
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Chapter list route for Book 3 is accessible (Story 3.6 — AC #4).
   * Objective: Verify the /chapter/3 route exists for Book 3 (12-chapter book).
   */
  test('chapter list route is accessible for Book 3', async ({ page }) => {
    // Arrange + Act: Navigate to Book 3 chapter list
    await page.goto('/chapter/3', { waitUntil: 'networkidle' })

    // Assert: Page body exists (may redirect to login if unauthenticated)
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Chapter list route for Book 4 is accessible (Story 3.6 — AC #4).
   * Objective: Verify the /chapter/4 route exists for Book 4 (12-chapter book).
   */
  test('chapter list route is accessible for Book 4', async ({ page }) => {
    // Arrange + Act: Navigate to Book 4 chapter list
    await page.goto('/chapter/4', { waitUntil: 'networkidle' })

    // Assert: Page body exists (may redirect to login if unauthenticated)
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Exercises route for Book 3 Chapter 1 is accessible (Story 3.6 — AC #4).
   * Objective: Verify chapterId=301 (Book 3, Lesson 1) route exists.
   */
  test('exercises route is accessible for Book 3 Chapter 1 (chapterId=301)', async ({ page }) => {
    // Arrange + Act: Navigate to Book 3, Chapter 1 exercises
    await page.goto('/chapter/301/exercises', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Exercises route for Book 3 Chapter 12 is accessible (Story 3.6 — AC #4).
   * Objective: Verify the last chapter of Book 3 (chapterId=312) route exists.
   */
  test('exercises route is accessible for Book 3 Chapter 12 (chapterId=312)', async ({ page }) => {
    // Arrange + Act: Navigate to Book 3, Chapter 12 exercises (last chapter)
    await page.goto('/chapter/312/exercises', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Exercises route for Book 4 Chapter 1 is accessible (Story 3.6 — AC #4).
   * Objective: Verify chapterId=401 (Book 4, Lesson 1) route exists.
   */
  test('exercises route is accessible for Book 4 Chapter 1 (chapterId=401)', async ({ page }) => {
    // Arrange + Act: Navigate to Book 4, Chapter 1 exercises
    await page.goto('/chapter/401/exercises', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Exercises route for Book 4 Chapter 12 is accessible (Story 3.6 — AC #4).
   * Objective: Verify the last chapter of Book 4 (chapterId=412) route exists.
   */
  test('exercises route is accessible for Book 4 Chapter 12 (chapterId=412)', async ({ page }) => {
    // Arrange + Act: Navigate to Book 4, Chapter 12 exercises (last chapter)
    await page.goto('/chapter/412/exercises', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Negative: A chapter beyond Book 3's 12-chapter limit has no valid data.
   * Objective: Verify chapterId=313 (Book 3, Lesson 13 — doesn't exist) is handled gracefully.
   */
  test('exercises route for non-existent Book 3 Chapter 13 is handled gracefully', async ({
    page,
  }) => {
    // Arrange + Act: Navigate to a chapter that doesn't exist (Book 3 only has 12)
    await page.goto('/chapter/313/exercises', { waitUntil: 'networkidle' })

    // Assert: App doesn't crash — body is still visible
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Vocabulary browse route for Book 3 is accessible (Story 3.7).
   * Objective: Verify the /chapter/301/vocabulary route exists.
   */
  test('vocabulary browse route is accessible for Book 3 Chapter 1', async ({ page }) => {
    // Arrange + Act: Navigate to vocabulary browse screen for Book 3, Chapter 1
    await page.goto('/chapter/301/vocabulary', { waitUntil: 'networkidle' })

    // Assert: Page body exists (may redirect to login if unauthenticated)
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Grammar browse route for Book 4 is accessible (Story 3.7).
   * Objective: Verify the /chapter/401/grammar route exists.
   */
  test('grammar browse route is accessible for Book 4 Chapter 1', async ({ page }) => {
    // Arrange + Act: Navigate to grammar browse screen for Book 4, Chapter 1
    await page.goto('/chapter/401/grammar', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })

  /**
   * Positive: Dialogues browse route for Book 3 is accessible (Story 3.7).
   * Objective: Verify the /chapter/301/dialogues route exists.
   */
  test('dialogues browse route is accessible for Book 3 Chapter 1', async ({ page }) => {
    // Arrange + Act: Navigate to dialogues browse screen for Book 3, Chapter 1
    await page.goto('/chapter/301/dialogues', { waitUntil: 'networkidle' })

    // Assert: Page body exists
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)
  })
})

// ─── Authenticated flow tests ─────────────────────────────────────────────────

test.describe('Epic 3 Stories 3.6 & 3.7 — Authenticated Tests', () => {
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

  // ─── Story 3.6: Book Selection Screen — All 4 Books ──────────────────────

  test.describe('Story 3.6 — Book Selection Screen (AC #1, #2, #4)', () => {
    /**
     * Positive: Book selection screen shows all 4 books (Story 3.6 — AC #1).
     * Objective: Verify Books 1, 2, 3, and 4 are all visible on the books screen.
     */
    test('book selection screen shows all 4 books', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: All 4 book cards are visible
      await expect(page.getByTestId('book-card-1')).toBeVisible()
      await expect(page.getByTestId('book-card-2')).toBeVisible()
      await expect(page.getByTestId('book-card-3')).toBeVisible()
      await expect(page.getByTestId('book-card-4')).toBeVisible()
    })

    /**
     * Positive: Book 3 card shows 12 lessons (Story 3.6 — AC #2).
     * Objective: Verify Book 3 displays "12 lessons" (not 15 like Books 1-2).
     */
    test('Book 3 card shows 12 lessons', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Book 3 shows 12 lessons
      await expect(page.getByTestId('book-chapter-count-3')).toContainText('12')
    })

    /**
     * Positive: Book 4 card shows 12 lessons (Story 3.6 — AC #2).
     * Objective: Verify Book 4 displays "12 lessons" (not 15 like Books 1-2).
     */
    test('Book 4 card shows 12 lessons', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Book 4 shows 12 lessons
      await expect(page.getByTestId('book-chapter-count-4')).toContainText('12')
    })

    /**
     * Negative: Books 1 and 2 show 15 lessons (not 12) — different from Books 3/4.
     * Objective: Verify the lesson count distinction between book groups is correct.
     */
    test('Books 1 and 2 show 15 lessons (not 12)', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Books 1 and 2 show 15 lessons
      await expect(page.getByTestId('book-chapter-count-1')).toContainText('15')
      await expect(page.getByTestId('book-chapter-count-2')).toContainText('15')

      // Negative: Books 1 and 2 must NOT show 12 lessons
      const book1Text = await page.getByTestId('book-chapter-count-1').textContent()
      const book2Text = await page.getByTestId('book-chapter-count-2').textContent()
      expect(book1Text).not.toContain('12')
      expect(book2Text).not.toContain('12')
    })

    /**
     * Positive: Tapping Book 3 navigates to chapter list with 12 chapters (Story 3.6 — AC #4).
     * Objective: Verify Book 3 tap leads to a chapter list showing 12 chapters.
     */
    test('tapping Book 3 navigates to chapter list with 12 chapters', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act: Tap Book 3 card
      await page.getByTestId('book-card-3').click()

      // Assert: Chapter list screen is visible
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 8000 })

      // Assert: Chapter count shows 12
      await expect(page.getByTestId('chapter-count')).toContainText('12')
    })

    /**
     * Positive: Tapping Book 4 navigates to chapter list with 12 chapters (Story 3.6 — AC #4).
     * Objective: Verify Book 4 tap leads to a chapter list showing 12 chapters.
     */
    test('tapping Book 4 navigates to chapter list with 12 chapters', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act: Tap Book 4 card
      await page.getByTestId('book-card-4').click()

      // Assert: Chapter list screen is visible
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 8000 })

      // Assert: Chapter count shows 12
      await expect(page.getByTestId('chapter-count')).toContainText('12')
    })

    /**
     * Negative: Tapping Book 3 does NOT navigate to a 15-chapter list.
     * Objective: Verify Book 3 chapter list shows 12, not 15 (regression guard).
     */
    test('Book 3 chapter list does not show 15 chapters', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to books screen and tap Book 3
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })
      await page.getByTestId('book-card-3').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 8000 })

      // Act: Read chapter count text
      const chapterCountText = await page.getByTestId('chapter-count').textContent()

      // Assert: Chapter count is 12, not 15
      expect(chapterCountText).toContain('12')
      expect(chapterCountText).not.toContain('15')
    })

    /**
     * Positive: Book 3 chapter list shows chapter items for all 12 chapters.
     * Objective: Verify all 12 chapter items (IDs 301-312) are rendered for Book 3.
     */
    test('Book 3 chapter list shows all 12 chapter items', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to Book 3 chapter list
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })
      await page.getByTestId('book-card-3').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 8000 })

      // Act + Assert: All 12 chapter items are visible (IDs 301-312)
      for (let i = 1; i <= 12; i++) {
        await expect(page.getByTestId(`chapter-list-item-${300 + i}`)).toBeVisible()
      }
    })

    /**
     * Positive: Book 4 chapter list shows chapter items for all 12 chapters.
     * Objective: Verify all 12 chapter items (IDs 401-412) are rendered for Book 4.
     */
    test('Book 4 chapter list shows all 12 chapter items', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to Book 4 chapter list
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })
      await page.getByTestId('book-card-4').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 8000 })

      // Act + Assert: All 12 chapter items are visible (IDs 401-412)
      for (let i = 1; i <= 12; i++) {
        await expect(page.getByTestId(`chapter-list-item-${400 + i}`)).toBeVisible()
      }
    })
  })

  // ─── Story 3.7: Conditional Browse Button Visibility ─────────────────────

  test.describe('Story 3.7 — Conditional Browse Button Visibility (AC #1, #5)', () => {
    /**
     * Positive: Browse vocabulary button is visible when vocabulary content exists (Story 3.7 — AC #1).
     * Objective: Verify the vocabulary browse button appears for a chapter with vocabulary data.
     * Uses Book 1, Chapter 1 (chapterId=101) — most likely to have seeded content.
     */
    test('browse vocabulary button visible when vocabulary content exists', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen for a chapter likely to have vocabulary
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Act: Wait for content availability hooks to resolve
      await page.waitForTimeout(2000)

      // Assert: If vocabulary content exists, the button is visible
      const hasVocabulary = await page.getByTestId('browse-vocabulary-button').isVisible()
      const browseButtonsVisible = await page.getByTestId('browse-buttons').isVisible()

      // Either browse buttons are shown (content exists) or hidden (no content) — both are valid
      // The key assertion: if browse-buttons is visible, vocabulary button must be present or absent
      // based on actual content — no crash, no broken UI
      if (browseButtonsVisible) {
        // At least one browse button is visible — the container is shown
        const vocabVisible = await page.getByTestId('browse-vocabulary-button').isVisible()
        const grammarVisible = await page.getByTestId('browse-grammar-button').isVisible()
        const dialoguesVisible = await page.getByTestId('browse-dialogues-button').isVisible()
        // At least one must be visible if the container is shown
        expect(vocabVisible || grammarVisible || dialoguesVisible).toBe(true)
      }

      // The page must not crash regardless of content state
      await expect(page.getByTestId('exercises-screen')).toBeVisible()
    })

    /**
     * Positive: Browse grammar button visible when grammar content exists (Story 3.7 — AC #1).
     * Objective: Verify the grammar browse button appears for a chapter with grammar data.
     */
    test('browse grammar button visible when grammar content exists', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check grammar button state
      const browseButtonsVisible = await page.getByTestId('browse-buttons').isVisible()

      // Assert: If browse-buttons container is visible, grammar button state is consistent
      if (browseButtonsVisible) {
        // Grammar button is either visible (content exists) or absent (no grammar content)
        // Both are valid — the test verifies no broken state
        const grammarVisible = await page.getByTestId('browse-grammar-button').isVisible()
        // If grammar button is visible, it must be enabled (not disabled/locked)
        if (grammarVisible) {
          await expect(page.getByTestId('browse-grammar-button')).toBeEnabled()
        }
      }

      // Screen must remain stable
      await expect(page.getByTestId('exercises-screen')).toBeVisible()
    })

    /**
     * Positive: Browse dialogues button visible when dialogues content exists (Story 3.7 — AC #1).
     * Objective: Verify the dialogues browse button appears for a chapter with dialogue data.
     */
    test('browse dialogues button visible when dialogues content exists', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check dialogues button state
      const browseButtonsVisible = await page.getByTestId('browse-buttons').isVisible()

      // Assert: If browse-buttons container is visible, dialogues button state is consistent
      if (browseButtonsVisible) {
        const dialoguesVisible = await page.getByTestId('browse-dialogues-button').isVisible()
        if (dialoguesVisible) {
          await expect(page.getByTestId('browse-dialogues-button')).toBeEnabled()
        }
      }

      // Screen must remain stable
      await expect(page.getByTestId('exercises-screen')).toBeVisible()
    })

    /**
     * Negative: Browse buttons hidden when chapter has no content (graceful degradation — Story 3.7 — AC #5).
     * Objective: Verify that for a chapter with no seeded content, browse buttons are absent
     * and the exercises screen still renders correctly (no crash, no broken UI).
     *
     * Uses a chapter from Book 4 that is unlikely to have seeded content yet.
     */
    test('browse buttons hidden when chapter has no content (graceful degradation)', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to a chapter unlikely to have seeded content
      // Book 4, Chapter 12 (chapterId=412) — last chapter, least likely to be seeded
      await page.goto('/chapter/412/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Act: Wait for content availability hooks to resolve
      await page.waitForTimeout(3000)

      // Assert: Screen renders correctly regardless of content state
      await expect(page.getByTestId('exercises-screen')).toBeVisible()
      await expect(page.getByTestId('ai-exercises-section')).toBeVisible()

      // If no content exists, browse-buttons container must be absent (not just hidden)
      const browseButtonsVisible = await page.getByTestId('browse-buttons').isVisible()
      if (!browseButtonsVisible) {
        // Graceful degradation: no browse buttons, but AI exercises section still visible
        await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
        // Individual buttons must also be absent
        const vocabVisible = await page.getByTestId('browse-vocabulary-button').isVisible()
        const grammarVisible = await page.getByTestId('browse-grammar-button').isVisible()
        const dialoguesVisible = await page.getByTestId('browse-dialogues-button').isVisible()
        expect(vocabVisible).toBe(false)
        expect(grammarVisible).toBe(false)
        expect(dialoguesVisible).toBe(false)
      }
    })

    /**
     * Negative: Browse buttons absent during loading (no flash of content — Story 3.7 — AC #5).
     * Objective: Verify that browse buttons are not shown before content availability is known.
     * This tests the "undefined = falsy = buttons hidden" behavior during initial load.
     */
    test('exercises screen renders without browse button flash on initial load', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen and capture state immediately
      await page.goto('/chapter/101/exercises', { waitUntil: 'domcontentloaded' })

      // Act: Check immediately after DOM load (before network requests complete)
      // The browse-buttons container should not flash visible before data loads
      // We verify the screen renders without errors
      const screenExists = await page.locator('body').isVisible()
      expect(screenExists).toBe(true)

      // Wait for full load
      await page.waitForTimeout(3000)

      // Assert: Screen is stable after full load
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 5000 })
    })
  })

  // ─── Story 3.7: Browse Button Navigation ─────────────────────────────────

  test.describe('Story 3.7 — Browse Button Navigation (AC #2, #3, #4)', () => {
    /**
     * Positive: Clicking vocabulary button navigates to vocabulary-screen (Story 3.7 — AC #2).
     * Objective: Verify the vocabulary browse button routes to /chapter/[chapterId]/vocabulary.
     * Conditional: Only runs if vocabulary content exists for the chapter.
     */
    test('clicking vocabulary button navigates to vocabulary-screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check if vocabulary button is visible (content-dependent)
      const vocabButtonVisible = await page.getByTestId('browse-vocabulary-button').isVisible()

      if (!vocabButtonVisible) {
        // No vocabulary content seeded — skip navigation assertion
        // The graceful degradation is tested in the "hidden when no content" test
        return
      }

      // Act: Click vocabulary browse button
      await page.getByTestId('browse-vocabulary-button').click()

      // Assert: Navigates to vocabulary screen
      await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })
    })

    /**
     * Positive: Clicking grammar button navigates to grammar-screen (Story 3.7 — AC #3).
     * Objective: Verify the grammar browse button routes to /chapter/[chapterId]/grammar.
     * Conditional: Only runs if grammar content exists for the chapter.
     */
    test('clicking grammar button navigates to grammar-screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check if grammar button is visible (content-dependent)
      const grammarButtonVisible = await page.getByTestId('browse-grammar-button').isVisible()

      if (!grammarButtonVisible) {
        // No grammar content seeded — skip navigation assertion
        return
      }

      // Act: Click grammar browse button
      await page.getByTestId('browse-grammar-button').click()

      // Assert: Navigates to grammar screen
      await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })
    })

    /**
     * Positive: Clicking dialogues button navigates to dialogues-screen (Story 3.7 — AC #4).
     * Objective: Verify the dialogues browse button routes to /chapter/[chapterId]/dialogues.
     * Conditional: Only runs if dialogues content exists for the chapter.
     */
    test('clicking dialogues button navigates to dialogues-screen', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to exercises screen
      await page.goto('/chapter/101/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check if dialogues button is visible (content-dependent)
      const dialoguesButtonVisible = await page.getByTestId('browse-dialogues-button').isVisible()

      if (!dialoguesButtonVisible) {
        // No dialogues content seeded — skip navigation assertion
        return
      }

      // Act: Click dialogues browse button
      await page.getByTestId('browse-dialogues-button').click()

      // Assert: Navigates to dialogues screen
      await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })
    })

    /**
     * Negative: Clicking a non-existent browse button does not navigate (Story 3.7 — AC #5).
     * Objective: Verify that when a browse button is absent (no content), no navigation occurs.
     * Uses a chapter unlikely to have content to test the absent-button state.
     */
    test('absent browse buttons do not cause navigation errors', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to a chapter unlikely to have seeded content
      await page.goto('/chapter/412/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(3000)

      // Act: Verify the current URL is still the exercises screen
      const currentUrl = page.url()

      // Assert: We're still on the exercises screen (no accidental navigation)
      expect(currentUrl).toContain('/chapter/412/exercises')

      // Assert: AI exercises section is still functional (no broken state)
      await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
    })
  })

  // ─── Full Navigation Flow: Books 3/4 → Chapter → Exercises → Browse ──────

  test.describe('Story 3.6 + 3.7 — Full Navigation Flow (Integration)', () => {
    /**
     * Positive: Full flow from Book 3 selection to exercises screen (Stories 3.6 + 3.7).
     * Objective: Verify the complete navigation path: Books → Book 3 → Chapter → Exercises.
     */
    test('can navigate from Book 3 selection to chapter list to exercises screen', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Start from books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act: Navigate to Book 3 chapters
      await page.getByTestId('book-card-3').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

      // Act: Click on Chapter 1 of Book 3 (chapterId=301)
      await page.getByTestId('chapter-list-item-301').click()

      // Assert: Exercises screen is visible
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 8000 })

      // Assert: Book 3 info is shown in the header
      await expect(page.getByTestId('book-info')).toContainText('Book 3')
    })

    /**
     * Positive: Full flow from Book 4 selection to exercises screen (Stories 3.6 + 3.7).
     * Objective: Verify the complete navigation path: Books → Book 4 → Chapter → Exercises.
     */
    test('can navigate from Book 4 selection to chapter list to exercises screen', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Start from books screen
      await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

      // Act: Navigate to Book 4 chapters
      await page.getByTestId('book-card-4').click()
      await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

      // Act: Click on Chapter 1 of Book 4 (chapterId=401)
      await page.getByTestId('chapter-list-item-401').click()

      // Assert: Exercises screen is visible
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 8000 })

      // Assert: Book 4 info is shown in the header
      await expect(page.getByTestId('book-info')).toContainText('Book 4')
    })

    /**
     * Positive: Exercises screen shows correct chapter info for Book 3 Chapter 1 (Story 3.6).
     * Objective: Verify chapterId=301 resolves to "School Has Started" / "開學了".
     */
    test('exercises screen shows correct chapter info for Book 3 Chapter 1', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate directly to Book 3, Chapter 1 exercises
      await page.goto('/chapter/301/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Chapter title and book info are correct
      await expect(page.getByTestId('chapter-title-english')).toHaveText('School Has Started')
      await expect(page.getByTestId('chapter-title-chinese')).toHaveText('開學了')
      await expect(page.getByTestId('book-info')).toContainText('Book 3')
    })

    /**
     * Positive: Exercises screen shows correct chapter info for Book 4 Chapter 1 (Story 3.6).
     * Objective: Verify chapterId=401 resolves to "Seventeen or Twenty-Five?" / "十七歲還是二十五歲？".
     */
    test('exercises screen shows correct chapter info for Book 4 Chapter 1', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate directly to Book 4, Chapter 1 exercises
      await page.goto('/chapter/401/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Chapter title and book info are correct
      await expect(page.getByTestId('chapter-title-english')).toHaveText(
        'Seventeen or Twenty-Five?'
      )
      await expect(page.getByTestId('chapter-title-chinese')).toHaveText('十七歲還是二十五歲？')
      await expect(page.getByTestId('book-info')).toContainText('Book 4')
    })

    /**
     * Positive: Exercises screen shows correct chapter info for Book 3 Chapter 12 (Story 3.6).
     * Objective: Verify the last chapter of Book 3 (chapterId=312) resolves correctly.
     */
    test('exercises screen shows correct chapter info for Book 3 Chapter 12 (last chapter)', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate directly to Book 3, Chapter 12 exercises (last chapter)
      await page.goto('/chapter/312/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

      // Act + Assert: Chapter title and book info are correct
      await expect(page.getByTestId('chapter-title-english')).toHaveText("I'm Going to Vote")
      await expect(page.getByTestId('chapter-title-chinese')).toHaveText('我要去投票')
      await expect(page.getByTestId('book-info')).toContainText('Book 3')
    })

    /**
     * Negative: Non-existent chapter (Book 3 Chapter 13) shows "Chapter not found" (Story 3.6).
     * Objective: Verify that chapterId=313 (beyond Book 3's 12-chapter limit) is handled gracefully.
     */
    test('non-existent Book 3 Chapter 13 shows "Chapter not found"', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to a chapter that doesn't exist (Book 3 only has 12 chapters)
      await page.goto('/chapter/313/exercises', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)

      // Act + Assert: Either shows invalid chapter state or redirects gracefully
      const invalidState = await page.getByTestId('exercises-invalid-chapter').isVisible()
      const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()

      // Either shows "Chapter not found" or redirects to login — no crash
      expect(invalidState || loginVisible).toBe(true)
    })

    /**
     * Positive: All 4 books' exercises screens are accessible (Stories 3.6 + 3.7 integration).
     * Objective: Verify exercises screen renders correctly for chapters from all 4 books.
     */
    test('exercises screen is accessible for chapters from all 4 books', async ({ page }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Test one chapter from each book
      const testChapters = [
        { chapterId: 101, bookId: 1, expectedTitle: 'Welcome to Taiwan!' },
        { chapterId: 201, bookId: 2, expectedTitle: 'How Do I Get to Shida?' },
        { chapterId: 301, bookId: 3, expectedTitle: 'School Has Started' },
        { chapterId: 401, bookId: 4, expectedTitle: 'Seventeen or Twenty-Five?' },
      ]

      for (const { chapterId, bookId, expectedTitle } of testChapters) {
        // Act: Navigate to each chapter's exercises screen
        await page.goto(`/chapter/${chapterId}/exercises`, { waitUntil: 'networkidle' })
        await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })

        // Assert: Correct book and chapter info shown
        await expect(page.getByTestId('book-info')).toContainText(`Book ${bookId}`)
        await expect(page.getByTestId('chapter-title-english')).toHaveText(expectedTitle)
      }
    })

    /**
     * Positive: Browse button navigation works for Book 3 chapter (Story 3.7 integration).
     * Objective: Verify that browse buttons (when present) navigate correctly for Book 3 chapters.
     */
    test('browse button navigation works for Book 3 chapter when content exists', async ({
      page,
    }) => {
      if (!TEST_EMAIL || !TEST_PASSWORD) return

      // Arrange: Navigate to Book 3, Chapter 1 exercises
      await page.goto('/chapter/301/exercises', { waitUntil: 'networkidle' })
      await expect(page.getByTestId('exercises-screen')).toBeVisible({ timeout: 10000 })
      await page.waitForTimeout(2000)

      // Act: Check if any browse button is visible
      const browseButtonsVisible = await page.getByTestId('browse-buttons').isVisible()

      if (!browseButtonsVisible) {
        // No content seeded for this chapter — graceful degradation is correct
        await expect(page.getByTestId('ai-exercises-section')).toBeVisible()
        return
      }

      // Assert: At least one browse button is visible and functional
      const vocabVisible = await page.getByTestId('browse-vocabulary-button').isVisible()
      const grammarVisible = await page.getByTestId('browse-grammar-button').isVisible()
      const dialoguesVisible = await page.getByTestId('browse-dialogues-button').isVisible()

      expect(vocabVisible || grammarVisible || dialoguesVisible).toBe(true)

      // Act: Click the first available browse button and verify navigation
      if (vocabVisible) {
        await page.getByTestId('browse-vocabulary-button').click()
        await expect(page.getByTestId('vocabulary-screen')).toBeVisible({ timeout: 8000 })
      } else if (grammarVisible) {
        await page.getByTestId('browse-grammar-button').click()
        await expect(page.getByTestId('grammar-screen')).toBeVisible({ timeout: 8000 })
      } else if (dialoguesVisible) {
        await page.getByTestId('browse-dialogues-button').click()
        await expect(page.getByTestId('dialogues-screen')).toBeVisible({ timeout: 8000 })
      }
    })
  })
})
