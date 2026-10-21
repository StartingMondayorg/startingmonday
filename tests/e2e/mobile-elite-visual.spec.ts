import { test, expect, type Page } from '@playwright/test'

type RouteSpec = {
  slug: string
  path: string
  authRequired?: boolean
}

const ELITE_ROUTES: RouteSpec[] = [
  { slug: 'home', path: '/' },
  { slug: 'pricing', path: '/pricing' },
  { slug: 'dashboard-home', path: '/dashboard', authRequired: true },
  { slug: 'dashboard-companies-new', path: '/dashboard/companies/new', authRequired: true },
  { slug: 'dashboard-admin-intelligence', path: '/dashboard/admin/intelligence', authRequired: true },
]

const ROUTE_MAX_DIFF_RATIO: Record<string, number> = {
  home: 0.05,
  pricing: 0.05,
  'dashboard-admin-intelligence': 0.05,
}

async function skipIfAuthUnavailable(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping auth-required mobile visual test: login session unavailable in CI')
}

async function waitForPricingPageReady(page: Page) {
  await expect(page.getByText('Loading pricing plans...')).toBeHidden({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Monthly' })).toBeVisible({ timeout: 10_000 })
}

test.describe('Mobile elite visual gate @mobile @visual @elite', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Mobile elite visual suite only runs on mobile projects')

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    })
  })

  for (const route of ELITE_ROUTES) {
    test(`${route.slug} elite visual baseline`, async ({ page }, testInfo) => {
      test.slow()
      if (route.authRequired) await skipIfAuthUnavailable(page)

      await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      if (route.slug === 'pricing') {
        await waitForPricingPageReady(page)
      }
      await page.waitForTimeout(300)

      const screenshotName = `elite-${route.slug}-${testInfo.project.name}.png`
      const maxDiffPixelRatio = ROUTE_MAX_DIFF_RATIO[route.slug] ?? 0.03
      await expect(page).toHaveScreenshot(screenshotName, {
        fullPage: false,
        animations: 'disabled',
        maxDiffPixelRatio,
      })
    })
  }

  test('discover recommendation detail elite baseline', async ({ page }, testInfo) => {
    test.slow()
    await skipIfAuthUnavailable(page)

    await page.goto('/dashboard/companies/new', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.getByRole('button', { name: 'Suggest from my profile' }).click()
    await page.locator('[data-testid="discover-suggestions"] a[href^="/dashboard/discover/recommendation/"], [data-testid="discover-suggestions"] p').first().waitFor({ timeout: 60_000 }).catch(() => {})
    const firstNarrative = page.locator('a[href^="/dashboard/discover/recommendation/"]').first()
    test.skip((await firstNarrative.count()) === 0, 'Skipping recommendation detail visual test: no recommendation links found')

    await firstNarrative.click()
    await page.waitForTimeout(300)

    const screenshotName = `elite-discover-recommendation-detail-${testInfo.project.name}.png`
    await expect(page).toHaveScreenshot(screenshotName, {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: 0.03,
    })
  })
})
