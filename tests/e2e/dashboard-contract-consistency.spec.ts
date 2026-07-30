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

function isCompactNavigationLabel(raw: string): boolean {
  // Taxonomy contract targets cross-route nav labels, not rich card copy.
  // Ignore long/paragraph-like labels that come from linked content cards.
  const normalized = cleanLabel(raw)
  if (!normalized) return false
  return normalized.length <= 28
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

    const labels = await page.evaluate(({ destinations, currentRoute }) => {
      const result: Record<string, string[]> = {}
      for (const d of destinations) result[d] = []

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
      for (const link of links) {
        const hasNavigationAncestor = !!link.closest('nav,header,[role="navigation"],[aria-label="On this page"]')
        if (!hasNavigationAncestor) continue

        const href = link.getAttribute('href')
        if (!href) continue

        const hasRichContentDescendant = !!link.querySelector('h1,h2,h3,h4,h5,h6,p,article,section,table,ul,ol,dl,dt,dd')
        if (hasRichContentDescendant) continue

        for (const d of destinations) {
          // A page's links to itself (mode toggles, filters, pagination) are
          // in-page controls, not cross-navigation CTAs - the taxonomy
          // contract applies to how OTHER routes label the destination.
          if (d === currentRoute) continue
          if (href === d || href.startsWith(`${d}?`) || href.startsWith(`${d}#`)) {
            const text = (link.textContent ?? '').replace(/\s+/g, ' ').trim()
            if (text) result[d].push(text)
          }
        }
      }

      return result
    }, { destinations: DESTINATIONS as unknown as string[], currentRoute: route })

    for (const destination of DESTINATIONS) {
      for (const raw of labels[destination] ?? []) {
        if (!isCompactNavigationLabel(raw)) continue
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

test('@rubric dashboard cluster has one main landmark and canonical title suffix', async ({ page }) => {
  await ensureAuthenticated(page)

  for (const route of ['/dashboard', '/dashboard/briefing', '/dashboard/signals', '/dashboard/calendar', '/dashboard/contacts']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })

    await expect(page.locator('main')).toHaveCount(1)
    await expect.poll(async () => page.title()).toMatch(/ - Starting Monday$/)
  }
})

test('@rubric dashboard stale relative-time copy is not rendered', async ({ page }) => {
  await ensureAuthenticated(page)

  for (const route of ['/dashboard', '/dashboard/calendar']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    const pageText = await page.locator('body').innerText()
    expect(pageText).not.toMatch(/has been\s+\d+\s+days/i)
    expect(pageText).not.toMatch(/it has been\s+\d+\s+days/i)
  }
})

test('@rubric dashboard signal count parity matches signals index when both are numeric', async ({ page }) => {
  await ensureAuthenticated(page)

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  const dashboardText = await page.locator('body').innerText()
  const dashboardMatch = dashboardText.match(/Signals this week:\s*(\d+)/i)
  test.skip(!dashboardMatch, 'Dashboard signal count label was not present in this account state.')
  const dashboardCount = Number(dashboardMatch?.[1] ?? '0')

  await page.goto('/dashboard/signals', { waitUntil: 'domcontentloaded' })
  const signalsText = await page.locator('body').innerText()
  const signalsMatch = signalsText.match(/(\d+)\s+signals?\s+detected/i)
  test.skip(!signalsMatch, 'Signals page count label was not present in this account state.')
  const signalsCount = Number(signalsMatch?.[1] ?? '0')

  expect(signalsCount).toBe(dashboardCount)
})
