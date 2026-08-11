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
          lifetimeHitCount: 9,
          hitCountWindowHours: 24,
          windowStartAt: '2026-08-10T08:00:00.000Z',
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
      lifetimeHitCount: 9,
      hitWindowHours: 24,
      hitWindowSource: 'alert_state',
      windowStartAt: '2026-08-10T08:00:00.000Z',
      hitBudget: 2,
      overBudgetBy: 0,
      budgetRemaining: 0,
      sunsetReady: true,
      recommendation: 'monitor',
      recommendationReason: 'within_budget',
      eligibleForRouteRemoval: false,
      requiresCallerMigration: false,
      blockingReasons: ['compat_route_still_active', 'inactivity_window_not_elapsed'],
      inactivityWindowElapsed: false,
      inactivityWindowEndsAt: '2026-08-11T19:00:00.000Z',
      lastSeenAt: '2026-08-10T19:00:00.000Z',
    })
    expect(payload.alertState.compatRouteUsage.alert_key).toBe('apollo-quality-audit-compat-hit')
    expect(typeof payload.compatibilitySunset.lastSeenAgeHours === 'number' || payload.compatibilitySunset.lastSeenAgeHours === null).toBe(true)
    expect(typeof payload.compatibilitySunset.windowAgeHours === 'number' || payload.compatibilitySunset.windowAgeHours === null).toBe(true)
    expect(typeof payload.compatibilitySunset.inactivityWindowRemainingHours === 'number' || payload.compatibilitySunset.inactivityWindowRemainingHours === null).toBe(true)
    expect(typeof payload.compatibilitySunset.inactivityWindowProgressPct === 'number' || payload.compatibilitySunset.inactivityWindowProgressPct === null).toBe(true)
  })

  it('marks compatibility route as removable after inactivity window and zero hits', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '0'
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: 0,
          lifetimeHitCount: 12,
          hitCountWindowHours: 24,
          windowStartAt: '2026-08-01T00:00:00.000Z',
          lastSeenAt: '2026-08-01T00:00:00.000Z',
        },
      },
    })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status.compatRouteUsage).toBe('none')
    expect(payload.compatibilitySunset).toMatchObject({
      hitCount: 0,
      hitBudget: 0,
      hitWindowSource: 'alert_state',
      overBudgetBy: 0,
      budgetRemaining: 0,
      sunsetReady: true,
      recommendation: 'remove_compat_route',
      recommendationReason: 'no_hits_and_inactive',
      eligibleForRouteRemoval: true,
      requiresCallerMigration: false,
      blockingReasons: [],
      inactivityWindowElapsed: true,
      inactivityWindowRemainingHours: 0,
      inactivityWindowProgressPct: 100,
      inactivityWindowEndsAt: '2026-08-02T00:00:00.000Z',
    })
  })

  it('recommends caller migration when compatibility hit budget is exceeded', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '2'
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: 5,
          lifetimeHitCount: 14,
          hitCountWindowHours: 24,
          windowStartAt: '2026-08-10T00:00:00.000Z',
          lastSeenAt: '2026-08-10T23:30:00.000Z',
        },
      },
    })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status.compatRouteUsage).toBe('active')
    expect(payload.compatibilitySunset).toMatchObject({
      hitCount: 5,
      hitBudget: 2,
      hitWindowSource: 'alert_state',
      overBudgetBy: 3,
      budgetRemaining: 0,
      sunsetReady: false,
      recommendation: 'migrate_callers',
      recommendationReason: 'over_budget',
      eligibleForRouteRemoval: false,
      requiresCallerMigration: true,
      blockingReasons: ['compat_hits_over_budget'],
      inactivityWindowElapsed: false,
      inactivityWindowEndsAt: '2026-08-11T23:30:00.000Z',
    })
  })

  it('parses numeric compatibility counters even when alert-state details are strings', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '2'
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: '2',
          lifetimeHitCount: '11',
          hitCountWindowHours: '24',
          windowStartAt: '2026-08-10T08:00:00.000Z',
          lastSeenAt: '2026-08-10T19:00:00.000Z',
        },
      },
    })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status.compatRouteUsage).toBe('active')
    expect(payload.compatibilitySunset).toMatchObject({
      hitCount: 2,
      lifetimeHitCount: 11,
      hitWindowHours: 24,
      hitWindowSource: 'alert_state',
      hitBudget: 2,
      overBudgetBy: 0,
      budgetRemaining: 0,
      recommendation: 'monitor',
      recommendationReason: 'within_budget',
      eligibleForRouteRemoval: false,
      requiresCallerMigration: false,
    })
  })

  it('falls back to default hit window when alert-state window is missing', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '2'
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: 1,
          lifetimeHitCount: 7,
          windowStartAt: '2026-08-10T08:00:00.000Z',
          lastSeenAt: '2026-08-10T19:00:00.000Z',
        },
      },
    })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.compatibilitySunset).toMatchObject({
      hitCount: 1,
      hitWindowHours: 24,
      hitWindowSource: 'default_fallback',
      inactivityWindowEndsAt: '2026-08-11T19:00:00.000Z',
      recommendation: 'monitor',
      recommendationReason: 'within_budget',
    })
  })

  it('exposes null remaining window hours when lastSeenAt is unavailable', async () => {
    process.env.APOLLO_COMPAT_HIT_BUDGET = '3'
    state.compatHitState.mockResolvedValue({
      data: {
        alert_key: 'apollo-quality-audit-compat-hit',
        last_status: 'deprecated-route-hit',
        last_details: {
          hitCount: 1,
          lifetimeHitCount: 7,
          hitCountWindowHours: 24,
          windowStartAt: '2026-08-10T08:00:00.000Z',
          lastSeenAt: null,
        },
      },
    })

    const request = new NextRequest('https://startingmonday.app/api/admin/edgar-status')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.compatibilitySunset).toMatchObject({
      hitCount: 1,
      inactivityWindowElapsed: true,
      inactivityWindowRemainingHours: null,
      inactivityWindowProgressPct: null,
      inactivityWindowEndsAt: null,
      recommendation: 'monitor',
      recommendationReason: 'within_budget',
      blockingReasons: ['compat_route_still_active'],
    })
  })
})
