import assert from 'node:assert/strict'
import { describe, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  supabase: null,
  scanLiveBriefCompany: vi.fn(),
}))

vi.mock('../lib/supabase.js', () => ({ getSupabase: () => state.supabase }))
vi.mock('../scanner/live-brief-scan.js', () => ({ scanLiveBriefCompany: state.scanLiveBriefCompany }))

const { runLiveBriefScanJob } = await import('./live-brief-scan-job.js')

function query(result) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    maybeSingle: async () => result,
    single: async () => result,
    update: () => chain,
  }
  return chain
}

describe('runLiveBriefScanJob', () => {
it('skips a non-queued live-brief run without scanning', async () => {
  state.scanLiveBriefCompany.mockReset()
  state.supabase = { from: () => query({ data: { id: 'run-1', status: 'completed' }, error: null }) }

  const result = await runLiveBriefScanJob('run-1')

  assert.deepEqual(result, { skipped: true, status: 'completed' })
  assert.equal(state.scanLiveBriefCompany.mock.calls.length, 0)
})

it('maps company scan outcomes into live-brief rows and completes the run', async () => {
  state.scanLiveBriefCompany.mockReset()
  state.scanLiveBriefCompany
    .mockResolvedValueOnce({ status: 'complete', evidence: [{ title: 'VP Operations' }], observedAt: '2026-08-20T00:00:00.000Z', acquisitionPath: 'render', renderMs: 2400 })
    .mockResolvedValueOnce({ status: 'blocked_by_source_policy', evidence: [], errorClass: 'robots_blocked' })

  const updates = []
  const events = []
  const rows = {
    run: { id: 'run-1', request_id: 'request-1', status: 'queued', selected_company_count: 2 },
    request: { reviewed_profile: { title: 'COO' }, status: 'scanning' },
    companies: [
      { id: 'company-1', company_name: 'Acme', career_page_url: 'https://acme.example/jobs', status: 'queued' },
      { id: 'company-2', company_name: 'Beta', career_page_url: 'https://beta.example/jobs', status: 'queued' },
    ],
  }
  state.supabase = {
    from: (table) => {
      if (table === 'live_brief_scan_runs') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: rows.run, error: null }) }) }),
        update: (value) => { updates.push(['run', value]); return { eq: async () => ({ error: null }) } },
      }
      if (table === 'live_brief_requests') return {
        select: () => ({ eq: () => ({ single: async () => ({ data: rows.request, error: null }) }) }),
        update: (value) => { updates.push(['request', value]); return { eq: async () => ({ error: null }) } },
      }
      if (table === 'live_brief_events') return {
        insert: (value) => { events.push(value); return Promise.resolve({ error: null }) },
      }
      return {
        select: () => ({ eq: () => ({ order: async () => ({ data: rows.companies, error: null }) }) }),
        update: (value) => { updates.push(['company', value]); return { eq: async () => ({ error: null }) } },
      }
    },
  }

  const result = await runLiveBriefScanJob('run-1')

  assert.deepEqual(result, { runId: 'run-1', status: 'completed', completed: 1, blocked: 1, failed: 0 })
  assert.equal(state.scanLiveBriefCompany.mock.calls.length, 2)
  assert.equal(updates.some(([kind, value]) => kind === 'request' && value.status === 'ready_for_review'), true)
  assert.equal(updates.some(([kind, value]) => kind === 'company' && value.status === 'complete'), true)
  assert.equal(updates.some(([kind, value]) => kind === 'company' && value.status === 'blocked_by_source_policy'), true)
  // SMK-489 item 5: the writer records acquisition path and render duration.
  assert.equal(updates.some(([kind, value]) => kind === 'company' && value.acquisition_path === 'render' && value.render_ms === 2400), true)
  assert.equal(updates.some(([kind, value]) => kind === 'company' && value.status === 'blocked_by_source_policy' && value.acquisition_path === null), true)
  assert.equal(events.length, 1)
  assert.equal(events[0].request_id, 'request-1')
  assert.equal(events[0].event_type, 'scan_completed')
})
})
