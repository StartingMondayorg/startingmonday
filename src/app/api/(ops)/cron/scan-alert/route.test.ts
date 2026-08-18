import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  createAdminClient: vi.fn(),
  sendEmail: vi.fn(),
  getOwnerEmail: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest: state.validateCronRequest }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/owner-email', () => ({ getOwnerEmail: state.getOwnerEmail }))

import { GET } from './route'

describe('src/app/api/cron/scan-alert/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.validateCronRequest.mockReturnValue(true)
    state.getOwnerEmail.mockReturnValue(undefined)
    state.createAdminClient.mockReturnValue({
      from: vi.fn(),
    })
    state.sendEmail.mockResolvedValue({ data: null, error: null })
  })

  it('returns a clean 200 for health probes without hitting the database', async () => {
    const req = new NextRequest('https://startingmonday.app/api/cron/scan-alert?mode=health&secret=test')
    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      checked: 0,
      alerted: 0,
      mode: 'health',
      skipped: true,
    })
    expect(state.createAdminClient).not.toHaveBeenCalled()
    expect(state.sendEmail).not.toHaveBeenCalled()
  })

  it('returns a clean 200 when notification email is not configured', async () => {
    const req = new NextRequest('https://startingmonday.app/api/cron/scan-alert?secret=test')
    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      checked: 0,
      alerted: 0,
      mode: 'live',
      skipped: true,
      reason: 'OWNER_EMAIL or NOTIFY_EMAIL not configured',
    })
    expect(state.createAdminClient).not.toHaveBeenCalled()
    expect(state.sendEmail).not.toHaveBeenCalled()
  })
})
