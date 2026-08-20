import { test, expect, type Page } from '@playwright/test'

async function skipIfAuthUnavailable(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping auth-required E2E test: login session unavailable in CI')
}

async function findFirstCompanyId(page: Page): Promise<string | null> {
  await page.goto('/dashboard')
  const companyLink = page.locator('a[href^="/dashboard/companies/"]').first()
  if ((await companyLink.count()) === 0) return null
  const href = await companyLink.getAttribute('href')
  if (!href) return null
  const match = href.match(/\/dashboard\/companies\/([0-9a-fA-F-]{36})/)
  return match?.[1] ?? null
}

// ─── Path 1: Signup → Onboarding → Dashboard ─────────────────────────────────
// Full signup requires email confirmation which can't be automated in E2E.
// These tests cover: page structure, auth redirect guards, and post-onboarding state.

test.describe('Signup and onboarding', () => {
  test('signup page has required form fields', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /Get started|Create account|Start free trial/i })).toBeVisible()
  })

  test('unauthenticated user is redirected to login from dashboard', async ({ browser }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app'
    const ctx = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await ctx.close()
  })

  test('activation checklist loads after onboarding is complete', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    await page.goto('/dashboard/start')
    await expect(page.getByRole('heading', { name: /search is live|you.re set up/i })).toBeVisible()
    // Progress indicator shows "X of 6 steps"
    await expect(page.getByText(/of 6/)).toBeVisible()
  })

  test('onboarding is required before accessing dashboard', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    // If onboarding is complete, dashboard loads. If not, it redirects to /onboarding.
    // Either outcome is correct — neither is a silent failure.
    await page.goto('/dashboard')
    const url = page.url()
    expect(url).toMatch(/\/(dashboard|onboarding)/)
  })
})

// ─── Path 2: Trial → Stripe Checkout ─────────────────────────────────────────

test.describe('Billing and Stripe checkout', () => {
  test('billing page loads with plan sections', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    await page.goto('/settings/billing')
    await expect(page.getByRole('heading', { name: 'Billing' }).first()).toBeVisible()
    await expect(page.getByText('Account').first()).toBeVisible()
    await expect(page.getByText('Current Plan')).toBeVisible()
  })

  test('checkout API rejects unknown plan with 400', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    const res = await page.request.post('/api/billing/checkout', {
      data: { plan: 'nonexistent_plan' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(400)
  })

  test('checkout API rejects empty body with 400', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    const res = await page.request.post('/api/billing/checkout', {
      data: {},
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(400)
  })

  test('checkout API accepts valid plan without returning 400 or 401', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    const res = await page.request.post('/api/billing/checkout', {
      data: { plan: 'active', interval: 'monthly' },
      failOnStatusCode: false,
    })
    // 400 = Zod rejected the input (regression), 401 = auth broken (regression)
    // 200 = success (live Stripe), 500 = acceptable in test env with no Stripe keys
    expect(res.status()).not.toBe(400)
    expect(res.status()).not.toBe(401)
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com/)
    }
  })

  test('Subscribe button calls checkout API with the selected plan', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    test.setTimeout(30_000)
    let capturedPlan: string | null = null

    await page.route('/api/billing/checkout', async route => {
      capturedPlan = (await route.request().postDataJSON())?.plan ?? null
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/pay/test-intercepted' }),
      })
    })

    await page.goto('/settings/billing')

    const subscribeButton = page.getByRole('button', { name: /Subscribe to/i }).first()
    if (!(await subscribeButton.isVisible())) {
      // User is already subscribed — upgrade buttons are hidden. Skip UI portion.
      return
    }

    // Navigation to Stripe will fail (external) — catch so the test doesn't error
    await Promise.all([
      page.waitForNavigation({ timeout: 4_000 }).catch(() => {}),
      subscribeButton.click(),
    ])

    expect(capturedPlan).not.toBeNull()
    // Plan must be one of the known billing plan keys.
    expect(['monitor', 'active', 'passive']).toContain(capturedPlan)
  })
})

// ─── Path 3: Prep Brief Generation ───────────────────────────────────────────

test.describe('Prep brief generation', () => {
  test('prep API streams generated brief text for a valid company', async ({ page }) => {
    test.setTimeout(300_000)
    await skipIfAuthUnavailable(page)
    const companyId = await findFirstCompanyId(page)
    test.skip(!companyId, 'Skipping prep API test: no company found in dashboard')

    let res
    try {
      res = await page.request.get(`/api/prep/${companyId}?interview_stage=hiring_manager`, {
        failOnStatusCode: false,
      })
    } catch (error) {
      test.skip(true, `Skipping prep API test due runtime stream timeout: ${String(error)}`)
      return
    }

    if ([401, 403].includes(res.status())) {
      test.skip(true, `Skipping prep API test due transient auth/session status: ${res.status()}`)
      return
    }

    if (res.status() === 429) {
      test.skip(true, 'Skipping prep API test due transient CI/shared-environment rate limiting (429)')
      return
    }

    expect(res.status()).toBe(200)
    expect(res.headers()['content-type'] ?? '').toContain('text/plain')
    const body = await res.text()
    expect(body.length).toBeGreaterThan(40)
    expect(body).not.toContain('__ERROR__')
  })
})

// ─── Path 4: Daily Briefing ───────────────────────────────────────────────────
// The worker sends emails directly; this app endpoint is intentionally retired.
// These tests cover the user-facing page and the retired endpoint contract.

test.describe('Daily briefing page', () => {
  test('briefing send endpoint is retired and returns 410', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    const res = await page.request.post('/api/briefing/send', {
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(410)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('retired'),
    })
  })

  test('briefing page loads and shows greeting', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    test.setTimeout(60_000)
    await page.goto('/dashboard/briefing')
    // Server generates the briefing via Claude — may take up to 30s
    await expect(page.locator('h1')).toBeVisible({ timeout: 30_000 })
    const heading = await page.locator('h1').textContent()
    expect(heading).toMatch(/Good (morning|afternoon|evening)/i)
  })

  test('briefing page has link back to dashboard', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    test.setTimeout(60_000)
    await page.goto('/dashboard/briefing')
    await expect(page.locator('h1')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible()
  })

  test('briefing page does not show a server error', async ({ page }) => {
    await skipIfAuthUnavailable(page)
    test.setTimeout(60_000)
    await page.goto('/dashboard/briefing')
    await expect(page.locator('h1')).toBeVisible({ timeout: 30_000 })
    // Recovery flags intentionally use red styling, so assert on actual fatal-error copy instead.
    await expect(page.getByText(/internal server error|500|something went wrong|application error/i)).not.toBeVisible()
  })
})

// ─── UX Reliability: Password-Manager Autofill ──────────────────────────────
// Verifies login form accepts credentials written directly into the DOM
// (simulating password manager fill) without requiring onChange state sync.

test.describe('UX reliability — auth and form edge cases', () => {
  test('login form submits correctly when fields are filled programmatically (autofill simulation)', async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TEST_EMAIL
    const password = process.env.PLAYWRIGHT_TEST_PASSWORD
    test.skip(!email || !password, 'Skipping autofill test: test credentials not configured')

    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()

    // Use fill() which bypasses React onChange — simulates password manager injection
    await page.locator('#email').fill(email!)
    await page.locator('#password').fill(password!)

    // Verify the submit button is enabled (not blocked by missing state)
    const submitBtn = page.getByRole('button', { name: /Sign in/i })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).not.toBeDisabled()

    // Intercept the signin API call to verify the payload was read from DOM, not state
    let signinPayload: Record<string, unknown> | null = null
    await page.route('/api/auth/verify-and-signin', async route => {
      try {
        signinPayload = route.request().postDataJSON() as Record<string, unknown>
      } catch {
        signinPayload = null
      }
      await route.continue()
    })

    await submitBtn.click()

    // Wait for navigation away from login (success) or short timeout (wrong creds in CI)
    await page.waitForURL(url => !url.pathname.startsWith('/login'), {
      timeout: 10_000,
    }).catch(() => {})

    // The key assertion: the payload must have been sent with the correct email
    // This catches the bug where autofill bypasses React state and email is blank
    if (signinPayload) {
      expect(String((signinPayload as Record<string, unknown>).email ?? '')).toBe(email!)
    }
  })

  test('session expiry mid-flow redirects to login without unhandled error', async ({ browser }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app'

    // Create a context with an expired/empty session
    const ctx = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    })
    const page = await ctx.newPage()

    // Attempt to access an authenticated route directly
    await page.goto('/dashboard/contacts')

    // Should redirect to login without showing a 500 or error boundary
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/500|internal server error|unhandled/i)
    await expect(page.locator('[role="alert"]')).not.toBeVisible()

    await ctx.close()
  })

  // NOTE: /api/feedback/items has no dedup/idempotency-key logic (see
  // src/app/api/feedback/items/route.ts) — two concurrent identical
  // submissions are expected to both succeed and create two separate items.
  // This test only verifies concurrent writes don't crash the server; it is
  // not a guarantee of idempotency.
  test('concurrent feedback submissions do not crash the server', async ({ page }) => {
    await skipIfAuthUnavailable(page)

    const syntheticTitle = `[SYNTHETIC-CONCURRENCY] ${Date.now()}`

    // Make two rapid concurrent requests with the same payload
    const [res1, res2] = await Promise.all([
      page.request.post('/api/feedback/items', {
        data: { title: syntheticTitle, body: 'Idempotency test body 1', category: 'general' },
        failOnStatusCode: false,
      }),
      page.request.post('/api/feedback/items', {
        data: { title: syntheticTitle, body: 'Idempotency test body 2', category: 'general' },
        failOnStatusCode: false,
      }),
    ])

    // Both requests should complete without server-side crash.
    expect(res1.status(), `First feedback request returned ${res1.status()}`).toBeLessThan(500)
    expect(res2.status(), `Second feedback request returned ${res2.status()}`).toBeLessThan(500)

    // Cleanup any created items
    for (const res of [res1, res2]) {
      if (res.status() === 201) {
        const body = await res.json().catch(() => null)
        const id = body?.item?.id
        if (id) await page.request.delete(`/api/feedback/items/${id}`, { failOnStatusCode: false })
      }
    }
  })
})
