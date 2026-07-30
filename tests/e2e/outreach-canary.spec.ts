import { test, expect, type Page } from '@playwright/test'

async function requireAuthSessionOrSkip(page: Page) {
  await page.goto('/dashboard')
  test.skip(/\/login(?:$|[/?#])/.test(page.url()), 'Skipping outreach canary: auth session unavailable')
}

test('Outreach Canary: server template draft + dry-run gate pass', async ({ page }) => {
  await requireAuthSessionOrSkip(page)
  await page.goto('/dashboard/outreach')
  test.skip(!/\/dashboard\/outreach(?:$|[/?#])/.test(page.url()), 'Skipping outreach canary: staff access unavailable')
  await expect(page.getByRole('heading', { name: 'Outreach Hub' })).toBeVisible()

  const rows = page.locator('button').filter({ hasText: 'Review and send on right' })
  const rowCount = await rows.count()
  test.skip(rowCount === 0, 'Skipping outreach canary: no outreach rows available in this environment')

  await rows.first().click()
  const selectedRowText = await page.locator('button.bg-slate-50').first().innerText()
  const selectedLines = selectedRowText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const fullName = selectedLines[0] ?? 'there'
  const roleCompanyLine = selectedLines.find(line => line.includes('·')) ?? ''
  const roleCompany = roleCompanyLine.split('·').map(part => part.trim())
  const roleBucket = roleCompany[0] ?? 'Executive'
  const company = roleCompany[1] ?? ''
  const emailTo = selectedLines.find(line => /@/.test(line)) ?? ''

  const channelButtonText = await page
    .locator('button.bg-slate-900.text-white')
    .first()
    .innerText()
    .catch(() => 'Executives')

  const outreachChannel = channelButtonText.toLowerCase().replace(/\s+/g, '_')
  const personaFocus = roleBucket

  const templateRes = await page.request.post('/api/outreach/template', {
    data: {
      fullName,
      company,
      roleBucket,
      outreachChannel,
      personaFocus,
      templateStep: 'first_touch',
    },
    failOnStatusCode: false,
  })
  expect(templateRes.status()).toBe(200)
  const templatePayload = await templateRes.json()
  const subject = String(templatePayload.subject ?? '')
  const message = String(templatePayload.body ?? '')

  expect(subject.trim().length).toBeGreaterThan(6)
  expect(message.trim().length).toBeGreaterThan(80)

  const combined = `${subject}\n${message}`
  const bannedPatterns = [
    /\bsimple\s+[a-z]{2,8}\s+first-call\s+plan\b/i,
    /\bmomentum signal\b/i,
    /search\s+momentum\s+is\s+critical/i,
    /pilot\s+group\s*\(\s*n\s*=\s*27\s*\)/i,
    /\(\s*n\s*=\s*27\s*\)/i,
    /if useful,\s*reply yes and i will send/i,
  ]
  for (const pattern of bannedPatterns) {
    expect(combined).not.toMatch(pattern)
  }

  const sendMode = page.getByLabel('Select send mode')
  await sendMode.selectOption('dry_run')

  const dryRun = await page.request.post('/api/outreach/send', {
    data: {
      fullName,
      company,
      roleBucket,
      emailTo,
      subject,
      messageText: message,
      mode: 'dry_run',
      outreachChannel,
      personaFocus,
    },
    failOnStatusCode: false,
  })

  const dryRunPayload = await dryRun.json().catch(() => ({}))
  expect(dryRun.status(), `Dry run should pass for outreach canary, got ${dryRun.status()} (${JSON.stringify(dryRunPayload)})`).toBe(200)
  expect(dryRunPayload.council?.minScore).toBe(80)
})
