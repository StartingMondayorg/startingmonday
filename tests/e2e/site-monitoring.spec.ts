import { test, expect, type Page } from '@playwright/test'
import { attachJourneyGuards, expectJourneyHealthy, expectJourneyShell } from './monitoring.helpers'

const publicJourneys = [
  { path: '/', heading: /You don't compete for the posting|You are behind on timing, narrative, and prep|Be ready.*(Be early|search opens)|Starting Monday|Operating System|Run your transition/i },
  { path: '/login', heading: /Sign in/i },
  { path: '/signup', heading: /Get started|Create your account|Sign up/i },
  { path: '/pricing', heading: /The terms of engagement/i },
]

async function skipIfAuthUnavailable(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping auth-required monitoring checks: login session unavailable in CI')
}

for (const journey of publicJourneys) {
  test(`public journey renders cleanly: ${journey.path}`, async ({ page }) => {
    const guards = await attachJourneyGuards(page)

    await page.goto(journey.path)
    await expectJourneyShell(page, journey.heading)
    await expectJourneyHealthy(page, guards)

    await expect(page.locator('body')).not.toContainText(/404/i)
    // Next.js App Router always mounts an empty route announcer live region
    // (div#__next-route-announcer__[role="alert"]) after hydration since the
    // Aug 14 2026 dependency wave. It is a framework a11y feature, not a
    // user-facing alert, so exclude it from the "no alerts" contract.
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0)
  })
}

test.describe('authenticated monitoring journeys', () => {
  test('dashboard renders meaningful content', async ({ page }) => {
    await skipIfAuthUnavailable(page)

    const guards = await attachJourneyGuards(page)

    await page.goto('/dashboard')
    await expectJourneyShell(page, /Dashboard|Company Pipeline|Starting Monday|Good (morning|afternoon|evening)/i)
    await expectJourneyHealthy(page, guards)

    await expect(page.locator('#pipeline')).toBeVisible()
  })

  test('briefing page shows fresh output or a clear empty state', async ({ page }) => {
    await skipIfAuthUnavailable(page)

    const guards = await attachJourneyGuards(page)

    await page.goto('/dashboard/briefing')
    await expectJourneyShell(page, /Good (morning|afternoon|evening)/i)
    await expectJourneyHealthy(page, guards)

    const emptyState = page.getByText('Nothing to brief today.')
    if (await emptyState.isVisible()) {
      await expect(page.getByText(/No new job matches, overdue follow-ups, or company signals/i)).toBeVisible()
    } else {
      await expect(page.getByRole('heading', { name: 'Find Roles First' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Talk to the Right People' })).toBeVisible()
    }
  })

  test('outreach page shows a send queue or an explicit empty state', async ({ page }) => {
    await skipIfAuthUnavailable(page)

    const guards = await attachJourneyGuards(page)

    await page.goto('/dashboard/outreach')
    await expectJourneyShell(page, /Send Queue|Outreach/i)
    await expectJourneyHealthy(page, guards)

    await expect(page.getByText(/Defaults to high-confidence emails/i)).toBeVisible()
    await expect(page.getByText(/Filter by confidence and status/i)).toBeVisible()

    const emptyState = page.getByText('No prospects match this channel, confidence, and status filter.')
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: /Executives|Search Firms|Coaches|Outplacement Firms/ }).first()).toBeVisible()
      await expect(page.getByText(/Review and send on right/i).first()).toBeVisible()
    }
  })

  test('company detail route renders when a company exists', async ({ page }) => {
    await skipIfAuthUnavailable(page)

    const guards = await attachJourneyGuards(page)

    await page.goto('/dashboard')
    const companyLink = page.locator('a[href^="/dashboard/companies/"]').first()

    if ((await companyLink.count()) === 0) {
      test.skip(true, 'Skipping company detail monitoring check: no companies in this account')
    }

    await companyLink.click()
    await expect(page).toHaveURL(/\/dashboard\/companies\/.+/)
    await expectJourneyHealthy(page, guards)

    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Interview prep|Run interview prep/i }).first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/404/i)
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0)
  })
})
