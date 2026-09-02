import { describe, it, expect } from 'vitest'
import { writeScanResult, writeScanExtractionFailure } from './write-results.js'

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

describe('writeScanResult text-shape telemetry (SMK-489 item 4)', () => {
  it('persists chars, line count and max line length', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, { ...base, textShape: { chars: 940, lineCount: 41, maxLineChars: 62 } })

    expect(captured.row.extracted_chars).toBe(940)
    expect(captured.row.extracted_line_count).toBe(41)
    expect(captured.row.extracted_max_line_chars).toBe(62)
  })

  it('writes nulls when no shape was measured', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanResult(supabase, base)

    expect(captured.row.extracted_chars).toBeNull()
    expect(captured.row.extracted_line_count).toBeNull()
    expect(captured.row.extracted_max_line_chars).toBeNull()
  })
})

describe('writeScanExtractionFailure (SMK-489 item 3)', () => {
  it('records a distinct extraction_failed outcome, never success-zero', async () => {
    const { supabase, captured } = stubSupabase()
    await writeScanExtractionFailure(supabase, {
      companyId: 'c1',
      userId: 'u1',
      acquisitionPath: 'render',
      renderMs: 2500,
      textShape: { chars: 5230, lineCount: 1, maxLineChars: 5230 },
    })

    expect(captured.row.status).toBe('extraction_failed')
    expect(captured.row.raw_hits).toEqual([])
    expect(captured.row.ai_score).toBe(0)
    expect(captured.row.acquisition_path).toBe('render')
    expect(captured.row.render_ms).toBe(2500)
    expect(captured.row.extracted_chars).toBe(5230)
    expect(captured.row.extracted_line_count).toBe(1)
    expect(captured.row.extracted_max_line_chars).toBe(5230)
    expect(captured.row.error_message).toMatch(/5230 chars in 1 line/)
    expect(captured.row.ai_summary).toMatch(/no verdict/)
  })

  it('throws when the insert fails', async () => {
    const supabase = { from: () => ({ insert: () => Promise.resolve({ error: { message: 'down' } }) }) }
    await expect(writeScanExtractionFailure(supabase, { companyId: 'c1', userId: 'u1' })).rejects.toThrow(/down/)
  })
})
