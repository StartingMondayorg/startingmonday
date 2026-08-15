import { describe, expect, it } from 'vitest'
import {
  pickControlsForCohort,
  reconcileCanonicalMatchingDimensions,
  replaceControlsForCohort,
} from './backtest-cohort-builder.js'

class Query {
  constructor(resolveRows) {
    this.resolveRows = resolveRows
    this.filters = []
  }

  select() { return this }
  limit() { return this }
  order() { return this }
  not() { return this }
  range(from, to) {
    this.filters.push(['range', from, to])
    return this
  }
  eq(column, value) { this.filters.push(['eq', column, value]); return this }
  neq(column, value) { this.filters.push(['neq', column, value]); return this }
  in(column, value) { this.filters.push(['in', column, value]); return this }
  gte(column, value) { this.filters.push(['gte', column, value]); return this }
  lte(column, value) { this.filters.push(['lte', column, value]); return this }
  then(resolve) { return Promise.resolve(this.resolveRows(this.filters)).then(resolve) }
}

function createSupabase() {
  const candidates = [
    { id: 'control-1', sector: 'Cloud Security', broad_sector_slug: 'technology', size_band: 'enterprise' },
    { id: 'control-2', sector: 'SaaS', broad_sector_slug: 'technology', size_band: 'enterprise' },
    { id: 'control-3', sector: 'Data Platform', broad_sector_slug: 'technology', size_band: 'enterprise' },
  ]
  const controls = []

  return {
    controls,
    from(table) {
      if (table === 'backtest_controls') {
        return {
          select: () => new Query((filters) => {
            const cohortId = filters.find(([, column]) => column === 'cohort_id')?.[2]
            return { data: controls.filter((row) => row.cohort_id === cohortId), error: null }
          }),
          delete: () => new Query((filters) => {
            const cohortId = filters.find(([, column]) => column === 'cohort_id')?.[2]
            for (let index = controls.length - 1; index >= 0; index -= 1) {
              if (controls[index].cohort_id === cohortId) controls.splice(index, 1)
            }
            return { error: null }
          }),
          insert: async (input) => {
            const rows = Array.isArray(input) ? input : [input]
            for (const row of rows) {
              const duplicate = controls.some((existing) => (
                existing.cohort_id === row.cohort_id
                && (existing.canonical_company_id === row.canonical_company_id
                  || existing.control_rank === row.control_rank)
              ))
              if (duplicate) return { error: { message: 'duplicate control' } }
            }
            controls.push(...rows)
            return { error: null }
          },
        }
      }

      if (table === 'canonical_companies') {
        return new Query((filters) => {
          const excludedId = filters.find(([operator, column]) => operator === 'neq' && column === 'id')?.[2]
          const broadSector = filters.find(([operator, column]) => operator === 'eq' && column === 'broad_sector_slug')?.[2]
          return {
            data: candidates.filter((candidate) => (
              candidate.id !== excludedId
              && (!broadSector || candidate.broad_sector_slug === broadSector)
            )),
            error: null,
          }
        })
      }

      if (table === 'role_openings') {
        return new Query(() => ({ count: 0, error: null }))
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

describe('pickControlsForCohort', () => {
  it('reuses eligible companies across cohorts without duplicating within a cohort', async () => {
    const supabase = createSupabase()

    const firstAdded = await pickControlsForCohort(supabase, {
      id: 'cohort-1',
      canonical_company_id: 'opening-company-1',
      opened_on: '2026-08-01',
      broad_sector_slug: 'technology',
      size_band: 'enterprise',
    })
    const secondAdded = await pickControlsForCohort(supabase, {
      id: 'cohort-2',
      canonical_company_id: 'opening-company-2',
      opened_on: '2026-08-02',
      broad_sector_slug: 'technology',
      size_band: 'enterprise',
    })

    expect(firstAdded).toBe(3)
    expect(secondAdded).toBe(3)
    expect(supabase.controls).toHaveLength(6)
    expect(new Set(supabase.controls.map((row) => row.canonical_company_id))).toEqual(
      new Set(['control-1', 'control-2', 'control-3']),
    )
    for (const cohortId of ['cohort-1', 'cohort-2']) {
      const cohortControls = supabase.controls.filter((row) => row.cohort_id === cohortId)
      expect(new Set(cohortControls.map((row) => row.control_rank))).toEqual(new Set([1, 2, 3]))
      expect(new Set(cohortControls.map((row) => row.canonical_company_id))).toHaveLength(3)
    }
  })

  it('fills a partially populated cohort without reselecting its existing control', async () => {
    const supabase = createSupabase()
    supabase.controls.push({
      cohort_id: 'cohort-1',
      canonical_company_id: 'control-1',
      control_rank: 1,
    })

    const added = await pickControlsForCohort(supabase, {
      id: 'cohort-1',
      canonical_company_id: 'opening-company-1',
      opened_on: '2026-08-01',
      broad_sector_slug: 'technology',
      size_band: 'enterprise',
    })

    expect(added).toBe(2)
    const controls = supabase.controls.filter((row) => row.cohort_id === 'cohort-1')
    expect(controls).toHaveLength(3)
    expect(new Set(controls.map((row) => row.canonical_company_id))).toHaveLength(3)
    expect(new Set(controls.map((row) => row.control_rank))).toEqual(new Set([1, 2, 3]))
  })

  it('replaces controls through the builder execution helper', async () => {
    const supabase = createSupabase()
    supabase.controls.push({
      cohort_id: 'cohort-1',
      canonical_company_id: 'stale-control',
      control_rank: 1,
    })
    const selected = [
      { id: 'control-1', sector: 'Cloud Security', broad_sector_slug: 'technology', size_band: 'enterprise', match_tier: 'broad_sector_size' },
      { id: 'control-2', sector: 'SaaS', broad_sector_slug: 'technology', size_band: 'enterprise', match_tier: 'broad_sector_size' },
      { id: 'control-3', sector: 'Data Platform', broad_sector_slug: 'technology', size_band: 'enterprise', match_tier: 'broad_sector_size' },
    ]

    const written = await replaceControlsForCohort(supabase, { id: 'cohort-1' }, selected)

    expect(written).toBe(3)
    expect(supabase.controls.map((row) => row.canonical_company_id)).toEqual([
      'control-1', 'control-2', 'control-3',
    ])
  })

  it('reconciles changed canonical dimensions and skips current rows', async () => {
    const updates = []
    const supabase = {
      from(table) {
        if (table === 'canonical_companies') {
          return {
            select: () => new Query(() => ({
              data: [
                {
                  id: 'a', sector: 'Health Tech', broad_sector_slug: 'healthcare',
                  size_band: 'midmarket', matching_dimension_version: 'v1',
                },
                {
                  id: 'b', sector: null, broad_sector_slug: null,
                  size_band: null, matching_dimension_version: null,
                },
              ],
              error: null,
            })),
            update: (payload) => ({
              eq: async (_column, id) => {
                updates.push({ id, ...payload })
                return { error: null }
              },
            }),
          }
        }
        if (table === 'companies') {
          return {
            select: () => new Query(() => ({
              data: [
                { canonical_company_id: 'a', sector: 'Healthcare', company_size: 'midmarket' },
                { canonical_company_id: 'b', sector: 'Banking', company_size: 'enterprise' },
              ],
              error: null,
            })),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    const result = await reconcileCanonicalMatchingDimensions(supabase)

    expect(result).toMatchObject({
      canonicalCompanies: 2,
      updated: 1,
      withBroadSector: 2,
      withSizeBand: 2,
      withBoth: 2,
    })
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      id: 'b',
      broad_sector_slug: 'financial-services',
      size_band: 'enterprise',
      matching_dimension_version: 'v1',
    })
  })
})