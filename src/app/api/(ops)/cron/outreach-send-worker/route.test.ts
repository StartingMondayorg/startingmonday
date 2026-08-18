import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  processOutreachSendJobs: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest: state.validateCronRequest }))
vi.mock('@/lib/outreach/send-queue', () => ({ processOutreachSendJobs: state.processOutreachSendJobs }))

import { GET } from './route'

describe('outreach-send-worker cron route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.validateCronRequest.mockReturnValue(true)
    state.processOutreachSendJobs.mockResolvedValue({
      ok: true,
      workerId: 'worker_1',
      processed: 1,
      accepted: 1,
      failed: 0,
      retried: 0,
      bucketCounts: { gmail: 0, microsoft: 0, corporate: 1 },
    })
  })

  it('rejects unauthorized cron requests', async () => {
    state.validateCronRequest.mockReturnValue(false)

    const req = new NextRequest('https://startingmonday.app/api/cron/outreach-send-worker')
    const res = await GET(req)

    expect(res.status).toBe(401)
    expect(state.processOutreachSendJobs).not.toHaveBeenCalled()
  })

  it('uses default limit when query is missing/invalid', async () => {
    const req = new NextRequest('https://startingmonday.app/api/cron/outreach-send-worker?limit=abc')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(state.processOutreachSendJobs).toHaveBeenCalledWith({ limit: 10 })
  })

  it('passes through numeric limit', async () => {
    const req = new NextRequest('https://startingmonday.app/api/cron/outreach-send-worker?limit=7')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(state.processOutreachSendJobs).toHaveBeenCalledWith({ limit: 7 })
  })

  it('returns 500 when worker processing fails', async () => {
    state.processOutreachSendJobs.mockResolvedValue({ ok: false, error: 'db unavailable', processed: 0, workerId: 'worker_2' })

    const req = new NextRequest('https://startingmonday.app/api/cron/outreach-send-worker')
    const res = await GET(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({
      error: 'db unavailable',
      result: { ok: false, workerId: 'worker_2' },
    })
  })
})
