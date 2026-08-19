import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { isEnabledFlag } from '@/lib/feature-flags'

const TIER_0_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  ...(isEnabledFlag(process.env.NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED) ? ['/example'] : []),
]

test.describe('tier-0 accessibility gate', () => {
  for (const route of TIER_0_PUBLIC_ROUTES) {
    test(`${route} has no serious or critical axe violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' })

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      const blockingViolations = results.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
      )

      expect(blockingViolations, blockingViolations
        .map((violation) => `${violation.id}: ${violation.description}`)
        .join('\n'))
        .toEqual([])
    })
  }
})
