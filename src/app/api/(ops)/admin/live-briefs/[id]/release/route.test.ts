import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({
  requireLiveBriefMutationAccess: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/live-brief-auth', () => ({ requireLiveBriefMutationAccess: mocked.requireLiveBriefMutationAccess }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { POST } from './route'

const auth = { userId: 'user-1', userEmail: 'mo@example.com', staff: { id: 'staff-1', role: 'admin' } }
const context = { params: Promise.resolve({ id: 'request-1' }) }

function request() {
  return new NextRequest('http://localhost/api/admin/live-briefs/request-1/release', { method: 'POST' })
}

function configureAdmin(eventError: Error | null = null) {
  const current = vi.fn().mockResolvedValue({ data: { status: 'ready_for_review' }, error: null })
  const artifact = vi.fn().mockResolvedValue({ data: { id: 'artifact-1', version: 1 }, error: null })
  const deliverySingle = vi.fn().mockResolvedValue({ data: { id: 'delivery-1', expires_at: '2026-08-27T00:00:00.000Z' }, error: null })
  const deliveryInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: deliverySingle }) })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockReturnValue({ eq: deleteEq })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: artifact }) }) }) }) })
    .mockReturnValueOnce({ insert: deliveryInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ delete: remove })
  mocked.createAdminClient.mockReturnValue({ from })
  return { deliveryInsert, eventInsert, remove, update }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs/[id]/release', () => {
  it('requires a finalized request before issuing a delivery token', async () => {
    const current = vi.fn().mockResolvedValue({ data: { status: 'reviewing' }, error: null })
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    mocked.createAdminClient.mockReturnValue({ from })
    const response = await POST(request(), context)
    expect(response.status).toBe(409)
  })

  it('stores only a token digest and returns the raw token once', async () => {
    const { deliveryInsert, eventInsert, update } = configureAdmin()
    const response = await POST(request(), context)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toEqual({ delivery_id: 'delivery-1', token: expect.stringMatching(/^[A-Za-z0-9_-]+$/), expires_at: '2026-08-27T00:00:00.000Z' })
    expect(deliveryInsert).toHaveBeenCalledWith(expect.objectContaining({ artifact_id: 'artifact-1', token_digest: expect.stringMatching(/^[a-f0-9]{64}$/) }))
    expect(update).toHaveBeenCalledWith({ status: 'delivered' })
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'delivery_released' }))
  })

  it('rolls back delivery and status when the release event fails', async () => {
    const { eventInsert, remove } = configureAdmin(new Error('event write failed'))
    const response = await POST(request(), context)
    expect(response.status).toBe(500)
    expect(eventInsert).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
  })
})