import { defineConfig } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// Load .env.local so TEST_USER_EMAIL, TEST_USER_PASSWORD, API_URL, etc. are
// available to the Playwright process. Expo loads this file automatically for
// the app build but Playwright does not — we must do it explicitly here.
// Variables already set in the process environment take precedence (CI secrets).
loadEnv({ path: path.resolve(__dirname, '.env.local'), override: false })

const port = parseInt(process.env.PORT ?? '3838', 10)
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`
const apiPort = parseInt(process.env.API_PORT ?? '8000', 10)
const apiURL = process.env.API_URL ?? `http://localhost:${apiPort}`

export default defineConfig({
  testDir: 'tests',

  // Artifact output directory
  outputDir: 'test-results',

  // Reporters: human-readable HTML + JUnit for CI + console list
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
  ],

  // Global timeouts (TEA standards)
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,

    // Per-action and navigation timeouts
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Artifacts on failure only (saves space)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  webServer: [
    // FastAPI backend — started first so the frontend can reach it
    {
      command: `cd ../dangdai-api && .venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port ${apiPort}`,
      url: `${apiURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // Expo web build — served as static files
    {
      command: `npx expo export --platform web && npx serve dist -l ${port} --single`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],

  // Auth flows are sequential; most other tests can run in parallel per file
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  // Shard support for CI parallelism (set SHARD_INDEX + SHARD_TOTAL env vars)
  shard:
    process.env.SHARD_INDEX && process.env.SHARD_TOTAL
      ? {
          current: parseInt(process.env.SHARD_INDEX, 10),
          total: parseInt(process.env.SHARD_TOTAL, 10),
        }
      : undefined,
})
