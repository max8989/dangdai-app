import { expect, test } from '@playwright/test'

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signup screen
    await page.goto('/(auth)/signup', { waitUntil: 'networkidle' })
  })

  test('signup screen renders with all required elements', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Start your Chinese learning journey')).toBeVisible()

    // Verify form elements are present - use nth(1) to get visible signup form's elements
    // (login form is hidden with index 0)
    await expect(page.getByPlaceholder('your@email.com').nth(1)).toBeVisible()
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible()
    await expect(page.getByPlaceholder('Re-enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
    await expect(page.getByText('Already have an account? Sign In')).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter invalid email (use .nth(1) for signup form's visible email input)
    const emailInput = page.getByPlaceholder('your@email.com').nth(1)
    await emailInput.fill('invalidemail')
    await emailInput.blur()

    // Should show validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible()
  })

  test('shows validation error for short password', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter short password
    const passwordInput = page.getByPlaceholder('At least 8 characters')
    await passwordInput.fill('short')
    await passwordInput.blur()

    // Should show validation error
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('accepts password at exactly 8 characters (boundary test)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter password with exactly 8 characters
    const passwordInput = page.getByPlaceholder('At least 8 characters')
    await passwordInput.fill('exactly8')
    await passwordInput.blur()

    // Should NOT show validation error for exactly 8 chars
    await expect(page.getByText('Password must be at least 8 characters')).not.toBeVisible()
  })

  test('shows validation error for 7 character password (boundary test)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter password with exactly 7 characters
    const passwordInput = page.getByPlaceholder('At least 8 characters')
    await passwordInput.fill('seven77')
    await passwordInput.blur()

    // Should show validation error for 7 chars
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('shows validation error when passwords do not match', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter mismatched passwords
    const passwordInput = page.getByPlaceholder('At least 8 characters')
    await passwordInput.fill('validpassword123')

    const confirmInput = page.getByPlaceholder('Re-enter your password')
    await confirmInput.fill('differentpassword')
    await confirmInput.blur()

    // Should show validation error
    await expect(page.getByText("Passwords don't match")).toBeVisible()
  })

  test('shows all validation errors when submitting empty form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Click sign up without filling form
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Should show all validation errors
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    await expect(page.getByText('Please confirm your password')).toBeVisible()
  })

  test('clears validation errors when user corrects input', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Enter invalid email (use .nth(1) for signup form's visible email input)
    const emailInput = page.getByPlaceholder('your@email.com').nth(1)
    await emailInput.fill('invalid')
    await emailInput.blur()

    // Should show validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible()

    // Correct the email
    await emailInput.fill('valid@email.com')

    // Error should be cleared
    await expect(page.getByText('Please enter a valid email')).not.toBeVisible()
  })

  test('navigates to login screen when clicking sign in link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Click on sign in link
    await page.getByText('Already have an account? Sign In').click()

    // Should navigate to login screen (check for heading specifically)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })
  })

  test('form accepts valid input and attempts submission', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })

    // Fill in valid form data (use .nth(1) for signup form's visible email input)
    await page.getByPlaceholder('your@email.com').nth(1).fill('test@example.com')
    await page.getByPlaceholder('At least 8 characters').fill('testpassword123')
    await page.getByPlaceholder('Re-enter your password').fill('testpassword123')

    // Verify no validation errors are shown for valid input
    await expect(page.getByText('Please enter a valid email')).not.toBeVisible()
    await expect(page.getByText('Password must be at least 8 characters')).not.toBeVisible()
    await expect(page.getByText("Passwords don't match")).not.toBeVisible()

    // The Sign Up button should be enabled and clickable
    const signUpButton = page.getByRole('button', { name: 'Sign Up' })
    await expect(signUpButton).toBeEnabled()

    // Click to submit - the actual Supabase response will determine outcome
    // This test verifies the form validation passes and submission is attempted
    await signUpButton.click()

    // After clicking, either:
    // 1. Network error shows general error message
    // 2. Supabase responds with success/error
    // 3. Loading state briefly appears
    // We just verify the form was submitted (no client-side validation errors blocking it)
  })
})
