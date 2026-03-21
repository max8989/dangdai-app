/**
 * Auth fixture for Playwright tests.
 *
 * Provides the full Supabase session object via API-only authentication (no
 * browser login flow required). The session includes access_token,
 * refresh_token, user, and expiry fields — everything needed to inject a
 * valid session into localStorage so the Supabase client treats the browser
 * as already logged in.
 *
 * Usage:
 *   import { test, expect } from '../support/merged-fixtures'
 *   test('protected page', async ({ page, authToken }) => {
 *     // authToken is the full session object — use .access_token for headers
 *     await page.setExtraHTTPHeaders({ Authorization: `Bearer ${authToken.access_token}` })
 *     ...
 *   })
 */
import { test as base } from '@playwright/test'

/** Shape returned by Supabase /auth/v1/token — the full session. */
export type SupabaseSession = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at: number
  user: Record<string, unknown>
}

export type AuthFixtures = {
  /** Full Supabase session for the test user. Null if TEST_USER_EMAIL/PASSWORD not set. */
  authToken: SupabaseSession | null
}

export const test = base.extend<AuthFixtures>({
  authToken: async ({ request }, use) => {
    const email = process.env.TEST_USER_EMAIL
    const password = process.env.TEST_USER_PASSWORD
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

    if (!email || !password || !supabaseUrl || !supabaseAnonKey) {
      // Not configured — yield null so tests that don't need auth still pass
      await use(null)
      return
    }

    const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      data: { email, password },
    })

    if (!response.ok()) {
      throw new Error(
        `Auth fixture: Supabase login failed ${response.status()} — check TEST_USER_EMAIL / TEST_USER_PASSWORD`,
      )
    }

    const body = await response.json()
    await use(body as SupabaseSession)
  },
})
