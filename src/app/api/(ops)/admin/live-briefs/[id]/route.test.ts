import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({
  requireLiveBriefMutationAccess: vi.fn(),
  requireLiveBriefStaffAccess: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/live-brief-auth', () => ({ requireLiveBriefMutationAccess: mocked.requireLiveBriefMutationAccess, requireLiveBriefStaffAccess: mocked.requireLiveBriefStaffAccess }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { GET, PATCH } from './route'

const auth = { userId: 'user-1', userEmail: 'mo@example.com', staff: { id: 'staff-1', role: 'admin' } }
const context = { params: Promise.resolve({ id: 'request-1' }) }

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/live-briefs/request-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function configureAdmin(eventError: Error | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { reviewed_profile: { source: 'original' }, status: 'draft' },
    error: null,
  })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update })
  mocked.createAdminClient.mockReturnValue({ from })
  return { eventInsert, update, updateEq }
}

function configureDetailAdmin() {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'request-1', prospect_name: 'Alex Prospect', reviewed_profile: { title: 'VP' }, status: 'reviewing' },
    error: null,
  })
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
  })
  mocked.createAdminClient.mockReturnValue({ from })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
  mocked.requireLiveBriefStaffAccess.mockResolvedValue(auth)
})

describe('PATCH /api/admin/live-briefs/[id]', () => {
  it('requires mutation access before reading the request', async () => {
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(null)
    const response = await PATCH(request({ reviewed_profile: {} }), context)
    expect(response.status).toBe(403)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects arrays and missing reviewed profiles', async () => {
    configureAdmin()
    const response = await PATCH(request({ reviewed_profile: [] }), context)
    expect(response.status).toBe(400)
  })

  it('updates the reviewed profile and records the event', async () => {
    const { eventInsert, update } = configureAdmin()
    const response = await PATCH(request({ reviewed_profile: { title: 'VP Operations' } }), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'request-1', status: 'reviewing' })
    expect(update).toHaveBeenCalledWith({ reviewed_profile: { title: 'VP Operations' }, status: 'reviewing' })
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      request_id: 'request-1',
      event_type: 'profile_reviewed',
    }))
  })

  it('reverts the profile when the event cannot be recorded', async () => {
    const { eventInsert, update } = configureAdmin(new Error('event write failed'))
    const response = await PATCH(request({ reviewed_profile: { title: 'VP Operations' } }), context)
    expect(response.status).toBe(500)
    expect(eventInsert).toHaveBeenCalled()
    expect(update).toHaveBeenLastCalledWith({ reviewed_profile: { source: 'original' }, status: 'draft' })
  })
})

describe('GET /api/admin/live-briefs/[id]', () => {
  it('requires staff and recent-auth access before loading a request', async () => {
    mocked.requireLiveBriefStaffAccess.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/admin/live-briefs/request-1'), context)
    expect(response.status).toBe(403)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns request metadata and reviewed profile without source references', async () => {
    configureDetailAdmin()
    const response = await GET(new NextRequest('http://localhost/api/admin/live-briefs/request-1'), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      request: { id: 'request-1', prospect_name: 'Alex Prospect', reviewed_profile: { title: 'VP' }, status: 'reviewing' },
    })
  })
})