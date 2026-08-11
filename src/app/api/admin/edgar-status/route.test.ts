import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  freshnessState: vi.fn(),
  freshnessRun: vi.fn(),
  signalRun: vi.fn(),
  watchdogState: vi.fn(),
  providerQualityState: vi.fn(),
  compatHitState: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: state.requireStaffAutomationAccess }))

import { GET } from './route'

function buildSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'sec_freshness_audit_state') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: state.freshnessState,
            })),
          })),
        }
      }

      if (table === 'sec_ingestion_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: value === 'freshness-audit' ? state.freshnessRun : state.signalRun,
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'monitoring_alert_state') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => ({
              maybeSingle: value === 'edgar-heartbeat-watchdog'
                ? state.watchdogState
                : value === 'provider-quality-audit'
                  ? state.providerQualityState
                  : state.compatHitState,
            })),
          })),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/edgar-status/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.freshnessState.mockResolvedValue({ data: { last_status: 'fresh' } })
    state.freshnessRun.mockResolvedValue({
      data: {
        source: 'freshness-audit',
        status: 'ok',
        finished_at: '2026-08-10T18:00:00.000Z',
      },
    })
    state.signalRun.mockResolvedValue({
      data: {
        source: 'signal-job',
        status: 'ok',
        finished_at: '2026-08-10T17:00:00.000Z',
      },
    })
    state.watchdogState.mockResolvedValue({ data: { last_status: 'fresh' } })
    state.providerQualityState.mockResolvedValue({ data: { last_status: 'fresh' } })
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: 2,
          lastSeenAt: '2026-08-10T19:00:00.000Z',
        },
      },
    })

    state.requireStaffAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      supabase: buildSupabase(),
    })

    delete process.env.APOLLO_COMPAT_HIT_BUDGET
  })

  it('returns requireAuth response when auth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
    expect(state.requireStaffAutomationAccess).not.toHaveBeenCalled()
  })

  it('returns compatibility sunset readiness details in admin status payload', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '2'

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.status.providerQualityAudit).toBe('fresh')
    expect(payload.status.compatRouteUsage).toBe('active')
    expect(payload.compatibilitySunset).toMatchObject({
      route: '/api/cron/apollo-quality-audit',
      replacementRoute: '/api/cron/provider-quality-audit',
      hitCount: 2,
      hitBudget: 2,
      sunsetReady: true,
      lastSeenAt: '2026-08-10T19:00:00.000Z',
    })
    expect(payload.alertState.compatRouteUsage.alert_key).toBe('apollo-quality-audit-compat-hit')
    expect(typeof payload.compatibilitySunset.lastSeenAgeHours === 'number' || payload.compatibilitySunset.lastSeenAgeHours === null).toBe(true)
  })
})
