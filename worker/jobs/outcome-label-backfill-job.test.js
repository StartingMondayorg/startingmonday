import { describe, expect, it, vi } from 'vitest'
import { fetchAllSuccessfulCareerScans } from './outcome-label-backfill-job.js'

describe('fetchAllSuccessfulCareerScans', () => {
  it('continues past a full page and preserves chronological ordering', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      company_id: `company-${index}`,
      scanned_at: `2026-01-01T00:00:${String(index % 60).padStart(2, '0')}Z`,
      raw_hits: [],
    }))
    const secondPage = [{ company_id: 'company-new', scanned_at: '2026-08-12T00:00:00Z', raw_hits: [] }]
    const ranges = []
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      gte: vi.fn(),
      range: vi.fn((from, to) => {
        ranges.push([from, to])
        return Promise.resolve({ data: from === 0 ? firstPage : secondPage, error: null })
      }),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    const supabase = { from: vi.fn(() => query) }

    const rows = await fetchAllSuccessfulCareerScans(supabase)

    expect(rows).toHaveLength(1001)
    expect(rows.at(-1)?.company_id).toBe('company-new')
    expect(ranges).toEqual([[0, 999], [1000, 1999]])
  })

  it('applies the persisted scan timestamp during incremental passes', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      gte: vi.fn(),
      range: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    const supabase = { from: vi.fn(() => query) }

    await fetchAllSuccessfulCareerScans(supabase, { afterScannedAt: '2026-08-01T00:00:00Z' })

    expect(query.gte).toHaveBeenCalledWith('scanned_at', '2026-08-01T00:00:00Z')
  })
})