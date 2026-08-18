import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))

import { POST } from './route'

describe('executive emotion-state score route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })

    const req = new NextRequest('https://startingmonday.app/api/executive-transition/emotion-state/score', {
      method: 'POST',
      body: '{}',
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid payload', async () => {
    const req = new NextRequest('https://startingmonday.app/api/executive-transition/emotion-state/score', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'u_1' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects mismatched user scope', async () => {
    const req = new NextRequest('https://startingmonday.app/api/executive-transition/emotion-state/score', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'u_2',
        stage: 'MARKET_ACTIVATION',
        signal_window: {
          cadence_adherence_pct: 60,
          outreach_volume: 3,
          followup_sla_miss_rate: 0.1,
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns score payload for valid request', async () => {
    const req = new NextRequest('https://startingmonday.app/api/executive-transition/emotion-state/score', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'u_1',
        stage: 'OFFER_DECISION',
        signal_window: {
          cadence_adherence_pct: 64,
          decision_lag_days: 12,
          context_completion_rate: 0.4,
          no_go_criteria_present: false,
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      state: expect.any(String),
      confidence: expect.any(Number),
      confidence_band: expect.any(String),
      top_signal_drivers: expect.any(Array),
      recommended_intervention_mode: expect.any(String),
      fallback_applied: expect.any(Boolean),
      evaluated_at: expect.any(String),
    })
  })
})
