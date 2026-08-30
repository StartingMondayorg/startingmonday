import { test as setup, type Page } from '@playwright/test'
import path from 'path'
import { existsSync } from 'node:fs'
import { selectCompanyStage } from './company-form.helpers'

const authFile = path.join(__dirname, '.auth/user.json')

async function ensureMonitoringAnchorCompany(page: Page) {
  await page.goto('/dashboard')
  if (/\/login(?:$|[/?#])/.test(page.url())) return

  const companyLink = page.locator('a[href^="/dashboard/companies/"]').first()
  if ((await companyLink.count()) > 0) return

  await page.goto('/dashboard/companies/new')
  // If the authenticated form did not render (auth unavailable in this
  // environment), skip anchor creation instead of failing the whole setup
  // project - public-only suites do not need it.
  const nameInput = page.locator('input[name="name"]')
  const formReady = await nameInput.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false)
  if (!formReady) return

  await page.fill('input[name="name"]', 'Synthetic Monitoring Anchor')
  await selectCompanyStage(page, 'Interviewing')
  await page.fill('input[name="sector"]', 'Technology')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard\//, { timeout: 20_000 }).catch(() => {})
}

// Direct API sign-in: calls /api/auth/verify-and-signin, extracts Set-Cookie headers,
// and injects them into the browser context. More reliable than the browser form approach
// because it bypasses UI rendering and browser cookie-storage inconsistencies across environments.
async function apiSignIn(page: Page, baseURL: string, email: string, password: string): Promise<boolean> {
  try {
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), 8_000)
    const res = await fetch(`${baseURL}/api/auth/verify-and-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: abort.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return false

    // getSetCookie() returns all Set-Cookie headers as an array (Node 18.14+)
    const setCookies: string[] = (res.headers as unknown as { getSetCookie?(): string[] }).getSetCookie?.() ?? []
    if (setCookies.length === 0) return false

    const hostname = new URL(baseURL).hostname
    const cookies = setCookies.map((raw) => {
      const [nameVal, ...attrParts] = raw.split(';').map((s) => s.trim())
      const eq = nameVal.indexOf('=')
      const name = nameVal.slice(0, eq)
      const value = nameVal.slice(eq + 1)
      const attrs: Record<string, string | boolean> = {}
      attrParts.forEach((a) => {
        const ei = a.indexOf('=')
        if (ei >= 0) attrs[a.slice(0, ei).toLowerCase()] = a.slice(ei + 1)
        else attrs[a.toLowerCase()] = true
      })
      return {
        name,
        value,
        domain: hostname,
        path: (attrs['path'] as string) || '/',
        expires: attrs['expires'] ? new Date(attrs['expires'] as string).getTime() / 1000 : -1,
        httpOnly: !!attrs['httponly'],
        secure: !!attrs['secure'],
        sameSite: (['Strict', 'Lax', 'None'].includes(
          (attrs['samesite'] as string | undefined)?.charAt(0).toUpperCase() +
          ((attrs['samesite'] as string | undefined)?.slice(1) ?? '')
        )
          ? (attrs['samesite'] as string).charAt(0).toUpperCase() + (attrs['samesite'] as string).slice(1)
          : 'Lax') as 'Strict' | 'Lax' | 'None',
      }
    })

    await page.context().addCookies(cookies)
    return true
  } catch {
    return false
  }
}

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    // Preserve previously captured auth state for local smoke runs.
    // Writing a fresh storage state here can unintentionally clear valid cookies.
    if (!existsSync(authFile)) {
      await page.context().storageState({ path: authFile })
    }
    return
  }

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app'

  // Try direct API sign-in first because it avoids UI-specific selector drift.
  const apiAuthOk = await apiSignIn(page, baseURL, email, password)

  if (apiAuthOk) {
    await ensureMonitoringAnchorCompany(page)
    await page.context().storageState({ path: authFile })
    return
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if ((await page.locator('#email').count()) === 0 || (await page.locator('#password').count()) === 0) {
    await page.context().storageState({ path: authFile })
    return
  }

  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await ensureMonitoringAnchorCompany(page)

  // If API sign-in failed, saves empty state so downstream tests skip gracefully.
  await page.context().storageState({ path: authFile })
})
