import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testName}/{arg}{ext}',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4301',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    toHaveScreenshot: {
      // 0.2% pixel tolerance to account for anti-aliasing differences
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // When running locally, launch next dev automatically
  webServer: process.env['CI']
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:4301',
        reuseExistingServer: true,
        timeout: 30_000,
      },
})
