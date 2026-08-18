import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

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
                  { event_name: 'shortlist_sprint_checkout_started', user_id: 'u1', created_at: '2026-06-10T10:02:00.000Z' },
                  { event_name: 'shortlist_sprint_purchased', user_id: 'u1', created_at: '2026-06-10T10:04:00.000Z' },
                  { event_name: 'shortlist_sprint_delivered', user_id: 'u1', created_at: '2026-06-10T11:04:00.000Z' },
                  { event_name: 'shortlist_sprint_credit_applied', user_id: 'u1', created_at: '2026-06-11T11:04:00.000Z' },
                ],
                error: null,
              }),
            }),
          }),
          eq: () => ({
            gte: () => ({
              limit: async () => ({
                data: [
                  { event_name: 'partner_pilot_seat_status_updated', user_id: 'u1', created_at: '2026-06-12T10:04:00.000Z', properties: { seat_owner: 'Seat A', next_status: 'active' } },
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
              data: [{ id: 'p1', name: 'Partner One', commission_pct: 20, seats_purchased: 4, is_active: true }],
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
                  shortlist_purchase_rate_from_checkout: 25,
                  shortlist_delivery_completion_rate: 85,
                  pilot_seats_active_rate: 75,
                  pilot_at_risk_seats: 0,
                  decision_summary: 'scale',
                  decision_motion1_direct_paid_sprint: 'scale',
                  decision_motion2_partner_pilot: 'scale',
                  decision_reasons: ['thresholds met'],
                },
              ],
              error: null,
            }),
          }),
        }),
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
                  success: true,
                  error_code: null,
                  error_message: null,
                  http_status: 200,
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'refund_workflow_triggers') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'signal_action_events') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { id: 'a1', user_id: 'u1', action_type: 'outreach_sent', created_at: '2026-06-10T10:30:00.000Z' },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'company_interview_logs') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { id: 'i1', user_id: 'u1', created_at: '2026-06-12T10:00:00.000Z' },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'referral_attributions') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { signup_user_id: 'u1', partner_id: 'p1', attributed_at: '2026-06-10T00:00:00.000Z' },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'users') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { id: 'u1', subscription_tier: 'active', subscription_status: 'active', created_at: '2026-06-10T00:00:00.000Z' },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'partner_programs') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { id: 'prog1', partner_id: 'p1', status: 'active', created_at: '2026-06-10T00:00:00.000Z', closed_at: null },
              ],
              error: null,
            }),
          }),
        }),
      }
    }

    if (table === 'marketing_spend_entries') {
      return {
        select: () => ({
          eq: () => ({
            gte: () => ({
              limit: async () => ({
                data: [
                  { motion: 'direct_paid_sprint', channel: 'paid_social', amount_usd: 120, effective_at: '2026-06-10T00:00:00.000Z' },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }
    }

    if (table === 'partner_commercial_events') {
      return {
        select: () => ({
          gte: () => ({
            limit: async () => ({
              data: [
                { partner_id: 'p1', event_type: 'pilot_fee_collected', amount_usd: 500, effective_at: '2026-06-15T00:00:00.000Z' },
                { partner_id: 'p1', event_type: 'expansion_proposal_sent', amount_usd: null, effective_at: '2026-06-18T00:00:00.000Z' },
                { partner_id: 'p1', event_type: 'expansion_accepted', amount_usd: null, effective_at: '2026-06-20T00:00:00.000Z' },
              ],
              error: null,
            }),
          }),
        }),
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

import { GET } from './route'

describe('wedge epic closeout route', () => {
  it('returns SMK-395/398/401 sections and excludes alumni motion', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/reporting/wedge-epic-closeout?lookbackDays=30')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json() as Record<string, unknown>

    expect(json.ok).toBe(true)
    expect(json).toHaveProperty('smk_395_paid_sprint_cohort_report')
    expect(json).toHaveProperty('smk_398_partner_pilot_outcomes_tracker')
    expect(json).toHaveProperty('smk_401_scale_stop_decision_memo')

    const paidReport = json.smk_395_paid_sprint_cohort_report as Record<string, unknown>
    const outcomeMetrics = paidReport.outcome_metrics_14_day as Record<string, unknown>
    expect(outcomeMetrics.pct_with_relationship_action_completed).toBe(100)
    expect(outcomeMetrics.pct_with_qualified_warm_conversation).toBe(100)
    const paidCommercial = paidReport.commercial_metrics as Record<string, unknown>
    expect(paidCommercial.net_revenue_after_refunds).toBe(199)
    expect(paidCommercial.direct_paid_marketing_spend_usd).toBe(120)

    const partnerTracker = json.smk_398_partner_pilot_outcomes_tracker as Record<string, unknown>
    const weeklyMetrics = partnerTracker.weekly_metrics as Record<string, unknown>
    expect(weeklyMetrics.relationship_actions_completed_per_seat).toBe(1)
    expect(weeklyMetrics.qualified_conversations_initiated).toBe(1)
    const partnerCommercial = partnerTracker.commercial_metrics as Record<string, unknown>
    expect(partnerCommercial.pilot_fee_collected).toBe(500)
    expect(partnerCommercial.expansion_proposal_sent).toBe(true)
    expect(partnerCommercial.expansion_accepted).toBe(true)

    const decisionMemo = json.smk_401_scale_stop_decision_memo as Record<string, unknown>
    const kpiScorecard = decisionMemo.kpi_scorecard as Record<string, unknown>
    expect(kpiScorecard.first_relationship_action_completion_7d_pct).toBe(100)
    const economics = decisionMemo.economics as Record<string, unknown>
    const cacByMotion = economics.cac_by_motion as Record<string, unknown>
    const grossMargin = economics.gross_margin_by_motion as Record<string, unknown>
    const paybackWindow = economics.payback_window as Record<string, unknown>
    expect(cacByMotion.direct_paid_sprint_usd_proxy).toBe(120)
    expect(cacByMotion.partner_pilot_usd_proxy).toBe(39.8)
    expect(grossMargin.partner_pilot_pct_proxy).toBe(80)
    expect(paybackWindow.direct_paid_sprint_months_proxy).toBe(0.6)
    expect(paybackWindow.partner_pilot_months_proxy).toBe(0.2)

    const memo = json.smk_401_scale_stop_decision_memo as Record<string, unknown>
    expect(Array.isArray(memo.motions_evaluated)).toBe(true)
    expect((memo.motions_evaluated as string[])).toHaveLength(2)
    expect((memo.motions_evaluated as string[]).join(' ')).not.toContain('Alumni')
  })
})
