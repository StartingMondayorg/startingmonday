import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getStaffMember: vi.fn(),
  summarizeOutreachSendBatch: vi.fn(),
  batchMaybeSingle: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/outreach/send-queue', () => ({ summarizeOutreachSendBatch: state.summarizeOutreachSendBatch }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'sender@example.com' } } })) },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (_table: string) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        maybeSingle: state.batchMaybeSingle,
      }
      return query
    },
  }),
}))

import { GET } from './route'

describe('outreach send batch-status route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
    state.batchMaybeSingle.mockResolvedValue({
      data: {
        id: 'batch_1',
        user_id: 'u_1',
        mode: 'live',
      },
    })
    state.summarizeOutreachSendBatch.mockResolvedValue({
      batchId: 'batch_1',
      status: 'processing',
      summary: {
        totalJobs: 3,
        queuedJobs: 1,
        sendingJobs: 1,
        acceptedJobs: 1,
        deliveredJobs: 0,
        bouncedJobs: 0,
        complainedJobs: 0,
        repliedJobs: 0,
        failedJobs: 0,
        completedJobs: 1,
        failedRecipients: [],
      },
    })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })

    const req = new NextRequest('https://startingmonday.app/api/outreach/send/batch-status?batchId=batch_1')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const req = new NextRequest('https://startingmonday.app/api/outreach/send/batch-status?batchId=batch_1')
    const res = await GET(req)

    expect(res.status).toBe(403)
  })

  it('returns 400 when batchId is missing', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send/batch-status')
    const res = await GET(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'batchId is required.' })
  })

  it('returns 404 when batch is not found', async () => {
    state.batchMaybeSingle.mockResolvedValue({ data: null })

    const req = new NextRequest('https://startingmonday.app/api/outreach/send/batch-status?batchId=batch_missing')
    const res = await GET(req)

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({ error: 'Batch not found.' })
    expect(state.summarizeOutreachSendBatch).not.toHaveBeenCalled()
  })

  it('returns refreshed batch summary', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send/batch-status?batchId=batch_1')
    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      batchId: 'batch_1',
      mode: 'live',
      status: 'processing',
      requestedCount: 3,
    })
    expect(state.summarizeOutreachSendBatch).toHaveBeenCalledTimes(1)
  })
})
