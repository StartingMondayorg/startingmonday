import { describe, it, expect } from 'vitest'
import { diffWatchlistExecSnapshot } from './watchlist-exec-snapshot.js'

// Minimal in-memory fake for watchlist_exec_snapshots, matching the
// .select().eq().lt().order().limit().maybeSingle() and .upsert() chains.
function createFakeSupabase(seed = []) {
  const rows = [...seed]

  return {
    _rows: rows,
    from(table) {
      if (table !== 'watchlist_exec_snapshots') throw new Error(`unexpected table ${table}`)
      return {
        select() {
          return {
            eq(_col, entryId) {
              return {
                lt(_dateCol, beforeDate) {
                  const candidates = rows
                    .filter((r) => r.watchlist_entry_id === entryId && r.snapshot_date < beforeDate)
                  return {
                    order() {
                      return {
                        limit() {
                          return {
                            async maybeSingle() {
                              const sorted = [...candidates].sort((a, b) => (a.snapshot_date < b.snapshot_date ? 1 : -1))
                              return { data: sorted[0] ?? null }
                            },
                          }
                        },
                      }
                    },
                  }
                },
              }
            },
          }
        },
        async upsert(row) {
          const idx = rows.findIndex((r) => r.watchlist_entry_id === row.watchlist_entry_id && r.snapshot_date === row.snapshot_date)
          if (idx >= 0) rows[idx] = { ...rows[idx], ...row }
          else rows.push(row)
          return { data: null, error: null }
        },
      }
    },
  }
}

describe('diffWatchlistExecSnapshot', () => {
  it('reports no departures or hires when there is no prior snapshot', async () => {
    const supabase = createFakeSupabase()
    const result = await diffWatchlistExecSnapshot(supabase, 'entry-1', [{ name: 'Jane Smith' }], '2026-08-27')
    expect(result).toEqual({ departures: [], hires: [] })
    expect(supabase._rows).toHaveLength(1)
  })

  it('detects a departure and a hire against the most recent prior snapshot', async () => {
    const supabase = createFakeSupabase([
      { watchlist_entry_id: 'entry-1', snapshot_date: '2026-08-01', executives: [{ name: 'Jane Smith' }, { name: 'Bob Jones' }] },
    ])
    const result = await diffWatchlistExecSnapshot(
      supabase,
      'entry-1',
      [{ name: 'Bob Jones' }, { name: 'New Exec' }],
      '2026-08-27'
    )
    expect(result.departures).toEqual([{ name: 'Jane Smith' }])
    expect(result.hires).toEqual([{ name: 'New Exec' }])
  })

  it('matches names case-insensitively and ignores punctuation', async () => {
    const supabase = createFakeSupabase([
      { watchlist_entry_id: 'entry-1', snapshot_date: '2026-08-01', executives: [{ name: 'Jane Smith, Jr.' }] },
    ])
    const result = await diffWatchlistExecSnapshot(supabase, 'entry-1', [{ name: 'jane smith jr' }], '2026-08-27')
    expect(result).toEqual({ departures: [], hires: [] })
  })

  it('ignores a snapshot from another watchlist entry', async () => {
    const supabase = createFakeSupabase([
      { watchlist_entry_id: 'entry-other', snapshot_date: '2026-08-01', executives: [{ name: 'Jane Smith' }] },
    ])
    const result = await diffWatchlistExecSnapshot(supabase, 'entry-1', [{ name: 'New Exec' }], '2026-08-27')
    expect(result).toEqual({ departures: [], hires: [] })
  })
})
