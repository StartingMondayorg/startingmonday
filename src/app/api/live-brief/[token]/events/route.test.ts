import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { POST } from './route'

const token = 'A'.repeat(43)
const context = { params: Promise.resolve({ token }) }

function request(body: unknown) {
  return new NextRequest(`https://startingmonday.app/api/live-brief/${token}/events`, {
    method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
  })
}

function configureAdmin(rpc = vi.fn()) {
  const delivery = vi.fn().mockResolvedValue({
    data: { id: 'delivery-1', request_id: 'request-1', artifact_id: 'artifact-1', expires_at: '2099-01-01T00:00:00.000Z', revoked_at: null },
    error: null,
  })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: delivery }) }) })
    .mockReturnValueOnce({ update, insert: eventInsert })
    .mockReturnValueOnce({ insert: eventInsert })
  mocked.createAdminClient.mockReturnValue({ from, rpc })
  return { update, eventInsert, from, rpc }
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/live-brief/[token]/events', () => {
  it('rejects unsupported events and missing section names', async () => {
    expect((await POST(request({ event_type: 'delivery_opened' }), context)).status).toBe(400)
    expect((await POST(request({ event_type: 'delivery_section_viewed' }), context)).status).toBe(400)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('records a bounded section-view event', async () => {
    const { eventInsert } = configureAdmin()
    const response = await POST(request({ event_type: 'delivery_section_viewed', section: 'top-opportunities' }), context)
    expect(response.status).toBe(202)
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({
      request_id: 'request-1', delivery_id: 'delivery-1', event_type: 'delivery_section_viewed',
      event_payload: { section: 'top-opportunities' },
    }))
  })

  it('records CTA clicks and updates the delivery milestone', async () => {
    const { update, eventInsert } = configureAdmin()
    const response = await POST(request({ event_type: 'delivery_cta_clicked' }), context)
    expect(response.status).toBe(202)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ cta_clicked_at: expect.any(String) }))
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'delivery_cta_clicked' }))
  })

  it('records only an allowlisted count-only handoff destination', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    configureAdmin(rpc)

    expect((await POST(request({ event_type: 'delivery_handoff_clicked', destination: 'email' }), context)).status).toBe(400)
    const response = await POST(request({
      event_type: 'delivery_handoff_clicked',
      destination: 'linkedin',
      search_query: 'must not persist',
      email: 'must-not-persist@example.com',
    }), context)

    expect(response.status).toBe(202)
    expect(rpc).toHaveBeenCalledWith('record_live_brief_handoff_click', {
      p_delivery_id: 'delivery-1',
      p_destination: 'linkedin',
    })
    expect(JSON.stringify(rpc.mock.calls)).not.toMatch(/search_query|must-not-persist/)
  })
})