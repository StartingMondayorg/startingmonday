import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({
  requireLiveBriefMutationAccess: vi.fn(),
  requireLiveBriefStaffAccess: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/live-brief-auth', () => ({ requireLiveBriefMutationAccess: mocked.requireLiveBriefMutationAccess, requireLiveBriefStaffAccess: mocked.requireLiveBriefStaffAccess }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { GET, POST } from './route'

const auth = { userId: 'user-1', userEmail: 'mo@example.com', staff: { id: 'staff-1', role: 'admin' } }

function configureAdmin() {
  const single = vi.fn().mockResolvedValue({ data: { id: 'request-1' }, error: null })
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
  const eventInsert = vi.fn().mockResolvedValue({ error: null })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockReturnValue({ eq: deleteEq })
  const from = vi.fn()
    .mockReturnValueOnce({ insert })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ delete: remove })
  mocked.createAdminClient.mockReturnValue({ from })
  return { insert, eventInsert, remove }
}

function configureListAdmin() {
  const rows = vi.fn().mockResolvedValue({
    data: [{ id: 'request-1', prospect_name: 'Alex Prospect', status: 'draft' }],
    error: null,
  })
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: rows }) }),
  })
  mocked.createAdminClient.mockReturnValue({ from })
}

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/live-briefs', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const validBody = {
  prospect_name: 'Alex Prospect',
  prospect_email: 'Alex@example.com',
  source_text_encrypted_ref: 'vault://source-1',
  consent_attested_at: '2026-08-20T12:00:00.000Z',
  consent_source: 'forwarded email message msg-1',
  request_source: 'inbound_email',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
  mocked.requireLiveBriefStaffAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs', () => {
  it('fails before database access when staff/recent-auth access is absent', async () => {
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(null)
    const response = await POST(request(validBody))
    expect(response.status).toBe(403)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects missing consent provenance and source reference', async () => {
    const response = await POST(request({ ...validBody, consent_source: '', source_text_encrypted_ref: '' }))
    expect(response.status).toBe(400)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects a non-object JSON body', async () => {
    const response = await POST(request(null as never))
    expect(response.status).toBe(400)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('creates a minimized request and immutable creation event', async () => {
    const { insert, eventInsert } = configureAdmin()
    const response = await POST(request(validBody))
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: 'request-1' })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      requested_by_user_id: auth.userId,
      prospect_email: 'alex@example.com',
      source_text_encrypted_ref: 'vault://source-1',
    }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      request_id: 'request-1',
      event_type: 'request_created',
      actor_user_id: auth.userId,
    }))
  })

  it('cleans up the request when the creation event fails', async () => {
    const { eventInsert, remove } = configureAdmin()
    eventInsert.mockResolvedValue({ error: new Error('event write failed') })
    const response = await POST(request(validBody))
    expect(response.status).toBe(500)
    expect(remove).toHaveBeenCalled()
  })
})

describe('GET /api/admin/live-briefs', () => {
  it('requires staff and recent-auth access before listing requests', async () => {
    mocked.requireLiveBriefStaffAccess.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(403)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns minimized request metadata without the source reference', async () => {
    configureListAdmin()
    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      requests: [{ id: 'request-1', prospect_name: 'Alex Prospect', status: 'draft' }],
    })
  })
})