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
    await expect(page.getByPlaceholder('Your full name')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Let.s find roles before the crowd sees them\./i })).toBeVisible()

    const shellClass = await page.locator('div.min-h-screen').first().getAttribute('class')
    expect(shellClass ?? '').toContain('bg-background')

    await page.getByPlaceholder('Your full name').fill('Live Onboarding Check')
    await page.getByRole('button', { name: /^Start setup$/i }).click()
    await expect(page.getByRole('heading', { name: /Build your profile\./i })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Skip setup$/i }).click()
    await expect(page).toHaveURL(/\/dashboard\/start(?:$|[/?#])/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /your search is live\./i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /Today.s one action: Upload your resume or import LinkedIn/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Go to profile/i }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Add your first target company/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Generate your first prep brief/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Add your first contact/i).first()).toBeVisible({ timeout: 15_000 })

    await page.getByRole('link', { name: /Skip to dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard(?:$|[/?#])/, { timeout: 15_000 })
    // Completed-step count for a fresh account depends on profile defaults; assert the banner, not the number.
    await expect(page.getByText(/\d of 6 steps complete/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /^Setup$/i })).toBeVisible({ timeout: 15_000 })
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId)
    }
  }
})