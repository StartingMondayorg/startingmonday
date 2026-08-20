import { test, expect } from '@playwright/test'
import { STARTING_MONDAY_HERO_CONTENT } from '@/lib/starting-monday-hero-content'

test.describe('Starting Monday evidence hero @landing-hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as typeof window & { __heroCls?: number }).__heroCls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!shift.hadRecentInput) {
            ;(window as typeof window & { __heroCls?: number }).__heroCls =
              ((window as typeof window & { __heroCls?: number }).__heroCls ?? 0) + (shift.value ?? 0)
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.addStyleTag({
      content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
    })
  })

  test('renders exact proof content, shadcn actions, and the expanded example', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1, name: STARTING_MONDAY_HERO_CONTENT.heading })).toBeVisible()
    await expect(page.getByText(STARTING_MONDAY_HERO_CONTENT.subhead, { exact: true })).toBeVisible()
    await expect(page.locator('figure').filter({ hasText: STARTING_MONDAY_HERO_CONTENT.proofCase.descriptor })).toBeVisible()
    await expect(page.getByText(STARTING_MONDAY_HERO_CONTENT.proofCase.status, { exact: true })).toBeVisible()
    await expect(page.getByText(STARTING_MONDAY_HERO_CONTENT.privacy, { exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: /employment offer/i })).toHaveCount(0)

    const heroActions = page.locator('[data-hero-evidence-actions]')
    const getAccess = heroActions.getByRole('link', { name: STARTING_MONDAY_HERO_CONTENT.primaryCta, exact: true })
    const liveExample = heroActions.getByRole('link', { name: STARTING_MONDAY_HERO_CONTENT.secondaryCta, exact: true })
    await expect(getAccess).toHaveAttribute('href', STARTING_MONDAY_HERO_CONTENT.primaryCtaHref)
    await expect(liveExample).toHaveAttribute('href', STARTING_MONDAY_HERO_CONTENT.secondaryCtaHref)
    await expect(getAccess).toHaveAttribute('data-slot', 'button')
    await expect(liveExample).toHaveAttribute('data-slot', 'button')

    await expect(page).toHaveScreenshot('landing-hero-desktop.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    })

    await liveExample.click()
    await expect(page).toHaveURL(/\/example$/)
    await expect(page.getByRole('heading', { level: 1, name: 'What a forming role looks like.' })).toBeVisible()
    await expect(page.getByText(STARTING_MONDAY_HERO_CONTENT.proofCase.status, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: STARTING_MONDAY_HERO_CONTENT.primaryCta, exact: true })).toHaveAttribute('data-slot', 'button')
    await expect(page.locator('body')).not.toContainText(/usually appear weeks before/i)

    const baseUrl = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000')
    await page.goto(`${baseUrl.protocol}//mandatesignal.com:${baseUrl.port}/example`, { waitUntil: 'domcontentloaded' })
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.getByRole('heading', { level: 1, name: 'What a forming role looks like.' })).toHaveCount(0)
  })

  test('keeps mobile order, overflow, focus, and layout shift within contract', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })

    const heading = page.getByRole('heading', { level: 1, name: STARTING_MONDAY_HERO_CONTENT.heading })
    const timeline = page.locator('figure').filter({ hasText: STARTING_MONDAY_HERO_CONTENT.proofCase.descriptor })
    const getAccess = page.locator('[data-hero-evidence-actions]').getByRole('link', { name: STARTING_MONDAY_HERO_CONTENT.primaryCta, exact: true })
    const privacy = page.getByText(STARTING_MONDAY_HERO_CONTENT.privacy, { exact: true })
    const [headingBox, timelineBox, accessBox, privacyBox] = await Promise.all([
      heading.boundingBox(),
      timeline.boundingBox(),
      getAccess.boundingBox(),
      privacy.boundingBox(),
    ])

    expect(headingBox).not.toBeNull()
    expect(timelineBox).not.toBeNull()
    expect(accessBox).not.toBeNull()
    expect(privacyBox).not.toBeNull()
    expect(headingBox!.y).toBeLessThan(timelineBox!.y)
    expect(timelineBox!.y).toBeLessThan(accessBox!.y)
    expect(accessBox!.y).toBeLessThan(privacyBox!.y)

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      cls: (window as typeof window & { __heroCls?: number }).__heroCls ?? 0,
    }))
    expect(layout.overflow).toBe(false)
    expect(layout.cls).toBeLessThanOrEqual(0.1)

    await getAccess.focus()
    await expect(getAccess).toBeFocused()
    await expect(page).toHaveScreenshot('landing-hero-mobile.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    })
  })
})