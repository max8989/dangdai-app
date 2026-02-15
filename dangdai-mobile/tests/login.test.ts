import { expect, test } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login screen
    await page.goto('/(auth)/login', { waitUntil: 'networkidle' })
  })

  test('login screen renders with all required elements', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Welcome back to your Chinese learning journey')).toBeVisible()

    // Verify form elements are present
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible()
    await expect(page.getByText('Forgot Password?')).toBeVisible()
  })

  test('shows validation error for invalid email format', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Enter invalid email
    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.fill('invalidemail')
    await emailInput.blur()

    // Should show validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible()
  })

  test('shows all validation errors when submitting empty form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Click sign in without filling form
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should show all validation errors
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('clears validation errors when user corrects input', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Enter invalid email
    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.fill('invalid')
    await emailInput.blur()

    // Should show validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible()

    // Correct the email
    await emailInput.fill('valid@email.com')

    // Error should be cleared
    await expect(page.getByText('Please enter a valid email')).not.toBeVisible()
  })

  test('navigates to signup screen when clicking sign up link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Click on sign up link
    await page.getByText("Don't have an account? Sign Up").click()

    // Should navigate to signup screen
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 10000 })
  })

  test('form accepts valid input and attempts submission', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Fill in valid form data
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('testpassword123')

    // Verify no validation errors are shown for valid input
    await expect(page.getByText('Please enter a valid email')).not.toBeVisible()
    await expect(page.getByText('Email is required')).not.toBeVisible()
    await expect(page.getByText('Password is required')).not.toBeVisible()

    // The Sign In button should be enabled and clickable
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeEnabled()

    // Click to submit - the actual Supabase response will determine outcome
    // This test verifies the form validation passes and submission is attempted
    await signInButton.click()

    // After clicking, either:
    // 1. Network error shows general error message
    // 2. Supabase responds with success/error (invalid credentials)
    // 3. Loading state briefly appears
    // We just verify the form was submitted (no client-side validation errors blocking it)
  })

  test('shows error message for invalid credentials', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 })

    // Fill in form with fake credentials
    await page.getByPlaceholder('your@email.com').fill('nonexistent@example.com')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')

    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should show generic invalid credentials error (not revealing which field is wrong)
    // Wait a bit longer for the network request to complete
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 15000 })
  })
})
