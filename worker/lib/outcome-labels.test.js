import { describe, it, expect } from 'vitest'
import {
  inferRoleFamilyFromTitle,
  isLeadershipTitle,
  roleFamilyForRoleType,
  reconcileOpeningLabels,
  recordRoleOpening,
  LABEL_LOOKBACK_DAYS,
  OPENING_DEDUP_WINDOW_DAYS,
} from './outcome-labels.js'

function resolvedQuery(result) {
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    lte: () => query,
    in: () => query,
    limit: () => query,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return query
}

describe('inferRoleFamilyFromTitle', () => {
  it('classifies technical leadership titles', () => {
    expect(inferRoleFamilyFromTitle('Chief Information Security Officer')).toBe('technical_leadership')
    expect(inferRoleFamilyFromTitle('VP of Engineering')).toBe('technical_leadership')
    expect(inferRoleFamilyFromTitle('Chief Data Officer')).toBe('technical_leadership')
    expect(inferRoleFamilyFromTitle('CTO')).toBe('technical_leadership')
  })

  it('classifies delivery leadership titles', () => {
    expect(inferRoleFamilyFromTitle('Senior Technical Program Manager (TPM)')).toBe('delivery_leadership')
    expect(inferRoleFamilyFromTitle('VP Program Management')).toBe('delivery_leadership')
  })

  it('defaults to leadership for general executive roles', () => {
    expect(inferRoleFamilyFromTitle('Chief Operating Officer')).toBe('leadership')
    expect(inferRoleFamilyFromTitle('VP of Sales')).toBe('leadership')
    expect(inferRoleFamilyFromTitle('')).toBe('leadership')
    expect(inferRoleFamilyFromTitle(null)).toBe('leadership')
  })
})

describe('isLeadershipTitle', () => {
  it('accepts leadership-level titles', () => {
    expect(isLeadershipTitle('VP of Engineering')).toBe(true)
    expect(isLeadershipTitle('Chief Financial Officer')).toBe(true)
    expect(isLeadershipTitle('Director of Security')).toBe(true)
    expect(isLeadershipTitle('Head of Data')).toBe(true)
  })

  it('rejects individual-contributor titles', () => {
    expect(isLeadershipTitle('Senior Software Engineer')).toBe(false)
    expect(isLeadershipTitle('Data Analyst')).toBe(false)
    expect(isLeadershipTitle('')).toBe(false)
  })
})

describe('roleFamilyForRoleType', () => {
  it('maps technical role types', () => {
    expect(roleFamilyForRoleType('cio')).toBe('technical_leadership')
    expect(roleFamilyForRoleType('ciso')).toBe('technical_leadership')
    expect(roleFamilyForRoleType('cdo_data')).toBe('technical_leadership')
  })

  it('maps general leadership types and unknowns', () => {
    expect(roleFamilyForRoleType('coo')).toBe('leadership')
    expect(roleFamilyForRoleType('cpo')).toBe('leadership')
    expect(roleFamilyForRoleType(null)).toBe('leadership')
    expect(roleFamilyForRoleType('unknown_type')).toBe('leadership')
  })
})

describe('label window constants', () => {
  it('uses the plan-specified windows', () => {
    expect(LABEL_LOOKBACK_DAYS).toBe(180)
    expect(OPENING_DEDUP_WINDOW_DAYS).toBe(14)
  })
})

describe('reconcileOpeningLabels', () => {
  it('inserts only missing labels, excludes the proof event, and is idempotent', async () => {
    const existingEventIds = new Set(['event-existing'])
    const upserts = []
    const supabase = {
      from(table) {
        if (table === 'company_events') {
          return resolvedQuery({
            data: [
              { id: 'event-existing', event_date: '2026-07-01' },
              { id: 'event-missing', event_date: '2026-07-15' },
              { id: 'exec-hire-event', event_date: '2026-08-01' },
            ],
            error: null,
          })
        }
        if (table === 'event_outcome_labels') {
          return {
            select: () => resolvedQuery({
              data: [...existingEventIds].map((eventId) => ({ event_id: eventId })),
              error: null,
            }),
            upsert: async (rows) => {
              upserts.push(rows)
              for (const row of rows) existingEventIds.add(row.event_id)
              return { error: null }
            },
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    const input = {
      openingId: 'opening-1',
      canonicalCompanyId: 'company-1',
      openedOn: '2026-08-01',
      excludeEventId: 'exec-hire-event',
    }

    await expect(reconcileOpeningLabels(supabase, input)).resolves.toBe(1)
    expect(upserts).toEqual([[
      {
        event_id: 'event-missing',
        opening_id: 'opening-1',
        days_to_opening: 17,
      },
    ]])

    await expect(reconcileOpeningLabels(supabase, input)).resolves.toBe(0)
    expect(upserts).toHaveLength(1)
  })

  it('uses the existing opening date and excludes its original exec-hire proof event', async () => {
    const upserts = []
    const supabase = {
      from(table) {
        if (table === 'role_openings') {
          return {
            select: () => {
              const query = resolvedQuery({
                data: {
                  id: 'opening-1',
                  opened_on: '2026-08-01',
                  label_source: 'exec_hire',
                  source_ref: 'exec-hire-original',
                },
                error: null,
              })
              query.maybeSingle = () => query
              return query
            },
          }
        }
        if (table === 'company_events') {
          return resolvedQuery({
            data: [
              { id: 'exec-hire-original', event_date: '2026-08-01' },
              { id: 'exec-hire-late-arrival', event_date: '2026-07-30' },
              { id: 'event-missing', event_date: '2026-07-15' },
            ],
            error: null,
          })
        }
        if (table === 'event_outcome_labels') {
          return {
            select: () => resolvedQuery({ data: [], error: null }),
            upsert: async (rows) => {
              upserts.push(rows)
              return { error: null }
            },
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    const result = await recordRoleOpening(supabase, {
      canonicalCompanyId: 'company-1',
      roleFamily: 'technical_leadership',
      openedOn: '2026-07-30',
      labelSource: 'exec_hire',
      sourceRef: 'exec-hire-late-arrival',
      excludeEventId: 'exec-hire-late-arrival',
    })

    expect(result).toEqual({ openingId: 'opening-1', labeledEvents: 1, existing: true })
    expect(upserts).toEqual([[
      {
        event_id: 'event-missing',
        opening_id: 'opening-1',
        days_to_opening: 17,
      },
    ]])
  })

  it('excludes all exec-hire proof events inside the opening dedup window', async () => {
    const upserts = []
    const supabase = {
      from(table) {
        if (table === 'company_events') {
          return resolvedQuery({
            data: [
              { id: 'exec-hire-original', event_date: '2026-08-01', event_type: 'exec_hire' },
              { id: 'exec-hire-overlap', event_date: '2026-07-30', event_type: 'exec_hire' },
              { id: 'earlier-signal', event_date: '2026-07-01', event_type: 'acquisition' },
            ],
            error: null,
          })
        }
        if (table === 'event_outcome_labels') {
          return {
            select: () => resolvedQuery({ data: [], error: null }),
            upsert: async (rows) => {
              upserts.push(rows)
              return { error: null }
            },
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    const labeledEvents = await reconcileOpeningLabels(supabase, {
      openingId: 'opening-1',
      canonicalCompanyId: 'company-1',
      openedOn: '2026-08-01',
      excludeEventId: 'exec-hire-original',
      excludeDeduplicatedExecHires: true,
    })

    expect(labeledEvents).toBe(1)
    expect(upserts.flat().map((row) => row.event_id)).toEqual(['earlier-signal'])
  })
})
