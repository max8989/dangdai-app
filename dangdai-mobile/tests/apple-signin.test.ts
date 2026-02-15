import { expect, test } from '@playwright/test'

test.describe('Apple Sign-In (Web Platform)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login screen
    await page.goto('/(auth)/login', { waitUntil: 'networkidle' })
  })

  test('Apple Sign-In button is NOT displayed on web platform (AC #2)', async ({ page }) => {
    // Wait for the login screen to load
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Verify the regular Sign In button is visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()

    // Apple Sign-In button should NOT be visible on web (only shows on iOS per AC #2)
    // The native AppleAuthenticationButton uses role="button" with specific text
    // But since Platform.OS !== 'ios' on web, the entire section including
    // "or continue with" divider should not be rendered
    await expect(page.getByText('or continue with')).not.toBeVisible()

    // Double-check: no Apple-related text should appear
    await expect(page.getByText(/sign.*apple/i)).not.toBeVisible()
  })

  test('login form works normally without Apple Sign-In on web', async ({ page }) => {
    // Wait for the login screen to load
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Verify email/password form is fully functional
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible()

    // Fill in valid form data
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('testpassword123')

    // Verify the Sign In button is enabled
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeEnabled()
  })
})
