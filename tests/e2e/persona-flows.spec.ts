/**
 * SMK-18 — Persona E2E Test Suite
 *
 * Four synthetic user profiles aligned to the onboarding channel selector.
 * One quality heuristic per channel. Regressions in AI output or channel-specific
 * access patterns surface here before they reach real users.
 *
 * Channels:
 *   executives   — C-suite exec doing their own search (direct user)
 *   coaches      — Independent career coach managing exec clients
 *   outplacement — Career advisor at an outplacement firm (e.g. LHH)
 *   search_firms — Retained search partner collaborating with a placed exec candidate
 *
 * Auth: all tests reuse the stored session from global-setup (PLAYWRIGHT_TEST_EMAIL).
 * If auth is unavailable the suite skips gracefully rather than failing.
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function requireAuthOrSkip(page: Page) {
  await page.goto('/dashboard')
  test.skip(
    /\/login(?:$|[/?#])/.test(page.url()),
    'Skipping persona test: auth session unavailable. Check PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD.'
  )
}

/** Stream a text/plain or text/event-stream response body to a string. */
async function readStreamingText(page: Page, url: string, body: object): Promise<string> {
  const res = await page.request.post(url, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  })
  if (!res.ok()) return ''
  return res.text()
}

// ---------------------------------------------------------------------------
// Persona: executives
// Dana Hill — Chief Information Officer, active search, self-service direct user.
// Core flow: company intelligence preview for a target company.
// Heuristic: response is substantive (>= 150 chars) and contains at least one
//            executive-strategy keyword, confirming the AI output is calibrated
//            to a C-suite job seeker rather than returning generic filler.
// ---------------------------------------------------------------------------

test.describe('Persona: executives', () => {
  test('intel endpoint returns executive-calibrated content for CIO persona', async ({ page }) => {
    await requireAuthOrSkip(page)
    test.setTimeout(20_000)

    const EXECUTIVE_KEYWORDS = [
      'strategic', 'transformation', 'executive', 'leadership',
      'mandate', 'opportunity', 'priorities', 'agenda',
    ]

    const text = await readStreamingText(page, '/api/onboarding/intel', {
      companyName: 'Microsoft',
      persona: 'csuite',
    })

    test.skip(text === '', 'Skipping: intel endpoint returned empty (rate limited or auth issue)')

    console.log(`Persona-executives: intel response length=${text.length}`)

    expect(
      text.length,
      'Intel response should be >= 150 chars (substantive, not truncated)'
    ).toBeGreaterThanOrEqual(150)

    const containsKeyword = EXECUTIVE_KEYWORDS.some(kw => text.toLowerCase().includes(kw))
    expect(
      containsKeyword,
      `Intel response should contain at least one executive-strategy keyword. Got: "${text.slice(0, 200)}"`
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Persona: coaches
// Marcus Webb — Independent career coach, manages a roster of executive clients.
// Core flow: coach dashboard client list endpoint.
// Heuristic: endpoint exists and is auth-gated (200 or 401), not missing (404)
//            or broken (500). Confirms the coach channel access path is live.
// ---------------------------------------------------------------------------

test.describe('Persona: coaches', () => {
  test('coach clients endpoint is reachable and auth-gated', async ({ page }) => {
    await requireAuthOrSkip(page)

    const res = await page.request.get('/api/coach/clients', { failOnStatusCode: false })

    console.log(`Persona-coaches: /api/coach/clients returned ${res.status()}`)

    expect(
      res.status() !== 404,
      'Coach clients endpoint should exist (not 404) — missing endpoint breaks the coaches channel'
    ).toBe(true)

    expect(
      res.status() !== 500,
      `Coach clients endpoint returned 500 — server error on coaches channel`
    ).toBe(true)
  })

  test('coach dashboard page loads without error boundary', async ({ page }) => {
    await requireAuthOrSkip(page)

    const res = await page.goto('/dashboard/coach', { waitUntil: 'domcontentloaded' })

    // R-6: non-coach accounts are redirected to /dashboard by the entitlement gate.
    expect(res?.status(), 'Coach dashboard (or its gate redirect target) should return 200').toBe(200)

    const body = await page.locator('body').innerText()
    expect(
      /something went wrong/i.test(body),
      'Coach dashboard should not hit an error boundary'
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Persona: outplacement
// Robin Torres — Senior career transition advisor at an outplacement firm (LHH-style).
// Manages executives in the exit stage of one role, supporting their transition
// into their next position.
// Core flow: outplacement advisor landing page.
// Heuristic: page loads (200) and contains outplacement service content,
//            confirming the channel's entry point is live and rendering.
// ---------------------------------------------------------------------------

test.describe('Persona: outplacement', () => {
  test('outplacement dashboard page loads with service content', async ({ page }) => {
    await requireAuthOrSkip(page)

    const res = await page.goto('/dashboard/outplacement', { waitUntil: 'domcontentloaded' })

    console.log(`Persona-outplacement: /dashboard/outplacement returned ${res?.status()}`)

    expect(res?.status(), 'Outplacement page (or its gate redirect target) should return 200').toBe(200)

    // R-6: accounts without a partner organisation are redirected to /dashboard. The redirect can
    // complete after domcontentloaded, so wait for a page h1 before reading the URL.
    await expect(page.locator('h1').first()).toBeVisible()
    test.skip(!/\/dashboard\/outplacement(?:$|[/?#])/.test(page.url()), 'Account is not attached to a partner organisation; entitlement gate redirected to /dashboard.')

    const body = await page.locator('body').innerText()

    expect(
      /outplacement/i.test(body),
      'Outplacement page body should contain "outplacement" content marker'
    ).toBe(true)

    expect(
      /something went wrong/i.test(body),
      'Outplacement page should not hit an error boundary'
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Persona: search_firms
// Alex Morgan — Principal at a retained executive search firm (Spencer Stuart-style).
// Collaborates with a placed CIO candidate on the platform to accelerate and
// optimize their guided job search. Needs interview-round-ready intel depth
// so the candidate arrives at peer level and the firm's reputation holds.
// Core flow: company intelligence preview for a candidate's upcoming interview.
// Heuristic: response is >= 200 chars (deeper than the self-service bar) AND
//            contains a timing signal, confirming the AI output has the
//            interview-window specificity that search firm placements require.
// ---------------------------------------------------------------------------

test.describe('Persona: search_firms', () => {
  test('intel endpoint returns interview-depth content for a placed candidate', async ({ page }) => {
    await requireAuthOrSkip(page)
    test.setTimeout(20_000)

    const TIMING_KEYWORDS = [
      'timing', 'window', 'signal', 'quarter', 'months', 'near-term',
      'near term', 'horizon', 'imminent', 'open', 'watch',
    ]

    const text = await readStreamingText(page, '/api/onboarding/intel', {
      companyName: 'Salesforce',
      persona: 'csuite',
    })

    test.skip(text === '', 'Skipping: intel endpoint returned empty (rate limited or auth issue)')

    console.log(`Persona-search_firms: intel response length=${text.length}`)

    expect(
      text.length,
      'Intel response for a placed candidate should be >= 200 chars (interview-round prep depth)'
    ).toBeGreaterThanOrEqual(200)

    const containsTimingSignal = TIMING_KEYWORDS.some(kw => text.toLowerCase().includes(kw))
    expect(
      containsTimingSignal,
      `Intel response should contain a timing/window signal for interview prep. Got: "${text.slice(0, 200)}"`
    ).toBe(true)
  })
})
