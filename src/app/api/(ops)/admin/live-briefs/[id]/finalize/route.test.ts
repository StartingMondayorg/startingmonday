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
const body = { brief_payload: { title: 'Executive positioning', sections: ['proof'] } }

function request(value: unknown) {
  return new NextRequest('http://localhost/api/admin/live-briefs/request-1/finalize', {
    method: 'POST', body: JSON.stringify(value), headers: { 'content-type': 'application/json' },
  })
}

function configureAdmin(eventError: Error | null = null) {
  const current = vi.fn().mockResolvedValue({ data: { status: 'reviewing' }, error: null })
  const latest = vi.fn().mockResolvedValue({ data: { version: 1 }, error: null })
  const artifactSingle = vi.fn().mockResolvedValue({ data: { id: 'artifact-2', version: 2, content_hash: 'a'.repeat(64) }, error: null })
  const artifactInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: artifactSingle }) })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockReturnValue({ eq: deleteEq })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: current }) }) })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: latest }) }) }) }) })
    .mockReturnValueOnce({ insert: artifactInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ delete: remove })
  mocked.createAdminClient.mockReturnValue({ from })
  return { artifactInsert, eventInsert, remove }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs/[id]/finalize', () => {
  it('requires mutation access and a JSON object payload', async () => {
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(null)
    expect((await POST(request(body), context)).status).toBe(403)
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
    expect((await POST(request({ brief_payload: [] }), context)).status).toBe(400)
  })

  it('creates the next hashed artifact version and journals finalization', async () => {
    const { artifactInsert, eventInsert } = configureAdmin()
    const response = await POST(request(body), context)
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ artifact_id: 'artifact-2', version: 2, content_hash: 'a'.repeat(64) })
    expect(artifactInsert).toHaveBeenCalledWith(expect.objectContaining({ request_id: 'request-1', version: 2, content_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'brief_finalized' }))
  })

  it('removes the artifact and restores status when the event fails', async () => {
    const { eventInsert, remove } = configureAdmin(new Error('event write failed'))
    const response = await POST(request(body), context)
    expect(response.status).toBe(500)
    expect(eventInsert).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
  })
})