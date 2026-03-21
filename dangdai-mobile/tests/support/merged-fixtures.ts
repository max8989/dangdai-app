/**
 * Merged fixture entry-point for all Playwright tests.
 *
 * Import `test` and `expect` from this file instead of `@playwright/test`
 * to get access to all project fixtures in a single test signature:
 *
 *   import { test, expect } from '../support/merged-fixtures'
 *
 *   test('my test', async ({ page, authToken, network }) => { ... })
 *
 * Adding a new fixture:
 *   1. Create a new file in tests/support/fixtures/
 *   2. Export a `test` object extended from `@playwright/test` base
 *   3. Add it to the `mergeTests(...)` call below
 */
import { mergeTests, expect } from '@playwright/test'
import { test as authTest } from './fixtures/auth-fixture'
import { test as networkTest } from './fixtures/network-fixture'

export const test = mergeTests(authTest, networkTest)

export { expect }
