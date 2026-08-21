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
const request = new NextRequest('https://startingmonday.app/api/admin/live-briefs/request-1/delete', { method: 'POST' })

function configureAdmin() {
  const current = vi.fn().mockResolvedValue({ data: { status: 'delivered' }, error: null })
  const deliveryFilter = vi.fn().mockResolvedValue({ error: null })
  const artifactFilter = vi.fn().mockResolvedValue({ error: null })
  const runs = vi.fn().mockResolvedValue({ data: [{ id: 'run-1' }], error: null })
  const scanFilter = vi.fn().mockResolvedValue({ error: null })
  const scanUpdate = vi.fn().mockReturnValue({ in: scanFilter })
  const requestUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const eventInsert = vi.fn().mockResolvedValue({ error: null })
  const artifactUpdate = vi.fn().mockReturnValue({ eq: artifactFilter })
  const deliveryUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ is: deliveryFilter }) })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    .mockReturnValueOnce({ update: deliveryUpdate })
    .mockReturnValueOnce({ update: artifactUpdate })
    .mockReturnValueOnce({ update: scanUpdate })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'run-1' }], error: null }) }) })
    .mockReturnValueOnce({ update: requestUpdate })
    .mockReturnValueOnce({ insert: eventInsert })
  mocked.createAdminClient.mockReturnValue({ from })
  return { deliveryUpdate, artifactUpdate, scanUpdate, requestUpdate, eventInsert, runs }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs/[id]/delete', () => {
  it('requires mutation access', async () => {
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(null)
    expect((await POST(request, context)).status).toBe(403)
  })

  it('redacts private content, revokes delivery, and journals deletion', async () => {
    const { deliveryUpdate, artifactUpdate, scanUpdate, requestUpdate, eventInsert } = configureAdmin()
    const response = await POST(request, context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ deleted: true, id: 'request-1' })
    expect(deliveryUpdate).toHaveBeenCalledWith({ revoked_at: expect.any(String), revoked_by_user_id: auth.userId })
    expect(artifactUpdate).toHaveBeenCalledWith({ brief_payload: {}, content_hash: expect.stringMatching(/^[a-f0-9]{64}$/) })
    expect(scanUpdate).toHaveBeenCalledWith({ evidence_summary: [], error_class: 'redacted', observed_at: expect.any(String) })
    expect(requestUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'deleted', reviewed_profile: {} }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'request_deleted' }))
  })
})