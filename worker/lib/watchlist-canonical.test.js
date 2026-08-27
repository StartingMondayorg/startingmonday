import { describe, it, expect } from 'vitest'
import { resolveCanonicalCompanyForWatchlist } from './watchlist-canonical.js'

// Minimal in-memory fake for canonical_companies, matching the
// .from().select().eq().limit().maybeSingle() and .insert().select().single() chains.
function createFakeSupabase(seed = []) {
  const rows = [...seed]
  let nextId = rows.length + 1

  return {
    _rows: rows,
    from(table) {
      if (table !== 'canonical_companies') throw new Error(`unexpected table ${table}`)
      return {
        select() {
          return {
            eq(col, value) {
              const match = rows.find((r) => r[col] === value) ?? null
              return {
                limit() {
                  return {
                    async maybeSingle() {
                      return { data: match }
                    },
                  }
                },
              }
            },
          }
        },
        insert(row) {
          return {
            select() {
              return {
                async single() {
                  const created = { id: `canon-${nextId++}`, ...row }
                  rows.push(created)
                  return { data: created, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('resolveCanonicalCompanyForWatchlist', () => {
  it('returns null when no name is provided', async () => {
    const supabase = createFakeSupabase()
    expect(await resolveCanonicalCompanyForWatchlist(supabase, { name: '' })).toBeNull()
  })

  it('matches an existing row by CIK first', async () => {
    const supabase = createFakeSupabase([
      { id: 'canon-1', name_normalized: 'other name', domain: 'other.com', sec_cik_padded: '0001234567' },
    ])
    const id = await resolveCanonicalCompanyForWatchlist(supabase, { name: 'Acme Inc', domain: 'acme.com', cik: '0001234567' })
    expect(id).toBe('canon-1')
  })

  it('falls back to domain match when CIK does not match', async () => {
    const supabase = createFakeSupabase([
      { id: 'canon-1', name_normalized: 'other name', domain: 'acme.com', sec_cik_padded: null },
    ])
    const id = await resolveCanonicalCompanyForWatchlist(supabase, { name: 'Acme Inc', domain: 'acme.com', cik: null })
    expect(id).toBe('canon-1')
  })

  it('falls back to normalized name match when no CIK or domain match', async () => {
    const supabase = createFakeSupabase([
      { id: 'canon-1', name_normalized: 'acme', domain: null, sec_cik_padded: null },
    ])
    const id = await resolveCanonicalCompanyForWatchlist(supabase, { name: 'Acme Inc.' })
    expect(id).toBe('canon-1')
  })

  it('creates a new canonical company when nothing matches', async () => {
    const supabase = createFakeSupabase()
    const id = await resolveCanonicalCompanyForWatchlist(supabase, { name: 'Brand New Co', domain: 'brandnew.com' })
    expect(id).toBe('canon-1')
    expect(supabase._rows).toHaveLength(1)
    expect(supabase._rows[0].name_normalized).toBe('brand new')
  })
})
