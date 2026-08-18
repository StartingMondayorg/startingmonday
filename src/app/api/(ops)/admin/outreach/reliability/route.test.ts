import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getStaffMember: vi.fn(),
  loadReliabilitySnapshotFromDb: vi.fn(),
  resolveReliabilityThresholds: vi.fn(),
  createAdminClient: vi.fn(() => ({})),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'sender@example.com' } } })) },
  }),
}))
vi.mock('@/lib/outreach/reliability-metrics', () => ({
  loadReliabilitySnapshotFromDb: state.loadReliabilitySnapshotFromDb,
  resolveReliabilityThresholds: state.resolveReliabilityThresholds,
}))

import { GET } from './route'

describe('admin outreach reliability route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
    state.resolveReliabilityThresholds.mockReturnValue({ minAcceptedRatePct: 97 })
    state.loadReliabilitySnapshotFromDb.mockResolvedValue({
      confidence: { score: 92, band: 'high', rationale: 'ok' },
      alerts: [],
    })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/admin/outreach/reliability')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns forbidden for non-staff', async () => {
    state.getStaffMember.mockResolvedValue(null)
    const req = new NextRequest('https://startingmonday.app/api/admin/outreach/reliability')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns reliability snapshot with parsed query params', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/outreach/reliability?windowDays=21&minAcceptedRatePct=99')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(state.resolveReliabilityThresholds).toHaveBeenCalled()
    expect(state.loadReliabilitySnapshotFromDb).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      windowDays: 21,
      thresholds: { minAcceptedRatePct: 97 },
    }))

    await expect(res.json()).resolves.toMatchObject({ ok: true, snapshot: { confidence: { score: 92 } } })
  })
})
