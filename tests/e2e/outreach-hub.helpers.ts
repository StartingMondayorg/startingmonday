import { expect, test, type Page } from '@playwright/test'

// R-3 phase 2c moved the Outreach Hub under /dashboard/admin. The admin layout denies non-staff in
// two known ways: notFound() (root not-found page) or a redirect to /login?error=workspace_access.
// Only those states skip; any other outcome (error page, missing heading, timeout) fails.
export async function openOutreachHubOrSkip(page: Page) {
  await page.goto('/dashboard/admin/outreach')
  const hub = page.getByRole('heading', { name: 'Outreach Hub' }).first()
  const notFound = page.getByRole('heading', { level: 1, name: 'Page not found', exact: true }).first()
  const workspaceDenied = () => /\/login\?(?:[^#]*&)?error=workspace_access(?:&|#|$)/.test(page.url())

  await expect
    .poll(async () => workspaceDenied() || (await hub.isVisible()) || (await notFound.isVisible()), {
      timeout: 15_000,
      message: 'Outreach Hub neither rendered nor showed a known admin access-denied state',
    })
    .toBe(true)

  test.skip(workspaceDenied() || (await notFound.isVisible()), 'Skipping Outreach Hub check: admin gate denied this account (not staff)')
  await expect(hub).toBeVisible()
  return hub
}
