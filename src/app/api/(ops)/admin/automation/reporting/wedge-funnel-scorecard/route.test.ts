import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  insertedAlerts: [] as Array<Record<string, unknown>>,
  upsertPayload: null as Record<string, unknown> | null,
}))

const mockSb = vi.hoisted(() => ({
  from: (table: string) => {
    if (table === 'user_events') {
      return {
        select: () => ({
          in: () => ({
            gte: () => ({
              limit: async () => ({
                data: [
                  { event_name: 'shortlist_sprint_viewed', user_id: 'u1', created_at: '2026-06-10T10:00:00.000Z' },
                  { event_name: 'shortlist_sprint_cta_clicked', user_id: 'u1', created_at: '2026-06-10T10:01:00.000Z' },
                  { event_name: 'shortlist_sprint_checkout_started', user_id: 'u1', created_at: '2026-06-10T10:02:00.000Z' },
                  { event_name: 'shortlist_sprint_checkout_started', user_id: 'u2', created_at: '2026-06-10T10:03:00.000Z' },
                  { event_name: 'shortlist_sprint_purchased', user_id: 'u1', created_at: '2026-06-10T10:04:00.000Z' },
                ],
                error: null,
              }),
            }),
          }),
          eq: () => ({
            gte: () => ({
              limit: async () => ({
                data: [
                  { event_name: 'partner_pilot_seat_status_updated', user_id: 'u1', created_at: '2026-06-10T10:04:00.000Z', properties: { seat_owner: 'Seat A', next_status: 'at_risk' } },
                  { event_name: 'partner_pilot_seat_status_updated', user_id: 'u1', created_at: '2026-06-11T10:04:00.000Z', properties: { seat_owner: 'Seat B', next_status: 'active' } },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }
    }

    if (table === 'partners') {
      return {
        select: () => ({
          eq: () => ({
            limit: async () => ({
              data: [{ id: 'p1', is_active: true }],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'wedge_funnel_weekly_scorecards') {
      return {
        select: () => ({
          order: () => ({
            limit: async () => ({
              data: [
                {
                  week_start: '2026-06-23',
                  generated_at: '2026-06-24T01:00:00.000Z',
                  lookback_days: 30,
                  shortlist_purchase_rate_from_checkout: 8,
                  shortlist_delivery_completion_rate: 0,
                  pilot_seats_active_rate: 66,
                  pilot_at_risk_seats: 1,
                  decision_summary: 'stop',
                },
                {
                  week_start: '2026-06-16',
                  generated_at: '2026-06-17T01:00:00.000Z',
                  lookback_days: 30,
                  shortlist_purchase_rate_from_checkout: 12,
                  shortlist_delivery_completion_rate: 40,
                  pilot_seats_active_rate: 70,
                  pilot_at_risk_seats: 0,
                  decision_summary: 'iterate',
                },
              ],
              error: null,
            }),
          }),
        }),
        upsert: (payload: Record<string, unknown>) => {
          state.upsertPayload = payload
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: 'snapshot_1',
                  week_start: payload.week_start,
                  generated_at: payload.generated_at,
                },
                error: null,
              }),
            }),
          }
        },
      }
    }

    if (table === 'wedge_funnel_scorecard_cron_runs') {
      return {
        select: () => ({
          order: () => ({
            limit: async () => ({
              data: [
                {
                  triggered_at: '2026-06-24T14:00:00.000Z',
                  finished_at: '2026-06-24T14:00:01.000Z',
                  duration_ms: 1000,
                  lookback_days: 30,
                  success: true,
                  error_code: null,
                  decision_summary: 'iterate',
                  snapshot_history_count: 3,
                  http_status: 200,
                  error_message: null,
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'automation_alerts') {
      return {
        insert: async (payload: Record<string, unknown>) => {
          state.insertedAlerts.push(payload)
          return { error: null }
        },
      }
    }

    return {
      select: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }
  },
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: async () => ({ ok: true, userId: 'automation_user', supabase: {}, response: new Response() }),
  asLooseSupabaseClient: () => mockSb,
}))

import { GET, POST } from './route'

describe('wedge funnel scorecard route', () => {
  beforeEach(() => {
    state.insertedAlerts = []
    state.upsertPayload = null
  })

  it('returns history and week-over-week trend in GET', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/reporting/wedge-funnel-scorecard?lookbackDays=30')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json() as Record<string, unknown>
    expect(Array.isArray(json.snapshot_history)).toBe(true)
    expect(Array.isArray(json.cron_runs)).toBe(true)
    expect((json.cron_runs as Array<Record<string, unknown>>)[0]?.success).toBe(true)
    expect((json.cron_runs as Array<Record<string, unknown>>)[0]?.error_code).toBeNull()
    expect(json.trend).toMatchObject({
      purchase_rate_from_checkout_delta: -4,
      delivery_completion_rate_delta: -40,
      seats_active_rate_delta: -4,
      at_risk_seats_delta: 1,
    })
  })

  it('persists weekly snapshot and logs high alert when decision is stop', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/reporting/wedge-funnel-scorecard', {
      method: 'POST',
      body: JSON.stringify({ lookbackDays: 30, referenceDate: '2026-06-29' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json() as Record<string, unknown>
    expect(json.persisted).toBe(true)
    expect(state.upsertPayload).toBeTruthy()
    expect(state.insertedAlerts).toHaveLength(1)
    expect(state.insertedAlerts[0]?.alert_code).toBe('wedge_scorecard_stop_decision')
  })
})
