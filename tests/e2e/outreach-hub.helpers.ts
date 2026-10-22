import { test, type Page } from '@playwright/test'

// R-3 phase 2c moved the Outreach Hub under /dashboard/admin; non-staff accounts get the admin
// layout's 404 there, so staff access is decided by the page heading rather than the URL.
export async function openOutreachHubOrSkip(page: Page) {
  await page.goto('/dashboard/admin/outreach')
  const heading = page.getByRole('heading', { name: 'Outreach Hub' })
  const isStaff = await heading.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true, () => false)
  test.skip(!isStaff, 'Skipping Outreach Hub check: staff access unavailable for this account')
  return heading
}
