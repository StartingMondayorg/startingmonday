import { test, expect, type Page } from '@playwright/test'

async function createCampaign(page: Page, name: string) {
  await page.goto('/dashboard/companies/new')
  await page.fill('input[name="name"]', name)
  await page.selectOption('select[name="stage"]', 'watching')
  await page.fill('input[name="sector"]', 'Technology')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard\//, { timeout: 20_000 }).catch(() => {})
}

async function ensureTimelineData(page: Page) {
  await page.goto('/dashboard')
  const section = page.locator('section').filter({ hasText: 'Required next-decision markers' }).first()
  const emptyState = section.getByText('No campaigns yet. Add your first target to initialize timeline markers.')
  if (!(await emptyState.isVisible().catch(() => false))) return

  const seedPrefix = `Timeline Smoke ${Date.now()}`
  for (let i = 1; i <= 7; i += 1) {
    await createCampaign(page, `${seedPrefix} ${i}`)
  }

  await page.goto('/dashboard')
}

test('timeline sort, paging, and owner assignment work on staging', async ({ page, baseURL }) => {
  await page.goto('/dashboard')

  if (/\/login(?:$|[/?#])/.test(page.url())) {
    test.skip(true, 'Authenticated session unavailable for dashboard smoke.')
  }

  if (!baseURL?.includes('staging')) {
    test.skip(true, 'This smoke test is intended for staging only.')
  }

  await ensureTimelineData(page)

  const timelineHeading = page.getByRole('heading', { name: 'Required next-decision markers', exact: true }).filter({ visible: true })
  await expect(timelineHeading).toBeVisible()
  const section = timelineHeading.locator('xpath=ancestor::section[1]')

  await section.getByRole('link', { name: 'Name A-Z' }).click()
  await page.waitForURL(/timelineSort=name_asc/, { timeout: 10_000 })

  await section.getByRole('link', { name: 'Recently moved' }).click()
  await page.waitForURL(/timelineSort=recent_desc/, { timeout: 10_000 })

  await section.getByRole('link', { name: 'Stalled first' }).click()
  await page.waitForURL(/timelineSort=stalled_desc/, { timeout: 10_000 })

  const pageLabel = section.getByText(/^Page \d+ of \d+$/).first()
  await expect(pageLabel).toBeVisible()

  const beforePage = (await pageLabel.textContent())?.trim() ?? ''
  await section.getByRole('link', { name: 'Next' }).click()
  await page.waitForURL(/timelinePage=1/, { timeout: 10_000 })
  const afterPage = (await pageLabel.textContent())?.trim() ?? ''
  expect(afterPage).not.toBe(beforePage)

  const firstCard = section.locator('article').first()
  const ownerTextNode = firstCard.locator('span:has-text("Owner:")').locator('xpath=..')
  const ownerBefore = ((await ownerTextNode.textContent()) ?? '').replace('Owner:', '').trim()

  const targetOwner = ownerBefore === 'Coach' ? 'Partner' : 'Coach'
  await firstCard.locator('select[name="decision_owner"]').selectOption(targetOwner)
  await firstCard.getByRole('button', { name: 'Save' }).click()
  await page.waitForLoadState('networkidle')

  const ownerAfter = ((await ownerTextNode.textContent()) ?? '').replace('Owner:', '').trim()
  expect(ownerAfter).toBe(targetOwner)
})

test('timeline sort and paging render safely on production', async ({ page }) => {
  const allowWrite = process.env.PLAYWRIGHT_PROD_WRITE === '1'
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

  if (/\/login(?:$|[/?#])/.test(page.url())) {
    test.skip(true, 'Authenticated session unavailable for production dashboard smoke.')
  }

  const timelineHeading = page.getByRole('heading', { name: 'Required next-decision markers', exact: true }).filter({ visible: true })
  await expect(timelineHeading).toBeVisible()
  const section = timelineHeading.locator('xpath=ancestor::section[1]')

  const emptyState = section.getByText('No campaigns yet. Add your first target to initialize timeline markers.')
  if (await emptyState.isVisible().catch(() => false)) {
    await expect(emptyState).toBeVisible()
    return
  }

  await section.getByRole('link', { name: 'Name A-Z' }).click()
  await page.waitForURL(/timelineSort=name_asc/, { timeout: 10_000 })

  await section.getByRole('link', { name: 'Recently moved' }).click()
  await page.waitForURL(/timelineSort=recent_desc/, { timeout: 10_000 })

  await section.getByRole('link', { name: 'Stalled first' }).click()
  await page.waitForURL(/timelineSort=stalled_desc/, { timeout: 10_000 })

  const pageLabel = section.getByText(/^Page \d+ of \d+$/).first()
  if (await pageLabel.isVisible().catch(() => false)) {
    const beforePage = (await pageLabel.textContent())?.trim() ?? ''
    await section.getByRole('link', { name: 'Next' }).click()
    await page.waitForURL(/timelinePage=1/, { timeout: 10_000 })
    const afterPage = (await pageLabel.textContent())?.trim() ?? ''
    expect(afterPage).not.toBe(beforePage)
  }

  if (!allowWrite) return

  const firstCard = section.locator('article').first()
  const ownerTextNode = firstCard.locator('span:has-text("Owner:")').locator('xpath=..')
  const ownerBefore = ((await ownerTextNode.textContent()) ?? '').replace('Owner:', '').trim()
  const targetOwner = ownerBefore === 'Coach' ? 'Partner' : 'Coach'
  await firstCard.locator('select[name="decision_owner"]').selectOption(targetOwner)
  await firstCard.getByRole('button', { name: 'Save' }).click()
  await page.waitForLoadState('networkidle')

  const ownerAfter = ((await ownerTextNode.textContent()) ?? '').replace('Owner:', '').trim()
  expect(ownerAfter).toBe(targetOwner)
})
