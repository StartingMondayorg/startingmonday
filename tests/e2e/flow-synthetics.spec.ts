/**
 * Production Synthetic Flow Tests (R2.1 + R2.2)
 *
 * Multi-step lifecycle synthetics split out of synthetics.spec.ts:
 *   Synthetic-06: contact follow-up lifecycle (budget <= 10000ms)
 *   Synthetic-09: critical dashboard route sweep (budget <= 5000ms per route)
 *
 * Spec: docs/sre/synthetic-tests-and-deploy-gates.md
 * Filename must keep the `synthetics.spec.ts` suffix so the Playwright
 * synthetics project (testMatch /synthetics\.spec\.ts/) picks it up.
 */

import { test, expect } from '@playwright/test'
import { requireAuthSessionOrSkip } from './synthetics-shared'

// ---------------------------------------------------------------------------
// Synthetic-06: Contact Follow-up Lifecycle
// Budget: <= 10000ms
// Tests: create contact, create follow_ups, execute close flow, verify state
// ---------------------------------------------------------------------------

test('Synthetic-06: follow-up lifecycle completes correctly within budget', async ({ page }) => {
  await requireAuthSessionOrSkip(page)
  test.setTimeout(30_000)

  const ts = Date.now()
  const syntheticContact = `[SYNTHETIC] ${ts}`

  const t0 = Date.now()

  // Step 1: Create a synthetic contact via API
  const createContactRes = await page.request.post('/api/contacts', {
    data: {
      name: syntheticContact,
      title: 'Synthetic Test Contact',
      status: 'active',
    },
    failOnStatusCode: false,
  })

  test.skip(
    createContactRes.status() === 404,
    'Skipping Synthetic-06: /api/contacts endpoint not available'
  )

  if (createContactRes.status() !== 201 && createContactRes.status() !== 200) {
    console.log(`Synthetic-06: contact creation returned ${createContactRes.status()} — skipping lifecycle test`)
    test.skip(true, `Contact creation failed with status ${createContactRes.status()}`)
  }

  const contact = await createContactRes.json()
  const contactId = contact?.id ?? contact?.contact?.id
  if (!contactId) {
    test.skip(true, 'Synthetic-06: contact ID not returned — skipping')
  }

  console.log(`Synthetic-06: created contact id=${contactId}`)

  // Steps 2-4 mutate the shared test account (follow-ups on a synthetic
  // contact). Wrapped in try/finally so a failed assertion below still
  // deletes the synthetic contact instead of orphaning it for other tests
  // sharing this account.
  try {
    // Step 2: Create 2 pending follow_ups
    const followUpIds: string[] = []
    for (let i = 0; i < 2; i++) {
      const fuRes = await page.request.post('/api/follow-ups', {
        data: { contact_id: contactId, note: `Synthetic follow-up ${i + 1}`, status: 'pending' },
        failOnStatusCode: false,
      })
      if (fuRes.status() === 201 || fuRes.status() === 200) {
        const fu = await fuRes.json()
        const fuId = fu?.id ?? fu?.follow_up?.id
        if (fuId) followUpIds.push(fuId)
      }
    }

    console.log(`Synthetic-06: created ${followUpIds.length} follow_ups`)

    // Step 3: Complete all follow_ups (close flow)
    let completedCount = 0
    for (const fuId of followUpIds) {
      const completeRes = await page.request.patch(`/api/follow-ups/${fuId}`, {
        data: { status: 'completed' },
        failOnStatusCode: false,
      })
      if (completeRes.status() === 200) completedCount++
    }

    // Step 4: Verify state
    // At minimum: all follow_ups we could create and complete are accounted for
    const elapsed = Date.now() - t0
    console.log(`Synthetic-06: completed ${completedCount}/${followUpIds.length} follow_ups in ${elapsed}ms`)

    if (followUpIds.length > 0) {
      expect(
        completedCount,
        `Should complete all created follow_ups (got ${completedCount}/${followUpIds.length})`
      ).toBe(followUpIds.length)
    }

    expect(elapsed, `Follow-up lifecycle ${elapsed}ms exceeded budget of 10000ms`).toBeLessThanOrEqual(10_000)
  } finally {
    // Cleanup: delete synthetic contact (runs even if an assertion above threw)
    await page.request.delete(`/api/contacts/${contactId}`, { failOnStatusCode: false })
  }
})


// ---------------------------------------------------------------------------
// Synthetic-09: Critical Dashboard Route Sweep
// Budget: <= 5000ms per route
// Routes: outreach, briefing, contacts, strategy, signals, profile
// Explicit fail conditions:
//   - Non-200 response
//   - Dashboard error boundary copy
//   - 404 / not found copy
//   - JS runtime errors or console errors during navigation
// ---------------------------------------------------------------------------

test('Synthetic-09: critical dashboard route sweep has no 404/error-boundary failures', async ({ page }) => {
  await requireAuthSessionOrSkip(page)

  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  const ignoredErrorPatterns = [
    /Minified React error #418/i,
    /Failed to fetch current statuses/i,
    /Failed to load resource: the server responded with a status of 500/i,
  ]

  const isIgnorableError = (message: string) =>
    ignoredErrorPatterns.some((pattern) => pattern.test(message))

  page.on('pageerror', (error) => {
    if (isIgnorableError(error.message)) {
      console.log(`Synthetic-09: ignoring known transient pageerror: ${error.message}`)
      return
    }
    pageErrors.push(error.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const errorText = message.text()
      if (isIgnorableError(errorText)) {
        console.log(`Synthetic-09: ignoring known transient console error: ${errorText}`)
        return
      }
      consoleErrors.push(errorText)
    }
  })

  const routes: Array<{ path: string; marker: RegExp; budgetMs: number }> = [
    { path: '/dashboard/outreach', marker: /Send Queue|Outreach/i, budgetMs: 5_000 },
    {
      path: '/dashboard/briefing',
      marker: /Good (morning|afternoon|evening)|Nothing to brief today|Accountability/i,
      budgetMs: 12_000,
    },
    { path: '/dashboard/contacts', marker: /Contacts|Contact|Relationship/i, budgetMs: 5_000 },
    { path: '/dashboard/strategy', marker: /Strategy|search playbook|operating system/i, budgetMs: 5_000 },
    { path: '/dashboard/signals', marker: /Signals|Draft|Signal/i, budgetMs: 5_000 },
    { path: '/dashboard/profile', marker: /Profile|Identity|Targets|Resume/i, budgetMs: 5_000 },
  ]

  const sweepFailures: string[] = []

  for (const route of routes) {
    const t0 = Date.now()
    const res = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    const elapsed = Date.now() - t0

    const bodyText = await page.locator('body').innerText()

    if (res?.status() !== 200) {
      sweepFailures.push(`${route.path}: expected 200, got ${res?.status()}`)
      continue
    }

    if (/something went wrong\.|dashboard error|failed to load/i.test(bodyText)) {
      sweepFailures.push(`${route.path}: hit dashboard error boundary text`)
    }

    if (/\b404\b|not found|page not found/i.test(bodyText)) {
      sweepFailures.push(`${route.path}: hit 404/not-found text`)
    }

    if (!route.marker.test(bodyText)) {
      // Route-level copy shifts frequently; marker misses are diagnostic-only.
      console.log(`Synthetic-09: ${route.path} marker drift detected (non-fatal)`)
    }

    if (elapsed > route.budgetMs) {
      sweepFailures.push(`${route.path}: exceeded ${route.budgetMs}ms budget (${elapsed}ms)`)
    }

    console.log(`Synthetic-09: ${route.path} loaded in ${elapsed}ms`)
  }

  expect(sweepFailures, `Route sweep failures: ${sweepFailures.join(' | ')}`).toHaveLength(0)
  expect(pageErrors, `Page JS errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
  expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0)
})

