import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const flagEnabled = process.env.NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED === 'true'

async function requireFlaggedDashboard(page: Page) {
  test.skip(!flagEnabled, 'Flagged dashboard parity runs only when the rollout flag is explicitly enabled.')
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Authenticated dashboard session is required.')
  await expect(page.getByRole('heading', { name: 'What should I do today?', exact: true })).toBeVisible()
}

async function expectThreeZoneContracts(page: Page) {
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('[data-first-mile-section="dashboard_next_move"]')).toHaveCount(1)
  await expect(page.locator('[data-first-mile-section="dashboard_companies"]')).toHaveCount(1)
  await expect(page.locator('[data-first-mile-section="dashboard_this_week"]')).toHaveCount(1)
  await expect(page.locator('header').first().getByRole('link', { name: 'Progress', exact: true })).toBeVisible()
  await expect(page.locator('header').first().getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()

  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/inferred\s+penalt(?:y|ies)/i)
  expect(text).not.toMatch(/score:\s*\d+\/100/i)
  expect(text).not.toMatch(/has been\s+\d+\s+days/i)

  const axe = await new AxeBuilder({ page }).analyze()
  const seriousOrCritical = axe.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(seriousOrCritical).toEqual([])
}

test.describe('flagged three-zone dashboard parity', () => {
  test('desktop preserves dashboard contracts', async ({ page }) => {
    await requireFlaggedDashboard(page)
    await expectThreeZoneContracts(page)
  })

  test('signal count matches the signals route when both counts are rendered', async ({ page }) => {
    await requireFlaggedDashboard(page)
    const dashboardText = await page.locator('[data-first-mile-section="dashboard_this_week"]').innerText()
    const dashboardMatch = dashboardText.match(/(\d+)\s+new signals this week/i)
    test.skip(!dashboardMatch, 'The flagged dashboard did not render a numeric weekly signal count for this account.')

    await page.goto('/dashboard/signals', { waitUntil: 'domcontentloaded' })
    const signalsText = await page.locator('main').innerText()
    const signalsMatch = signalsText.match(/(\d+)\s+signals?\s+detected/i)
    test.skip(!signalsMatch, 'The signals page did not render a numeric signal count for this account.')

    expect(Number(signalsMatch?.[1])).toBe(Number(dashboardMatch?.[1]))
  })
})

test.describe('flagged three-zone dashboard mobile parity', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })

  test('renders without horizontal overflow and preserves contracts', async ({ page }) => {
    await requireFlaggedDashboard(page)
    await expectThreeZoneContracts(page)
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  })
})