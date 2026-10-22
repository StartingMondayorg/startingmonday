import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? 'https://startingmonday.app').trim().replace(/\/+$/, '')
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

test('onboarding live: name step, lane step, and themed shell are present', async ({ page }) => {
  test.skip(!supabaseUrl || !serviceRoleKey, 'Skipping onboarding-live: missing Supabase service credentials.')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const email = `onboarding-live-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`
  const password = `LiveCheck-${randomUUID()}!`
  let userId: string | null = null

  try {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (created.error || !created.data.user?.id) {
      throw new Error(`Failed to create fixture user: ${created.error?.message ?? 'missing user id'}`)
    }

    userId = created.data.user.id

    const generated = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${baseUrl}/onboarding` },
    })

    if (generated.error || !generated.data.properties?.hashed_token || !generated.data.properties?.verification_type) {
      throw new Error(`Failed to generate magic link: ${generated.error?.message ?? 'missing token data'}`)
    }

    const callbackUrl = new URL('/auth/callback', baseUrl)
    callbackUrl.searchParams.set('token_hash', generated.data.properties.hashed_token)
    callbackUrl.searchParams.set('type', generated.data.properties.verification_type)
    callbackUrl.searchParams.set('next', '/onboarding')

    await page.goto(callbackUrl.toString(), { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/onboarding(?:$|[/?#])/, { timeout: 30_000 })
    // R-4 (2026-10-21): three screens. Screen one asks for the role lane and the posture together.
    await expect(page.getByRole('heading', { name: /Which role lanes are you targeting\?/i })).toBeVisible()
    await expect(page.getByText(/Where are you right now\?/i)).toBeVisible()

    const shellClass = await page.locator('div.min-h-screen').first().getAttribute('class')
    expect(shellClass ?? '').toContain('bg-background')

    const continueButton = page.getByRole('button', { name: /^Continue$/i })
    await expect(continueButton).toBeDisabled()
    await page.getByRole('button', { name: /^Executive/i }).first().click()
    await page.getByRole('button', { name: /Actively searching/i }).first().click()
    await expect(continueButton).toBeEnabled()
    await continueButton.click()

    await expect(page.getByRole('heading', { name: /Which companies are you targeting\?/i })).toBeVisible({ timeout: 15_000 })

    // Skipping from any screen lands on the three-zone dashboard; Zone 1 carries the remaining setup.
    await page.getByRole('button', { name: /^Skip setup$/i }).click()
    await expect(page).toHaveURL(/\/dashboard(?:$|[?#])/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1, name: /What should I do today\?/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /^Progress$/i }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-first-mile-section="dashboard_next_move"]')).toBeVisible({ timeout: 15_000 })
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId)
    }
  }
})