import { test, expect } from '@playwright/test'

const userA = {
  email: process.env.PLAYWRIGHT_ISOLATION_USER_A_EMAIL,
  password: process.env.PLAYWRIGHT_ISOLATION_USER_A_PASSWORD,
}
const userB = {
  email: process.env.PLAYWRIGHT_ISOLATION_USER_B_EMAIL,
  password: process.env.PLAYWRIGHT_ISOLATION_USER_B_PASSWORD,
}

const isolationConfigured = Boolean(userA.email && userA.password && userB.email && userB.password)

async function signIn(page: import('@playwright/test').Page, credentials: typeof userA) {
  const response = await page.request.post('/api/auth/verify-and-signin', { data: credentials })
  expect(response.ok()).toBe(true)
}

test.describe('two-user tenant isolation', () => {
  test.skip(!isolationConfigured, 'Set the two dedicated isolation test accounts to run this suite.')

  test('user A company is not visible to user B', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    try {
      const pageA = await contextA.newPage()
      await signIn(pageA, userA)
      const companyName = `Isolation Probe ${Date.now()}`
      const createResponse = await pageA.request.post('/api/companies', {
        data: { name: companyName, sector: 'Technology', source: 'isolation-e2e' },
      })
      expect(createResponse.ok()).toBe(true)

      const pageB = await contextB.newPage()
      await signIn(pageB, userB)
      await pageB.goto('/dashboard')
      await expect(pageB.getByText(companyName, { exact: true })).toHaveCount(0)
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })
})