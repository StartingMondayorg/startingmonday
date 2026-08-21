import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { GET } from './route'

const token = 'A'.repeat(43)
const context = { params: Promise.resolve({ token }) }

function request() {
  return new NextRequest(`https://startingmonday.app/api/live-brief/${token}`)
}

function configureAdmin({ revoked = null as string | null, expired = false, eventError = null as Error | null } = {}) {
  const delivery = vi.fn().mockResolvedValue({
    data: {
      id: 'delivery-1', request_id: 'request-1', artifact_id: 'artifact-1',
      expires_at: expired ? '2020-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z',
      revoked_at: revoked, first_opened_at: null, view_count: 0,
    }, error: null,
  })
  const artifact = vi.fn().mockResolvedValue({
    data: { id: 'artifact-1', version: 1, brief_payload: { title: 'VP' }, content_hash: 'a'.repeat(64) }, error: null,
  })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: delivery }) }) })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: artifact }) }) })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
  mocked.createAdminClient.mockReturnValue({ from })
  return { update, eventInsert }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllEnvs())

describe('GET /api/live-brief/[token]', () => {
  it('returns not found for malformed, expired, or revoked tokens', async () => {
    expect((await GET(request(), { params: Promise.resolve({ token: 'short' }) })).status).toBe(404)
    configureAdmin({ expired: true })
    expect((await GET(request(), context)).status).toBe(404)
    configureAdmin({ revoked: '2026-08-20T00:00:00.000Z' })
    expect((await GET(request(), context)).status).toBe(404)
  })

  it('returns the artifact and records an open event', async () => {
    const { update, eventInsert } = configureAdmin()
    const response = await GET(request(), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      delivery_id: 'delivery-1',
      capabilities: { people_to_know_handoff: false },
      artifact: { version: 1, brief_payload: { title: 'VP' }, content_hash: 'a'.repeat(64) },
    })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ view_count: 1 }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'delivery_opened' }))
  })

  it('does not expose the artifact when telemetry fails', async () => {
    const { update } = configureAdmin()
    update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: new Error('telemetry failed') }) })
    const response = await GET(request(), context)
    expect(response.status).toBe(500)
  })

  it('exposes the handoff capability only when explicitly enabled', async () => {
    vi.stubEnv('LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED', 'true')
    configureAdmin()

    const response = await GET(request(), context)
    const result = await response.json()

    expect(result.capabilities).toEqual({ people_to_know_handoff: true })
  })
})