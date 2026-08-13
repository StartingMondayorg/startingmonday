import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn()
const notFound = vi.fn()
const getStaffMember = vi.fn()
const getUser = vi.fn()
const adminFrom = vi.fn()

vi.mock('next/navigation', () => ({ redirect, notFound }))
vi.mock('@/lib/staff', () => ({ getStaffMember }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: adminFrom })),
}))
vi.mock('./client', () => ({
  IntelligenceAdminClient: () => <div>Intelligence company controls</div>,
}))

function queryFor(result: { data?: unknown; count?: number | null }) {
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    gte: vi.fn(),
    gt: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    lt: vi.fn(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  for (const method of ['select', 'order', 'limit', 'gte', 'gt', 'eq', 'is', 'in', 'lt'] as const) {
    query[method].mockReturnValue(query)
  }
  return query
}

describe('AdminIntelligencePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'owner@example.com' } } })
    getStaffMember.mockResolvedValue({ role: 'owner' })
    adminFrom.mockImplementation((table: string) => {
      if (table === 'search_lag_role_stats') {
        return queryFor({ data: [{
          title_normalized: 'CIO',
          median_search_lag_days: 95,
          p25_search_lag_days: 3,
          p75_search_lag_days: 245,
          sample_size: 249,
          updated_at: '2026-08-13T04:00:00.000Z',
        }] })
      }
      if (table === 'company_tenure_stats' || table === 'industry_tenure_stats') {
        return queryFor({ data: [] })
      }
      return queryFor({ data: [], count: 0 })
    })
  })

  it('renders evidence-bounded role context for staff', async () => {
    const { default: AdminIntelligencePage } = await import('./page')
    const html = renderToStaticMarkup(await AdminIntelligencePage())

    expect(html).toContain('Search-lag context (internal)')
    expect(html).toContain('CIO: median 95 days')
    expect(html).toContain('(n=249)')
    expect(html).toContain('Unsupported cohorts are withheld')
    expect(html).toContain('Intelligence company controls')
    expect(redirect).not.toHaveBeenCalled()
    expect(notFound).not.toHaveBeenCalled()
  })
})