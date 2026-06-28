/**
 * T26 — Visual regression: screenshot comparisons for key UI screens
 *
 * Run with:  pnpm --filter @mcpforge/web test:visual
 * Update:    pnpm --filter @mcpforge/web test:visual --update-snapshots
 *
 * Requires `next dev` running at http://localhost:4301 AND a seeded API at http://localhost:4300.
 * In CI this runs against docker-compose up (see .github/workflows/ci.yml job: visual).
 */
import { test, expect, type Page } from '@playwright/test'

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4301'
const MOCK_TOKEN = process.env['E2E_JWT_TOKEN'] ?? ''

async function injectAuth(page: Page): Promise<void> {
  // Write a mock auth state to localStorage before navigating
  await page.addInitScript((token: string) => {
    if (token) {
      localStorage.setItem(
        'mcpforge-auth',
        JSON.stringify({ state: { token, user: { sub: 'e2e-user', wsid: 'ws-e2e', role: 'owner' } } }),
      )
    }
  }, MOCK_TOKEN)
}

test.describe('Visual regression — public pages', () => {
  test('landing page matches snapshot', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('landing.png', { fullPage: true })
  })

  test('login page matches snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('login.png', { fullPage: true })
  })
})

test.describe('Visual regression — authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page)
  })

  test('dashboard layout matches snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    // Mask dynamic timestamps to stabilize snapshot
    await page.evaluate(() => {
      document.querySelectorAll('time, [data-testid="timestamp"]').forEach((el) => {
        ;(el as HTMLElement).innerText = '—'
      })
    })
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true })
  })

  test('create wizard step 1 matches snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/runs/new`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('create-step-1.png')
  })

  test('gallery page matches snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('gallery.png', { fullPage: true })
  })

  test('settings page matches snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true })
  })
})
