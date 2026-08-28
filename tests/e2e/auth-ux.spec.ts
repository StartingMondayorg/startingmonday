import { test, expect } from '@playwright/test'

test.describe('Auth UX contract and visual guard @auth-ux', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    })
  })

  test('login contract forbids jump navigation block', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: /^Sign in$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign in$/i })).toHaveClass(/!bg-primary/)
    await expect(page.locator('body')).not.toContainText(/jump to section/i)
    await expect(page.locator('a[href="#login-social"]')).toHaveCount(0)
    await expect(page.locator('a[href="#login-password"]')).toHaveCount(0)
    await expect(page.locator('a[href="#login-magic-link"]')).toHaveCount(0)
  })

  test('login visual baseline remains professional', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot('auth-login-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    })
  })

  test('signup visual baseline remains professional', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForTimeout(300)

    await expect(page.getByRole('button', { name: /^Start free trial$/i })).toHaveClass(/!bg-primary/)
    await expect(page.locator('main > div.w-full.max-w-sm')).toHaveScreenshot('auth-signup-desktop.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
      // Turnstile may be enabled in some environments and absent in others.
      // Mask it so the guard checks auth layout rather than captcha vendor rendering.
      mask: [
        page.locator('iframe[src*="challenges.cloudflare.com"]'),
        page.locator('text=Complete the security check before signing in.'),
      ],
    })
  })
})