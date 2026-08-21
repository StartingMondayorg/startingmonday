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
  return new NextRequest('https://startingmonday.app/api/admin/live-briefs/request-1/revoke', { method: 'POST' })
}

function configureAdmin(eventError: Error | null = null) {
  const current = vi.fn().mockResolvedValue({ data: { status: 'delivered' }, error: null })
  const delivery = vi.fn().mockResolvedValue({ data: { id: 'delivery-1', revoked_at: null }, error: null })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: delivery }) }) }) }) }) })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ update })
  mocked.createAdminClient.mockReturnValue({ from })
  return { eventInsert, update }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs/[id]/revoke', () => {
  it('rejects requests that are not delivered', async () => {
    const current = vi.fn().mockResolvedValue({ data: { status: 'reviewing' }, error: null })
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    mocked.createAdminClient.mockReturnValue({ from })
    expect((await POST(request(), context)).status).toBe(409)
  })

  it('revokes the active delivery and journals the action', async () => {
    const { eventInsert, update } = configureAdmin()
    const response = await POST(request(), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ revoked: true, delivery_id: 'delivery-1', revoked_at: expect.any(String) })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ revoked_at: expect.any(String), revoked_by_user_id: auth.userId }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'delivery_revoked' }))
  })

  it('restores delivery and request state when the event fails', async () => {
    const { eventInsert, update } = configureAdmin(new Error('event write failed'))
    const response = await POST(request(), context)
    expect(response.status).toBe(500)
    expect(eventInsert).toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith({ status: 'delivered' })
    expect(update).toHaveBeenCalledWith({ revoked_at: null, revoked_by_user_id: null })
  })
})