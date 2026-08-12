import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/admin-automation-auth', () => ({
  requireStaffAutomationAccess: state.requireStaffAutomationAccess,
}))

import { GET } from './route'

function createQuery(result: unknown) {
  const promise = Promise.resolve(result)
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    then: promise.then.bind(promise),
  }
  query.select.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.range.mockReturnValue(query)
  query.gte.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  query.maybeSingle.mockReturnValue(query)
  return query
}

describe('admin intelligence label metrics route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true })
  })

  it('returns paginated label and backtest evidence with fail-closed gates', async () => {
    const results = new Map<string, unknown[]>([
      ['canonical_companies', [{ count: 2, data: null, error: null }]],
      ['role_openings', [{
        data: [
          { canonical_company_id: 'company-1', label_source: 'career_scan', role_family: 'cio', canonical_companies: { sector: 'Technology' } },
          { canonical_company_id: 'company-1', label_source: 'career_scan', role_family: 'cto', canonical_companies: null },
        ],
        error: null,
      }]],
      ['event_outcome_labels', [{ data: [{ days_to_opening: 10 }, { days_to_opening: 20 }], error: null }]],
      ['precursor_stats', [{
        data: [{ event_type: 'career_scan', n_events: 4, n_preceded: 2, median_days_to_opening: '15' }],
        error: null,
      }]],
      ['backtest_replay_runs', [{ data: { id: 'run-1', status: 'complete', cohort_count: 1, control_count: 3 }, error: null }]],
      ['pattern_backtests', [{ data: [{ pattern_name: 'leadership_exit', role_family: 'cio' }], error: null }]],
      ['backtest_cohorts', [{ count: 1, data: null, error: null }]],
      ['backtest_controls', [{ count: 3, data: null, error: null }]],
    ])
    const from = vi.fn((table: string) => createQuery(results.get(table)?.shift()))
    state.createAdminClient.mockReturnValue({ from })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/label-metrics'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.stats).toMatchObject({
      totalCompanies: 2,
      companiesWithLabels: 1,
      coveragePercent: 50,
      medianDaysToOpening: 15,
      eventOutcomeLabelCount: 2,
    })
    expect(body.stats.openingsBySource).toEqual([{ source: 'career_scan', count: 2 }])
    expect(body.stats.openingsBySector).toEqual([
      { sector: 'Technology', count: 1 },
      { sector: 'Unknown', count: 1 },
    ])
    expect(body.sourceBreakdown).toEqual([{
      source_key: 'career_scan',
      total_openings: 2,
      median_days_to_opening: 15,
      hit_rate: 0.5,
    }])
    expect(body.backtests).toMatchObject({ cohortCount: 1, controlCount: 3, patternCount: 1 })
    expect(body.gates.labeledOpenings.status).toBe('in_progress')
    expect(body.gates.patternBacktests.status).toBe('pass')
  })

  it('rejects authenticated users without staff automation access', async () => {
    state.requireStaffAutomationAccess.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/label-metrics'))

    expect(response.status).toBe(403)
    expect(state.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns 500 when a paginated evidence query fails', async () => {
    const from = vi.fn((table: string) => createQuery(
      table === 'role_openings'
        ? { data: null, error: { message: 'opening query failed' } }
        : { count: 0, data: null, error: null },
    ))
    state.createAdminClient.mockReturnValue({ from })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/label-metrics'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'opening query failed' })
    expect(errorSpy).toHaveBeenCalledOnce()
  })
})