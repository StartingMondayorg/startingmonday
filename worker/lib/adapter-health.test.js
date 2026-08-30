import { describe, it, expect } from 'vitest'
import { isAdapterEnabled, recordAdapterSuccess, recordAdapterFailure, reEnableAdapter } from './adapter-health.js'

// Minimal in-memory fake for the single table this module touches.
function createFakeSupabase() {
  const rows = new Map() // source -> row

  return {
    _rows: rows,
    from(table) {
      if (table !== 'adapter_health') throw new Error(`unexpected table ${table}`)
      return {
        select() {
          return {
            eq(_col, value) {
              return {
                async maybeSingle() {
                  return { data: rows.get(value) ?? null }
                },
              }
            },
          }
        },
        async upsert(row) {
          const existing = rows.get(row.source) ?? {}
          rows.set(row.source, { ...existing, ...row })
          return { data: null, error: null }
        },
      }
    },
  }
}

describe('adapter-health', () => {
  it('treats an adapter with no history as enabled', async () => {
    const supabase = createFakeSupabase()
    expect(await isAdapterEnabled(supabase, 'sec_filings')).toBe(true)
  })

  it('stays enabled below the failure threshold', async () => {
    const supabase = createFakeSupabase()
    for (let i = 0; i < 4; i++) {
      const result = await recordAdapterFailure(supabase, 'sec_filings', 'timeout')
      expect(result.disabled).toBe(false)
    }
    expect(await isAdapterEnabled(supabase, 'sec_filings')).toBe(true)
  })

  it('auto-disables after 5 consecutive failures', async () => {
    const supabase = createFakeSupabase()
    let result
    for (let i = 0; i < 5; i++) {
      result = await recordAdapterFailure(supabase, 'pr_wire', 'network_error')
    }
    expect(result.disabled).toBe(true)
    expect(result.consecutiveFailures).toBe(5)
    expect(await isAdapterEnabled(supabase, 'pr_wire')).toBe(false)
  })

  it('a success resets failures but does not re-enable a disabled adapter', async () => {
    const supabase = createFakeSupabase()
    for (let i = 0; i < 5; i++) {
      await recordAdapterFailure(supabase, 'pr_wire', 'network_error')
    }
    expect(await isAdapterEnabled(supabase, 'pr_wire')).toBe(false)

    await recordAdapterSuccess(supabase, 'pr_wire')
    expect(await isAdapterEnabled(supabase, 'pr_wire')).toBe(false)

    const row = supabase._rows.get('pr_wire')
    expect(row.consecutive_failures).toBe(0)
  })

  it('requires explicit re-enable after human review', async () => {
    const supabase = createFakeSupabase()
    for (let i = 0; i < 5; i++) {
      await recordAdapterFailure(supabase, 'pr_wire', 'network_error')
    }
    await reEnableAdapter(supabase, 'pr_wire')
    expect(await isAdapterEnabled(supabase, 'pr_wire')).toBe(true)
    expect(supabase._rows.get('pr_wire').disabled_reason).toBeNull()
  })
})
