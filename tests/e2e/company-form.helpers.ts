import type { Page } from '@playwright/test'

export async function selectCompanyStage(page: Page, stage: string) {
  await page.locator('#company-stage').click()
  await page.getByRole('option', { name: stage, exact: true }).click()
}