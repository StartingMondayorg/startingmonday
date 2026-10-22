import { test, expect, type Page } from '@playwright/test'

type KeyRoute = {
  path: string
  name: string
  heading?: RegExp
  text?: RegExp
  placeholder?: RegExp
  requiresStaff?: boolean
  expectMain?: boolean
}

const KEY_ROUTES: KeyRoute[] = [
  { path: '/dashboard', name: 'Dashboard', heading: /Good\s+(morning|afternoon|evening)/i },
  { path: '/dashboard/briefing', name: 'Briefing', heading: /Good\s+(morning|afternoon|evening)/i, text: /Daily Intelligence Briefing/i },
  { path: '/dashboard/admin/outreach', name: 'Outreach', heading: /Outreach Hub/i, requiresStaff: true },
  { path: '/dashboard/chat', name: 'Chat', placeholder: /Ask anything about your search/i, expectMain: false },
  { path: '/settings/help', name: 'Help', heading: /Help\s*&\s*Getting Started/i },
  { path: '/dashboard/calendar', name: 'Calendar', heading: /Calendar/i },
  { path: '/dashboard/profile', name: 'Profile', heading: /^Profile$/i },
  { path: '/dashboard/contacts', name: 'Contacts', heading: /^Contacts$/i },
  { path: '/dashboard/signals', name: 'Signals', heading: /Company Signals/i },
]

async function ensureAuthenticated(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping auth-required mobile route sweep: login session unavailable in CI')
}

test.describe('Mobile key routes sweep @rubric @mobile', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Mobile route sweep runs only on mobile projects')
  })

  for (const route of KEY_ROUTES) {
    test(`route ${route.path} renders mobile shell (${route.name})`, async ({ page }) => {
      await ensureAuthenticated(page)

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      const status = response?.status()

      if (route.requiresStaff && status === 404) {
        test.skip(true, `Staff-only route unavailable for this account: ${route.path}`)
      }

      expect(page.url()).not.toMatch(/\/login(?:$|[/?#])/) 
      if (typeof status === 'number') {
        expect(status).toBeLessThan(500)
      }

      if (route.expectMain !== false) {
        await expect(page.locator('main').first()).toBeVisible()
      }

      const hasOverflow = await page.evaluate(() => {
        const root = document.documentElement
        return root.scrollWidth > window.innerWidth + 1
      })
      expect(hasOverflow).toBeFalsy()

      await expect(page.locator('nav').last()).toBeVisible()

      if (route.heading) {
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible()
      }

      if (route.text) {
        await expect(page.getByText(route.text).first()).toBeVisible()
      }

      if (route.placeholder) {
        await expect(page.getByPlaceholder(route.placeholder).first()).toBeVisible()
      }
    })
  }
})
