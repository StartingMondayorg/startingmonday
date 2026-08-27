import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  fetchSecFilings: vi.fn(),
  fetchPrWire: vi.fn(),
  fetchWarnNoticesForState: vi.fn(),
  fetchBoardOpenings: vi.fn(),
  upsertCompanyEvent: vi.fn(),
  resolveCanonicalCompanyForWatchlist: vi.fn(),
  isAdapterEnabled: vi.fn(),
  recordAdapterSuccess: vi.fn(),
  recordAdapterFailure: vi.fn(),
}))

vi.mock('../signals/fetch-sec-filings.js', () => ({ fetchSecFilings: state.fetchSecFilings }))
vi.mock('../signals/fetch-pr-wire.js', () => ({ fetchPrWire: state.fetchPrWire }))
vi.mock('../signals/fetch-warn-notices.js', () => ({ fetchWarnNoticesForState: state.fetchWarnNoticesForState }))
vi.mock('../signals/fetch-ats-json.js', () => ({ fetchBoardOpenings: state.fetchBoardOpenings }))
vi.mock('../signals/event-store.js', () => ({ upsertCompanyEvent: state.upsertCompanyEvent }))
vi.mock('../lib/watchlist-canonical.js', () => ({
  normalizeCompanyName: (name) => String(name ?? '').toLowerCase().replace(/\b(inc|llc|ltd|corp|company|co)\b/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
  resolveCanonicalCompanyForWatchlist: state.resolveCanonicalCompanyForWatchlist,
}))
vi.mock('../lib/adapter-health.js', () => ({
  isAdapterEnabled: state.isAdapterEnabled,
  recordAdapterSuccess: state.recordAdapterSuccess,
  recordAdapterFailure: state.recordAdapterFailure,
}))

const { runWatchlistScan } = await import('./watchlist-scan-job.js')

function createSupabase(entries, coverage, adapterRows) {
  return {
    from(table) {
      if (table === 'watchlist_entries') {
        const chain = {
          select: () => chain,
          eq: (_column, value) => {
            if (value === false) return chain
            return chain
          },
          then: (resolve, reject) => Promise.resolve({ data: entries, error: null }).then(resolve, reject),
        }
        return chain
      }
      if (table === 'source_coverage') {
        return { insert: async (row) => { coverage.push(row); return { data: null, error: null } } }
      }
      if (table === 'adapter_health') {
        return {
          select: () => ({
            eq: (_column, source) => ({ maybeSingle: async () => ({ data: adapterRows[source] ?? null, error: null }) }),
          }),
          upsert: async (row) => { adapterRows[row.source] = { ...(adapterRows[row.source] ?? {}), ...row }; return { data: null, error: null } },
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  }
}

describe('runWatchlistScan', () => {
  it('runs per-entry adapters, shares WARN fetches by state, and records coverage', async () => {
    const entries = [
      { id: 'entry-ct-1', company_name: 'Acme Inc', domain: 'acme.com', sec_cik_padded: null, state: 'ct', ats_provider: 'greenhouse', ats_board_token: 'acme' },
      { id: 'entry-ct-2', company_name: 'Widget Works', domain: 'widget.com', sec_cik_padded: null, state: 'CT', ats_provider: null, ats_board_token: null },
      { id: 'entry-ny-1', company_name: 'Empire Co', domain: 'empire.com', sec_cik_padded: null, state: 'NY', ats_provider: null, ats_board_token: null },
    ]
    const coverage = []
    const adapterRows = {}
    const events = []

    state.fetchSecFilings.mockReset().mockResolvedValue({ articles: [], fetchError: null })
    state.fetchPrWire.mockReset().mockResolvedValue([])
    state.fetchWarnNoticesForState.mockReset()
      .mockResolvedValueOnce([{ employer_name: 'Acme Inc', event_date: '2026-08-20', job_losses: 12, source_url: 'https://ct.example/warn-1' }])
      .mockResolvedValueOnce([])
    state.fetchBoardOpenings.mockReset().mockResolvedValue([{ role_title: 'VP Infrastructure', role_url: 'https://acme.com/jobs/1', opened_on: '2026-08-21' }])
    state.upsertCompanyEvent.mockReset().mockImplementation(async (_supabase, input) => { events.push(input); return { eventId: `event-${events.length}`, merged: false } })
    state.resolveCanonicalCompanyForWatchlist.mockReset().mockResolvedValue('canonical-acme')
    state.isAdapterEnabled.mockReset().mockResolvedValue(true)
    state.recordAdapterSuccess.mockReset().mockResolvedValue(undefined)
    state.recordAdapterFailure.mockReset().mockResolvedValue(undefined)

    const result = await runWatchlistScan(createSupabase(entries, coverage, adapterRows), 'watchlist-1')

    assert.equal(result.entriesProcessed, 3)
    assert.equal(result.entriesFailed, 0)
    assert.equal(state.fetchWarnNoticesForState.mock.calls.length, 2)
    assert.deepEqual(state.fetchWarnNoticesForState.mock.calls.map(([stateCode]) => stateCode).sort(), ['CT', 'NY'])
    assert.equal(state.fetchBoardOpenings.mock.calls.length, 1)
    assert.equal(coverage.filter((row) => row.source === 'warn_notices' && row.coverage === 'full').length, 1)
    assert.equal(coverage.filter((row) => row.source === 'warn_notices' && row.coverage === 'thin').length, 2)
    assert.equal(coverage.some((row) => row.source === 'ats_board' && row.error_class === 'board_not_configured'), true)
    assert.equal(events.some((event) => event.eventType === 'layoffs'), true)
    assert.equal(events.some((event) => event.eventType === 'leadership_opening'), true)
  })
})
