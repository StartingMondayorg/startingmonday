import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  upsertCompanies: vi.fn(),
  listCompanies: vi.fn(),
  listContacts: vi.fn(),
  insertContacts: vi.fn(),
  logEvent: vi.fn(),
  provider: { providerName: 'none' as const, enrichPeople: vi.fn() },
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/enrichment', () => ({ getEnrichmentProvider: () => state.provider }))

import { GET, POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table === 'companies') {
        return {
          upsert: state.upsertCompanies,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: state.listCompanies,
                  })),
                })),
                order: vi.fn(() => ({
                  limit: state.listCompanies,
                })),
              })),
            })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: state.listContacts,
            })),
          })),
          insert: state.insertContacts,
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/onboarding/enrich/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    state.upsertCompanies.mockResolvedValue({ error: null })
    state.listCompanies.mockResolvedValue({
      data: [
        { id: 'c1', name: 'Acme' },
        { id: 'c2', name: 'Globex' },
      ],
      error: null,
    })
    state.listContacts.mockResolvedValue({
      data: [{ company_id: 'c1', name: 'Existing Contact', enrichment_source: 'anthropic' }],
      error: null,
    })
    state.provider.enrichPeople.mockImplementation(async ({ companyName }: { companyName: string }) => {
      if (companyName === 'Acme') {
        return [{ name: 'New Person', title: 'CIO', reason: 'Match', source: 'anthropic', confidence: 0.8 }]
      }
      return [{ name: 'Globex Person', title: 'COO', reason: 'Match', source: 'anthropic', confidence: 0.75 }]
    })
    state.insertContacts.mockResolvedValue({ error: null })
    state.logEvent.mockResolvedValue(undefined)
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns 401 when unauthenticated', async () => {
    state.getUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(
      new Request('https://startingmonday.app/api/onboarding/enrich', {
        method: 'POST',
        body: JSON.stringify({ companyNames: ['Acme'] }),
      })
    )

    expect(res.status).toBe(401)
  })

  it('inserts enriched contacts and returns accepted response', async () => {
    const res = await POST(
      new Request('https://startingmonday.app/api/onboarding/enrich', {
        method: 'POST',
        body: JSON.stringify({ companyNames: ['Acme', 'Globex'] }),
      })
    )

    expect(res.status).toBe(202)
    expect(state.upsertCompanies).toHaveBeenCalledTimes(1)
    expect(state.provider.enrichPeople).toHaveBeenCalledTimes(2)
    expect(state.insertContacts).toHaveBeenCalledTimes(1)
    await expect(res.json()).resolves.toMatchObject({ ok: true, contactsInserted: 2, provider: 'none' })
  })

  it('returns 400 when no companies are available', async () => {
    state.listCompanies.mockResolvedValue({ data: [], error: null })

    const res = await POST(
      new Request('https://startingmonday.app/api/onboarding/enrich', {
        method: 'POST',
        body: JSON.stringify({ companyNames: ['Acme'] }),
      })
    )

    expect(res.status).toBe(400)
    expect(state.insertContacts).not.toHaveBeenCalled()
  })

  it('returns per-company relationship progress', async () => {
    state.listContacts.mockResolvedValue({
      data: [
        { company_id: 'c1', name: 'A Contact', enrichment_source: 'anthropic' },
        { company_id: 'c1', name: 'Manual Contact', enrichment_source: 'manual' },
      ],
      error: null,
    })

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      companies: [
        { companyId: 'c1', name: 'Acme', contacts: 2, enrichedContacts: 1, status: 'complete' },
        { companyId: 'c2', name: 'Globex', contacts: 0, enrichedContacts: 0, status: 'scanning' },
      ],
      progress: {
        total: 2,
        completed: 1,
        done: true,
        totalContacts: 2,
        totalEnriched: 1,
      },
    })
  })
})
