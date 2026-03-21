/**
 * Network fixture — lightweight route interception helper.
 *
 * Wraps page.route() with automatic cleanup and a simple stub/spy API.
 * Tracks all intercepted routes and clears them after each test.
 *
 * Usage:
 *   import { test, expect } from '../support/merged-fixtures'
 *
 *   test('quiz loaded', async ({ page, network }) => {
 *     await network.stub('POST', '** /functions/v1/generate-quiz', { questions: [] })
 *     await page.goto('/(tabs)/quiz')
 *   })
 * @see https://playwright.dev/docs/network
 */
import type { Page, Route } from '@playwright/test'
import { test as base } from '@playwright/test'

type StubOptions = {
  status?: number
  headers?: Record<string, string>
}

export type NetworkFixture = {
  /** Stub a route — fulfills with the given JSON body. */
  stub: (method: string, urlPattern: string, body: unknown, options?: StubOptions) => Promise<void>
  /** Spy on a route — lets it pass through but records calls. Returns a promise resolving to the request. */
  spy: (urlPattern: string) => Promise<{ url: string; method: string; body: unknown }>
}

async function createNetwork(page: Page): Promise<NetworkFixture> {
  const registeredRoutes: string[] = []

  const stub = async (
    method: string,
    urlPattern: string,
    body: unknown,
    { status = 200, headers = {} }: StubOptions = {},
  ) => {
    registeredRoutes.push(urlPattern)
    await page.route(urlPattern, (route: Route) => {
      if (route.request().method() === method.toUpperCase()) {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(body),
          headers,
        })
      } else {
        route.continue()
      }
    })
  }

  const spy = (urlPattern: string): Promise<{ url: string; method: string; body: unknown }> => {
    registeredRoutes.push(urlPattern)
    return new Promise((resolve) => {
      page.route(urlPattern, async (route: Route) => {
        const req = route.request()
        let parsedBody: unknown = null
        try {
          parsedBody = JSON.parse(req.postData() ?? 'null')
        } catch {
          parsedBody = req.postData()
        }
        resolve({ url: req.url(), method: req.method(), body: parsedBody })
        await route.continue()
      })
    })
  }

  return { stub, spy }
}

export const test = base.extend<{ network: NetworkFixture }>({
  network: async ({ page }, use) => {
    const network = await createNetwork(page)
    await use(network)
    // Cleanup: unroute all patterns registered during test
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  },
})
