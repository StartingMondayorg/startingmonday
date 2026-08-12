import { describe, expect, it } from 'vitest'
import { pickControlsForCohort } from './backtest-cohort-builder.js'

class Query {
  constructor(resolveRows) {
    this.resolveRows = resolveRows
    this.filters = []
  }

  select() { return this }
  limit() { return this }
  eq(column, value) { this.filters.push(['eq', column, value]); return this }
  neq(column, value) { this.filters.push(['neq', column, value]); return this }
  in(column, value) { this.filters.push(['in', column, value]); return this }
  gte(column, value) { this.filters.push(['gte', column, value]); return this }
  lte(column, value) { this.filters.push(['lte', column, value]); return this }
  then(resolve) { return Promise.resolve(this.resolveRows(this.filters)).then(resolve) }
}

function createSupabase() {
  const candidates = [
    { id: 'control-1', sector: 'technology' },
    { id: 'control-2', sector: 'technology' },
    { id: 'control-3', sector: 'technology' },
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
          insert: async (row) => {
            const duplicate = controls.some((existing) => (
              existing.cohort_id === row.cohort_id
              && (existing.canonical_company_id === row.canonical_company_id
                || existing.control_rank === row.control_rank)
            ))
            if (duplicate) return { error: { message: 'duplicate control' } }
            controls.push(row)
            return { error: null }
          },
        }
      }

      if (table === 'canonical_companies') {
        return new Query((filters) => {
          const excludedId = filters.find(([operator, column]) => operator === 'neq' && column === 'id')?.[2]
          const sector = filters.find(([operator, column]) => operator === 'eq' && column === 'sector')?.[2]
          return {
            data: candidates.filter((candidate) => (
              candidate.id !== excludedId && (!sector || candidate.sector === sector)
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
      sector: 'technology',
    })
    const secondAdded = await pickControlsForCohort(supabase, {
      id: 'cohort-2',
      canonical_company_id: 'opening-company-2',
      opened_on: '2026-08-02',
      sector: 'technology',
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
})