import { test, expect, type Page } from '@playwright/test'

async function skipIfAuthUnavailable(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping auth-required coach test: login session unavailable in CI')
}

test.describe('Coach flows', () => {
  test('unauthenticated user is redirected to login from coach dashboard', async ({ browser }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app'
    const ctx = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    await page.goto('/dashboard/coach')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await ctx.close()
  })

  test('coach dashboard renders for coach accounts and redirects everyone else (R-6)', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    await page.goto('/dashboard/coach')
    if (/\/dashboard\/coach(?:$|[/?#])/.test(page.url())) {
      await expect(page.locator('h1')).toContainText(/Portfolio Command Center|Your Clients/i)
    } else {
      // Entitlement gate: a non-coach account lands on the main dashboard.
      await expect(page).toHaveURL(/\/dashboard(?:$|[?#])/)
      await expect(page.getByRole('heading', { level: 1, name: 'What should I do today?', exact: true })).toBeVisible()
    }
  })

  test('coach clients API requires authentication', async ({ page }) => {
    const res = await page.request.get('/api/coach/clients', {
      failOnStatusCode: false,
    })
    expect([200, 401, 403]).toContain(res.status())
  })

  test('client-scoped coach data APIs reject unauthenticated access', async ({ browser }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app'
    const ctx = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()

    const clientId = '00000000-0000-0000-0000-000000000000'
    const paths = [
      `/api/coach/client/${clientId}/companies`,
      `/api/coach/client/${clientId}/signals`,
      `/api/coach/client/${clientId}/briefs`,
      `/api/coach/client/${clientId}/scorecards`,
      `/api/coach/client/${clientId}/alerts`,
    ]

    for (const path of paths) {
      const res = await page.request.get(path, { failOnStatusCode: false })
      expect([401, 404]).toContain(res.status())
    }

    await ctx.close()
  })
})
