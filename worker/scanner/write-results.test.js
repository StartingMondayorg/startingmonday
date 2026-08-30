import { describe, it, expect } from 'vitest'
import { writeScanResult } from './write-results.js'

// Captures the row handed to supabase so the persisted shape can be asserted.
function stubSupabase() {
  const captured = {}
  return {
    captured,
    supabase: {
      from: () => ({
        insert: (row) => { captured.row = row; return Promise.resolve({ error: null }) },
      }),
    },
  }
}

const base = { companyId: 'c1', userId: 'u1', hits: [], aiScore: 0, aiSummary: 'none' }

describe('writeScanResult acquisition telemetry', () => {
  it('records the render path and its duration', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, { ...base, acquisitionPath: 'render', renderMs: 4210 })

    expect(captured.row.acquisition_path).toBe('render')
    expect(captured.row.render_ms).toBe(4210)
    expect(captured.row.ats_provider).toBeNull()
  })

  it('records the ATS provider and spends no render time', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, { ...base, acquisitionPath: 'ats_feed', atsProvider: 'lever' })

    expect(captured.row.acquisition_path).toBe('ats_feed')
    expect(captured.row.ats_provider).toBe('lever')
    expect(captured.row.render_ms).toBeNull()
  })

  // A plain HTTP fetch costs nothing. Conflating it with a render is what made
  // the recorded browserless.io usage figure meaningless.
  it('distinguishes a free direct fetch from a paid render', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, { ...base, acquisitionPath: 'direct_fetch' })

    expect(captured.row.acquisition_path).toBe('direct_fetch')
    expect(captured.row.render_ms).toBeNull()
  })

  it('defaults to nulls so callers that do not report a path still write', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, base)

    expect(captured.row.acquisition_path).toBeNull()
    expect(captured.row.ats_provider).toBeNull()
    expect(captured.row.render_ms).toBeNull()
    expect(captured.row.status).toBe('success')
  })

  it('throws when the insert fails, so a lost scan is never silent', async () => {
    const supabase = { from: () => ({ insert: () => Promise.resolve({ error: { message: 'boom' } }) }) }
    await expect(writeScanResult(supabase, base)).rejects.toThrow(/boom/)
  })
})
