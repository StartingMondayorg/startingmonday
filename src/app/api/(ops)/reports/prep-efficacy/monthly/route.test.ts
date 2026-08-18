import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  rows: [] as Array<Record<string, unknown>>,
  error: null as null | { message: string },
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: state.rows, error: state.error })),
          })),
        })),
      })),
    })),
  })),
}))

describe('monthly prep efficacy report route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u1' })
    state.rows = [
      {
        month_start: '2026-07-01',
        total_outcomes: 5,
        advanced_count: 3,
        offer_count: 1,
        rejected_count: 1,
        advance_rate_pct: 60,
        offer_rate_pct: 20,
      },
    ]
    state.error = null
  })

  it('returns normalized monthly rows', async () => {
    const { GET } = await import('./route')
    const req = new Request('https://startingmonday.app/api/reports/prep-efficacy/monthly?months=6')

    const res = await GET(req as any)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      months: 1,
      rows: [
        {
          month_start: '2026-07-01',
          total_outcomes: 5,
          advanced_count: 3,
          offer_count: 1,
          rejected_count: 1,
          advance_rate_pct: 60,
          offer_rate_pct: 20,
        },
      ],
    })
  })
})
