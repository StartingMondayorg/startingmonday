import { beforeEach, describe, expect, it, vi } from 'vitest'

type Result = { data: unknown; error: { code?: string; message?: string; details?: string } | null; count?: number | null }

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
  resolve: vi.fn<(table: string, call: number) => Result>(),
  captureException: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@sentry/nextjs', () => ({ captureException: mocks.captureException }))
vi.mock('@/lib/billing/subscription', () => ({
  getUserSubscription: vi.fn(async () => ({})),
  canAccessFeature: vi.fn(() => false),
}))
vi.mock('@/lib/staff', () => ({
  getStaffMember: vi.fn(async () => null),
  hasAdminHeaderAccess: vi.fn(() => false),
}))
vi.mock('@/lib/onboarding/activation', () => ({
  getActivationStatus: vi.fn(async () => ({
    a1_resume: true,
    a2_company: true,
    a3_prep_brief: true,
    a4_contact: true,
    a5_briefing: true,
    a6_follow_up: true,
    isComplete: true,
  })),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    const calls = new Map<string, number>()
    return {
      auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'u@example.com' } } }) },
      from(table: string) {
        const call = calls.get(table) ?? 0
        calls.set(table, call + 1)
        const builder: Record<string, unknown> = {}
        for (const method of ['select', 'eq', 'neq', 'is', 'not', 'in', 'gte', 'lte', 'order', 'limit', 'single', 'maybeSingle']) {
          builder[method] = () => builder
        }
        builder.then = (onFulfilled: (value: Result) => unknown, onRejected?: (reason: unknown) => unknown) =>
          Promise.resolve(mocks.resolve(table, call)).then(onFulfilled, onRejected)
        return builder
      },
    }
  }),
}))

import DashboardPage from './page'

const completedProfile = {
  full_name: 'Pat Example',
  search_started_at: null,
  briefing_timezone: 'UTC',
  onboarding_completed_at: '2026-10-01T00:00:00Z',
  target_titles: [],
  positioning_summary: null,
  briefing_time: null,
  placed_at: null,
  placement_company: null,
  search_status: null,
  stall_nudge_dismissed_at: null,
  search_path: 'campaign',
  search_posture: 'active',
  role_type: null,
  search_persona: null,
}
const missingColumn = { code: '42703', message: 'column user_profiles.search_posture does not exist' }
const ok = (data: unknown): Result => ({ data, error: null, count: Array.isArray(data) ? data.length : null })

function respondWith(overrides: Partial<Record<string, Result>> = {}) {
  mocks.resolve.mockImplementation((table, call) => {
    const key = `${table}#${call}`
    if (key in overrides) return overrides[key]!
    if (table in overrides) return overrides[table]!
    if (table === 'user_profiles') return ok(completedProfile)
    if (table === 'users') return ok({ subscription_status: 'active', trial_ends_at: null, subscription_tier: 'pro' })
    return ok([])
  })
}

describe('DashboardPage query error handling (P1-4)', () => {
  beforeEach(() => {
    mocks.redirect.mockClear()
    mocks.captureException.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('throws to the error boundary when the profile query fails instead of redirecting to onboarding', async () => {
    respondWith({ user_profiles: { data: null, error: missingColumn } })
    await expect(DashboardPage()).rejects.toThrow(/dashboard\.user_profiles.*42703/)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('redirects to onboarding when the profile row does not exist', async () => {
    respondWith({ user_profiles: { data: null, error: { code: 'PGRST116', message: 'no rows', details: 'The result contains 0 rows' } } })
    await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT:/onboarding')
  })

  it('throws instead of redirecting when the profile query matches multiple rows', async () => {
    respondWith({ user_profiles: { data: null, error: { code: 'PGRST116', message: 'multiple rows', details: 'The result contains 2 rows' } } })
    await expect(DashboardPage()).rejects.toThrow(/dashboard\.user_profiles.*PGRST116/)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('redirects to onboarding when the profile read succeeded but onboarding is unfinished', async () => {
    respondWith({ user_profiles: ok({ ...completedProfile, onboarding_completed_at: null }) })
    await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT:/onboarding')
  })

  it('throws when the companies query fails rather than rendering an empty pipeline', async () => {
    respondWith({ 'companies#0': { data: null, error: missingColumn } })
    await expect(DashboardPage()).rejects.toThrow(/dashboard\.companies/)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('throws when the users row query fails', async () => {
    respondWith({ users: { data: null, error: { code: '42501', message: 'permission denied for table users' } } })
    await expect(DashboardPage()).rejects.toThrow(/dashboard\.users.*42501/)
  })

  it('renders and reports when optional enrichment queries fail', async () => {
    respondWith({
      company_signals: { data: null, error: missingColumn },
      'contacts#0': { data: null, error: missingColumn, count: null },
      'follow_ups#0': { data: null, error: missingColumn },
    })
    await expect(DashboardPage()).resolves.toBeTruthy()
    expect(mocks.redirect).not.toHaveBeenCalled()
    const contexts = mocks.captureException.mock.calls.map(([, hint]) => hint?.tags?.query_context)
    expect(contexts).toEqual(
      expect.arrayContaining([
        'dashboard.company_signals',
        'dashboard.company_signals.pattern_alerts',
        'dashboard.contacts.count',
        'dashboard.follow_ups.overdue',
      ]),
    )
  })

  it('renders without reporting when every query succeeds', async () => {
    respondWith()
    await expect(DashboardPage()).resolves.toBeTruthy()
    expect(mocks.captureException).not.toHaveBeenCalled()
  })
})
