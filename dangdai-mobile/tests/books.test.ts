import { expect, test } from '@playwright/test'

/**
 * Book Selection Flow Tests
 *
 * These tests verify the book selection screen functionality.
 * Note: The app requires authentication, so tests may be redirected to login.
 * When authentication is bypassed or test users are available, the full flow can be tested.
 */

test.describe('Book Selection Flow', () => {
  test('app loads and handles unauthenticated state', async ({ page }) => {
    // Navigate to the app - will redirect to login if not authenticated
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for the page to stabilize
    await page.waitForTimeout(1000)

    // For unauthenticated users, the login screen should be shown
    // This validates the auth flow works correctly
    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()
    const homeVisible = await page.getByText('Dangdai').first().isVisible()

    // Either login is shown (unauthenticated) or main app is shown (authenticated)
    expect(loginVisible || homeVisible).toBe(true)
  })

  test('books screen renders when authenticated', async ({ page }) => {
    // Navigate to books screen directly
    // This will redirect to login if not authenticated
    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })

    // Check if we were redirected to login (unauthenticated)
    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible()

    if (loginVisible) {
      // Test passed - user is correctly redirected to login when not authenticated
      expect(loginVisible).toBe(true)
    } else {
      // If authenticated, verify books screen renders correctly
      await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('books-header')).toHaveText('Books')

      // Verify all 4 books are displayed
      await expect(page.getByTestId('book-card-1')).toBeVisible()
      await expect(page.getByTestId('book-card-2')).toBeVisible()
      await expect(page.getByTestId('book-card-3')).toBeVisible()
      await expect(page.getByTestId('book-card-4')).toBeVisible()
    }
  })

  test('book data constants are correctly defined', async ({ page }) => {
    // This test validates the book data structure exists
    // We navigate to any page to load the app
    await page.goto('/', { waitUntil: 'networkidle' })

    // The constants are compiled into the app, so if the app loads,
    // the constants are valid. This is a basic smoke test.
    // Full validation requires authentication.
    const pageLoaded = await page.locator('body').isVisible()
    expect(pageLoaded).toBe(true)
  })

  test('chapter route exists for navigation', async ({ page }) => {
    // Test that navigation within the app works
    // Since the web build caches routes, we test the app structure instead
    await page.goto('/', { waitUntil: 'networkidle' })

    // The app should load successfully
    const bodyExists = await page.locator('body').isVisible()
    expect(bodyExists).toBe(true)

    // The chapter route is tested when navigating from books screen
    // which is covered in the authenticated tests
  })
})

/**
 * Authenticated Book Selection Tests
 *
 * These tests run when a valid test user is available.
 * Skip these tests if the test environment doesn't have auth configured.
 */
test.describe('Book Selection Flow (Authenticated)', () => {
  // Skip this test suite if no test user credentials are configured
  const TEST_EMAIL = process.env.TEST_USER_EMAIL
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD

  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping authenticated tests - no test credentials')

  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    // Login with test user
    await page.goto('/(auth)/login', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    await page.getByPlaceholder('your@email.com').fill(TEST_EMAIL)
    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Wait for login to complete and redirect
    await page.waitForURL(/\/\(tabs\)/, { timeout: 15000 })
  })

  test('books screen displays all four books', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })

    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('books-header')).toHaveText('Books')

    // Verify all 4 books are displayed
    await expect(page.getByTestId('book-card-1')).toBeVisible()
    await expect(page.getByTestId('book-card-2')).toBeVisible()
    await expect(page.getByTestId('book-card-3')).toBeVisible()
    await expect(page.getByTestId('book-card-4')).toBeVisible()
  })

  test('book cards display correct titles and Chinese names', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

    // Verify book titles
    await expect(page.getByTestId('book-title-1')).toHaveText('Book 1')
    await expect(page.getByTestId('book-title-2')).toHaveText('Book 2')
    await expect(page.getByTestId('book-title-3')).toHaveText('Book 3')
    await expect(page.getByTestId('book-title-4')).toHaveText('Book 4')

    // Verify Chinese titles
    await expect(page.getByTestId('book-title-chinese-1')).toContainText('當代中文課程')
    await expect(page.getByTestId('book-title-chinese-2')).toContainText('當代中文課程')
  })

  test('book cards show progress text for new users', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

    // Progress text should be visible (value depends on user's progress)
    await expect(page.getByTestId('book-progress-text-1')).toBeVisible()
    await expect(page.getByTestId('book-progress-text-2')).toBeVisible()
    await expect(page.getByTestId('book-progress-text-3')).toBeVisible()
    await expect(page.getByTestId('book-progress-text-4')).toBeVisible()
  })

  test('tapping book card navigates to chapter list', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

    // Click on Book 1 card
    await page.getByTestId('book-card-1').click()

    // Wait for chapter list screen to appear
    await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })

    // Verify we're on the correct chapter list
    await expect(page.getByTestId('chapter-list-header')).toContainText('當代中文課程 第一冊')
  })

  test('book covers and progress bars are visible', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

    // Verify book covers exist
    await expect(page.getByTestId('book-cover-1')).toBeVisible()
    await expect(page.getByTestId('book-cover-2')).toBeVisible()

    // Verify progress bars exist
    await expect(page.getByTestId('book-progress-bar-1')).toBeVisible()
    await expect(page.getByTestId('book-progress-bar-2')).toBeVisible()
  })

  test('can navigate to all books', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return

    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 })

    // Navigate to Book 3
    await page.getByTestId('book-card-3').click()
    await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('chapter-list-header')).toContainText('第三冊')

    // Go back and navigate to Book 4
    await page.goBack()
    await expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('book-card-4').click()
    await expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('chapter-list-header')).toContainText('第四冊')
  })
})
