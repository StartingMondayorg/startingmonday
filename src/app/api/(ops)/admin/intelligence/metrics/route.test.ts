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
    is: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    gte: vi.fn(),
    not: vi.fn(),
    then: promise.then.bind(promise),
  }
  query.select.mockReturnValue(query)
  query.is.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  query.maybeSingle.mockReturnValue(query)
  query.gte.mockReturnValue(query)
  query.not.mockReturnValue(query)
  return query
}

function mockAdmin(results: Map<string, unknown[]>) {
  state.createAdminClient.mockReturnValue({
    from: vi.fn((table: string) => createQuery(results.get(table)?.shift())),
  })
}

describe('admin intelligence metrics route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true })
  })

  it('reports measured classification, merge, and provenance gate states', async () => {
    mockAdmin(new Map([
      ['ingest_dlq', [
        { count: 2, data: null, error: null },
        { data: { created_at: new Date(Date.now() - 3_600_000).toISOString() }, error: null },
      ]],
      ['source_run_metrics', [{
        data: [{ classify_calls: 100, classify_failures: 2, signals_written: 9, events_created: 98, events_merged: 2 }],
        error: null,
      }]],
      ['company_events', [
        { count: 10, data: null, error: null },
        { count: 10, data: null, error: null },
      ]],
    ]))

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/metrics'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.phase0.classification).toMatchObject({ failureRatePercent: 2, status: 'pass' })
    expect(body.phase1.eventMerge).toMatchObject({ mergeRatePercent: 2, status: 'informational' })
    expect(body.phase1.eventMerge).not.toHaveProperty('duplicateRatePercent')
    expect(body.phase1.provenance).toMatchObject({ coveragePercent: 100, status: 'pass' })
  })

  it('returns no-data states instead of passing empty production gates', async () => {
    mockAdmin(new Map([
      ['ingest_dlq', [
        { count: 0, data: null, error: null },
        { data: null, error: null },
      ]],
      ['source_run_metrics', [{ data: [], error: null }]],
      ['company_events', [
        { count: 0, data: null, error: null },
        { count: 0, data: null, error: null },
      ]],
    ]))

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/metrics'))
    const body = await response.json()

    expect(body.phase0.classification).toMatchObject({ failureRatePercent: null, status: 'no_data' })
    expect(body.phase1.eventMerge).toMatchObject({ mergeRatePercent: null, status: 'no_data' })
    expect(body.phase1.eventMerge).not.toHaveProperty('duplicateRatePercent')
    expect(body.phase1.provenance).toMatchObject({ coveragePercent: null, status: 'no_data' })
  })

  it('rejects authenticated users without staff automation access', async () => {
    state.requireStaffAutomationAccess.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/intelligence/metrics'))

    expect(response.status).toBe(403)
    expect(state.createAdminClient).not.toHaveBeenCalled()
  })
})