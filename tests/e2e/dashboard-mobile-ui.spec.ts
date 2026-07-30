import { expect, test, type Page } from '@playwright/test'

const ROUTES = ['/dashboard', '/dashboard/briefing', '/dashboard/signals']

const DESTINATIONS = [
  '/dashboard/signals',
  '/dashboard/briefing',
  '/dashboard/calendar',
  '/dashboard/contacts',
] as const

const ALLOWED_LABELS: Record<(typeof DESTINATIONS)[number], Set<string>> = {
  '/dashboard/signals': new Set(['Signals']),
  '/dashboard/briefing': new Set(['Briefing']),
  '/dashboard/calendar': new Set(['Calendar']),
  '/dashboard/contacts': new Set(['Contacts']),
}

function cleanLabel(value: string) {
  return value.replace(/[\u2192\u00bb\u25b8]/g, '').replace(/\s+/g, ' ').trim()
}

async function ensureAuthenticated(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Authenticated dashboard session is required for contract tests.')
}

test('@rubric dashboard top chrome contract is consistent across primary routes', async ({ page }) => {
  await ensureAuthenticated(page)

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })

    const header = page.locator('header').first()
    if (route === '/dashboard') {
      // The current page never links to itself: /dashboard omits the Dashboard link.
      await expect(header.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)
    } else {
      await expect(header.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible()
    }
    await expect(header.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()

    await expect(header.getByRole('link', { name: 'Contacts', exact: true })).toHaveCount(0)
    await expect(header.getByRole('link', { name: 'Briefing', exact: true })).toHaveCount(0)
    await expect(header.getByRole('link', { name: 'Calendar', exact: true })).toHaveCount(0)
    await expect(header.getByRole('link', { name: 'Signals', exact: true })).toHaveCount(0)
  }
})

test('@rubric dashboard CTA taxonomy uses one canonical label per destination', async ({ page }) => {
  await ensureAuthenticated(page)

  const seen = new Map<string, Set<string>>()
  for (const destination of DESTINATIONS) {
    seen.set(destination, new Set<string>())
  }

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })

    const labels = await page.evaluate((destinations) => {
      const result: Record<string, string[]> = {}
      for (const d of destinations) result[d] = []

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('nav a[href]'))
      for (const link of links) {
        const href = link.getAttribute('href')
        if (!href) continue
        for (const d of destinations) {
          if (href === d || href.startsWith(`${d}#`)) {
            const text = (link.textContent ?? '').replace(/\s+/g, ' ').trim()
            if (text && text.length <= 40) result[d].push(text)
          }
        }
      }

      return result
    }, DESTINATIONS as unknown as string[])

    for (const destination of DESTINATIONS) {
      for (const raw of labels[destination] ?? []) {
        const normalized = cleanLabel(raw)
        if (normalized) seen.get(destination)?.add(normalized)
      }
    }
  }

  for (const destination of DESTINATIONS) {
    const observed = seen.get(destination) ?? new Set<string>()
    const allowed = ALLOWED_LABELS[destination]

    expect(observed.size, `${destination} has unexpected label variants: ${Array.from(observed).join(', ')}`).toBeLessThanOrEqual(1)
    for (const label of observed) {
      expect(allowed.has(label), `${destination} label "${label}" is outside the canonical taxonomy`).toBeTruthy()
    }
  }
})
