import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  settingsVariant: null as string | null,
  notes: null as string | null,
  insertedRuns: [] as Array<Record<string, unknown>>,
  insertedAlerts: [] as Array<Record<string, unknown>>,
}))

const mockSb = vi.hoisted(() => ({
  from: (table: string) => {
    if (table === 'partners') {
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [{
                id: 'partner_1',
                name: 'Acme Outplacement',
                email: 'ops@acme.com',
                is_active: true,
                company: 'Acme',
                notes: state.notes,
              }],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'referral_attributions') {
      return {
        select: () => ({
          in: async () => ({
            data: [{ partner_id: 'partner_1', signup_user_id: 'u_1', attributed_at: '2026-06-03T10:00:00.000Z' }],
            error: null,
          }),
        }),
      }
    }

    if (table === 'user_events') {
      return {
        select: () => ({
          in: () => ({
            gte: () => ({
              lte: () => ({
                limit: async () => ({ data: [{ user_id: 'u_1', created_at: '2026-06-04T10:00:00.000Z' }], error: null }),
              }),
            }),
          }),
        }),
      }
    }

    if (table === 'briefs') {
      return {
        select: () => ({
          in: () => ({
            in: () => ({
              gte: () => ({
                lte: () => ({
                  limit: async () => ({ data: [{ user_id: 'u_1', created_at: '2026-06-05T10:00:00.000Z' }], error: null }),
                }),
              }),
            }),
          }),
        }),
      }
    }

    if (table === 'outreach_logs') {
      return {
        select: () => ({
          in: () => ({
            gte: () => ({
              lte: () => ({
                limit: async () => ({ data: [{ user_id: 'u_1', sent_at: '2026-06-06T10:00:00.000Z' }], error: null }),
              }),
            }),
          }),
        }),
      }
    }

    if (table === 'partner_program_settings') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { sponsor_template_variant: state.settingsVariant }, error: null }),
          }),
        }),
      }
    }

    if (table === 'monthly_business_review_runs') {
      return {
        insert: async (payload: Record<string, unknown>) => {
          state.insertedRuns.push(payload)
          return { error: null }
        },
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
      select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
      insert: async () => ({ error: null }),
    }
  },
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: async () => ({ ok: true, userId: 'automation_user', supabase: {}, response: new Response() }),
  asLooseSupabaseClient: () => mockSb,
}))

import { POST } from './route'

describe('sponsor export pipeline template selection', () => {
  beforeEach(() => {
    state.settingsVariant = null
    state.notes = null
    state.insertedRuns = []
    state.insertedAlerts = []
  })

  it('prefers partner_program_settings template over notes override', async () => {
    state.settingsVariant = 'enterprise_board'
    state.notes = 'SPONSOR_TEMPLATE_CONFIG:{"templateVariant":"growth_ops"}'

    const request = new NextRequest('https://startingmonday.app/api/admin/automation/reporting/sponsor-export-pipeline', {
      method: 'POST',
      body: JSON.stringify({ referenceDate: '2026-06-15' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const payload = state.insertedRuns[0]
    const reviewPayload = payload.review_payload as Record<string, unknown>
    const template = reviewPayload.template as Record<string, unknown>
    expect(template.variant).toBe('enterprise_board')
  })

  it('falls back to notes override when partner setting is invalid', async () => {
    state.settingsVariant = 'not_a_real_variant'
    state.notes = 'SPONSOR_TEMPLATE_CONFIG:{"templateVariant":"growth_ops"}'

    const request = new NextRequest('https://startingmonday.app/api/admin/automation/reporting/sponsor-export-pipeline', {
      method: 'POST',
      body: JSON.stringify({ referenceDate: '2026-06-15' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

    const payload = state.insertedRuns[0]
    const reviewPayload = payload.review_payload as Record<string, unknown>
    const template = reviewPayload.template as Record<string, unknown>
    expect(template.variant).toBe('growth_ops')
  })
})
