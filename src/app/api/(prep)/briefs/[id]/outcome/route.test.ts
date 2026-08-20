import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  briefRow: null as null | Record<string, unknown>,
  updateError: null as null | { message: string },
  upsertError: null as null | { message: string },
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === 'briefs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: state.briefRow, error: state.briefRow ? null : { message: 'not found' } })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: state.updateError })),
            })),
          })),
        }
      }

      return {
        upsert: vi.fn(async () => ({ error: state.upsertError })),
      }
    }),
  })),
}))

describe('brief outcome route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u1' })
    state.logEvent.mockResolvedValue(undefined)
    state.captureServerEvent.mockReturnValue(undefined)
    state.briefRow = { id: 'brief-1', user_id: 'u1', company_id: 'company-1' }
    state.updateError = null
    state.upsertError = null
  })

  it('rejects invalid outcomes', async () => {
    const { POST } = await import('./route')
    const req = new Request('https://startingmonday.app/api/briefs/brief-1/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcome: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: 'brief-1' }) })
    expect(res.status).toBe(400)
  })

  it('stores dedicated outcome record and returns ok', async () => {
    const { POST } = await import('./route')
    const req = new Request('https://startingmonday.app/api/briefs/brief-1/outcome', {
      method: 'POST',
      body: JSON.stringify({ outcome: 'advanced' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: 'brief-1' }) })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, outcome: 'advanced' })
    expect(state.logEvent).toHaveBeenCalledWith('u1', 'prep_outcome_logged', expect.objectContaining({ brief_id: 'brief-1', outcome: 'advanced' }))
  })
})
