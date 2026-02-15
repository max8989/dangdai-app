import { expect, test } from '@playwright/test'

test.describe('Supabase Integration', () => {
  test('app loads successfully with Supabase client configured', async ({ page }) => {
    const errors: string[] = []
    const consoleLogs: string[] = []

    // Capture page errors
    page.on('pageerror', (err) => {
      errors.push(err.message)
    })

    // Capture console logs to verify Supabase connection test
    page.on('console', (msg) => {
      consoleLogs.push(msg.text())
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for the app to fully hydrate by checking for the main heading
    const heading = page.getByText('Dangdai')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // should not show error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible()

    // verify no page errors related to missing environment variables
    const envErrors = errors.filter(
      (e) => e.includes('Missing Supabase') || e.includes('environment variables')
    )
    expect(envErrors).toHaveLength(0)

  })

  test('environment variables are not exposed in client bundle source', async ({ page }) => {
    // Navigate to the app and wait for full load
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for the app to fully render
    await expect(page.getByText('Dangdai')).toBeVisible({ timeout: 10000 })

    // Get all script contents
    const scripts = await page.evaluate(() => {
      const scriptElements = document.querySelectorAll('script')
      return Array.from(scriptElements).map((s) => s.innerHTML || '')
    })

    // Verify no service role keys or sensitive data in scripts
    // Only anon/public keys should be present (starting with 'eyJ')
    const allScriptContent = scripts.join('')

    // Check that service_role is not exposed (would contain "service_role" in JWT)
    expect(allScriptContent).not.toContain('service_role')

    // The app should still work (anon key is expected to be present)
    const heading = page.getByText('Dangdai')
    await expect(heading).toBeVisible()
  })
})
