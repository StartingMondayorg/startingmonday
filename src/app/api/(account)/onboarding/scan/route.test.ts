import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  upsertCompanies: vi.fn(),
  listCompaniesIn: vi.fn(),
  listCompaniesOrdered: vi.fn(),
  listScans: vi.fn(),
  signalCount: vi.fn(),
  logEvent: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

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
                in: state.listCompaniesIn,
                order: vi.fn(() => ({
                  limit: state.listCompaniesOrdered,
                })),
              })),
            })),
          })),
        }
      }
      if (table === 'scan_results') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: state.listScans,
              })),
            })),
          })),
        }
      }
      if (table === 'company_signals') {
        return {
          select: vi.fn(() => ({
            eq: state.signalCount,
          })),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/onboarding/scan/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    state.upsertCompanies.mockResolvedValue({ error: null })
    state.listCompaniesIn.mockResolvedValue({
      data: [
        { id: 'c1', name: 'Acme', career_page_url: 'https://acme.com/careers' },
        { id: 'c2', name: 'Globex', career_page_url: null },
      ],
      error: null,
    })
    state.listCompaniesOrdered.mockResolvedValue({
      data: [
        { id: 'c1', name: 'Acme', career_page_url: 'https://acme.com/careers' },
        { id: 'c2', name: 'Globex', career_page_url: null },
      ],
      error: null,
    })
    state.listScans.mockResolvedValue({
      data: [{ company_id: 'c1', status: 'success', raw_hits: [{ is_match: true }, { is_match: false }], scanned_at: '2026-07-07T00:00:00.000Z' }],
    })
    state.signalCount.mockResolvedValue({ count: 3 })
    state.logEvent.mockResolvedValue(undefined)
    state.createClient.mockResolvedValue(buildSupabase())
    state.fetch.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', state.fetch)
  })

  it('returns 401 when unauthenticated', async () => {
    state.getUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(new Request('https://startingmonday.app/api/onboarding/scan', {
      method: 'POST',
      body: JSON.stringify({ companyNames: ['Acme'] }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when no valid company names are provided', async () => {
    const res = await POST(new Request('https://startingmonday.app/api/onboarding/scan', {
      method: 'POST',
      body: JSON.stringify({ companyNames: ['   ', 42] }),
    }))

    expect(res.status).toBe(400)
    expect(state.upsertCompanies).not.toHaveBeenCalled()
  })

  it('upserts companies and triggers worker scan and signal refresh', async () => {
    vi.stubEnv('WORKER_URL', 'https://worker.internal')
    vi.stubEnv('WORKER_SECRET', 'secret')

    const res = await POST(new Request('https://startingmonday.app/api/onboarding/scan', {
      method: 'POST',
      body: JSON.stringify({ companyNames: ['Acme', 'Globex', 'Acme'] }),
    }))

    expect(res.status).toBe(202)
    expect(state.upsertCompanies).toHaveBeenCalledTimes(1)
    const urls = state.fetch.mock.calls.map(call => String(call[0]))
    expect(urls).toContain('https://worker.internal/trigger-scan')
    expect(urls).toContain('https://worker.internal/trigger-signals')
    await expect(res.json()).resolves.toMatchObject({ ok: true, workerAvailable: true })
  })

  it('reports per-company progress with scan and signal state', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      signalCount: 3,
      companies: [
        { companyId: 'c1', name: 'Acme', scannable: true, status: 'complete', matches: 1 },
        { companyId: 'c2', name: 'Globex', scannable: false, status: 'queued', matches: 0 },
      ],
      progress: { total: 2, scannable: 1, completed: 1, done: true },
    })
  })
})
