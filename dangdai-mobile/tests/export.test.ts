import { expect, test } from '@playwright/test'

test('static export hydrates without Missing theme error', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  // Navigate to the login page (root redirects unauthenticated users to login)
  await page.goto('/(auth)/login', { waitUntil: 'networkidle' })

  // Wait for client hydration by checking for the Sign In heading
  const heading = page.getByRole('heading', { name: 'Sign In' })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // should not show the error boundary
  await expect(page.getByText('Something went wrong')).not.toBeVisible()
  await expect(page.getByText('Missing theme')).not.toBeVisible()

  // verify no page errors related to missing theme
  const themeErrors = errors.filter((e) => e.includes('Missing theme'))
  expect(themeErrors).toHaveLength(0)

  // verify themed styles are applied (not unstyled)
  const color = await heading.evaluate((el) => window.getComputedStyle(el).color)
  expect(color).toBeTruthy()
  expect(color).not.toBe('')
})
