import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const select = vi.fn()
const eq = vi.fn()
const limit = vi.fn()
const not = vi.fn()
const from = vi.fn()
vi.mock('../lib/supabase.js', () => ({
  getSupabase: () => ({ rpc, from }),
}))
vi.mock('../lib/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }))

describe('runSearchLagStatsJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes supported descriptive cohorts through the atomic RPC', async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: [{ company_rows: 1, industry_rows: 0, role_rows: 0 }] })
      .mockResolvedValueOnce({ data: true })
    select.mockReturnValue({ eq })
    eq.mockReturnValue({ limit })
    from
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce({ select: () => ({ not }) })
    limit.mockResolvedValueOnce({
      data: [30, 60, 90].map((lag_days) => ({
        company_name: 'Acme', company_cik: '123', company_sector: 'Tech',
        company_sic_code: '7372', company_stage: 'public_mid',
        title_normalized: 'CIO', lag_days, search_year: 2024,
        matching_policy_version: 'cik-role-earliest-v1',
      })),
      error: null,
    })
    not.mockReturnValue({ limit: vi.fn().mockResolvedValue({
      data: [{ name: 'Acme', sec_cik_padded: '0000000123', sector: 'Tech' }],
      error: null,
    }) })

    const { runSearchLagStatsJob } = await import('./search-lag-stats-job.js')
    const summary = await runSearchLagStatsJob()

    expect(summary.companyGroupsPublished).toBe(1)
    expect(summary.industryGroupsPublished).toBe(0)
    expect(rpc).toHaveBeenNthCalledWith(2, 'replace_search_lag_stats', expect.objectContaining({
      p_stats_version: 'search-lag-stats-v1',
      p_source_policy: 'cik-role-earliest-v1',
    }))
    expect(rpc).toHaveBeenLastCalledWith('advisory_unlock', expect.any(Object))
  })

  it('returns without reading data when another instance holds the lock', async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null })
    const { runSearchLagStatsJob } = await import('./search-lag-stats-job.js')

    await expect(runSearchLagStatsJob()).resolves.toBeUndefined()
    expect(from).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('fails visibly when lock acquisition errors', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc unavailable' } })
    const { runSearchLagStatsJob } = await import('./search-lag-stats-job.js')

    await expect(runSearchLagStatsJob()).rejects.toThrow('search_lag_stats_lock_failed:rpc unavailable')
    expect(from).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})