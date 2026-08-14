/**
 * Shared auth-session helpers for the synthetic test suites.
 * Used by synthetics.spec.ts and flow-synthetics.spec.ts.
 */

import { test, type Page } from '@playwright/test'

export async function hasAuthSession(page: Page): Promise<boolean> {
  await page.goto('/dashboard')
  return !/\/login(?:$|[/?#])/.test(page.url())
}

export async function trySignIn(page: Page): Promise<boolean> {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) return false

  await page.goto('/login', { waitUntil: 'load' })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /^Sign in$/i }).click()

  await page
    .waitForURL(url => !/\/login(?:$|[/?#])/.test(url.pathname), { timeout: 10000 })
    .catch(() => null)

  return hasAuthSession(page)
}

export async function requireAuthSessionOrSkip(page: Page) {
  const authenticated = (await hasAuthSession(page)) || (await trySignIn(page))
  test.skip(
    !authenticated,
    'Skipping synthetic: auth session unavailable (dashboard redirected to login). Check PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD.'
  )
}
