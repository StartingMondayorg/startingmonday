import { logger } from '../lib/logger.js'
import { getSupabase } from '../lib/supabase.js'
import {
  buildSearchLagStats,
  enrichSearchLagRows,
  SEARCH_LAG_SOURCE_POLICY,
  SEARCH_LAG_STATS_VERSION,
} from '../lib/search-lag-stats.js'

const SEARCH_LAG_STATS_LOCK_KEY = 6128473910n

export async function runSearchLagStatsJob() {
  const supabase = getSupabase()
  const { data: locked, error: lockError } = await supabase.rpc('try_advisory_lock', { p_key: SEARCH_LAG_STATS_LOCK_KEY })
  if (lockError) throw new Error(`search_lag_stats_lock_failed:${lockError.message}`)
  if (!locked) {
    logger.warn('search-lag-stats-job: another instance running — skipping')
    return
  }

  try {
    const [lagResult, companyResult] = await Promise.all([
      supabase
        .from('exec_search_lag')
        .select('company_name, company_cik, company_sector, company_sic_code, company_stage, title_normalized, lag_days, search_year, matching_policy_version')
        .eq('matching_policy_version', SEARCH_LAG_SOURCE_POLICY)
        .limit(5000),
      supabase
        .from('canonical_companies')
        .select('name, sec_cik_padded, sector')
        .not('sec_cik_padded', 'is', null)
        .limit(5000),
    ])
    if (lagResult.error) throw new Error(`search_lag_fetch_failed:${lagResult.error.message}`)
    if (companyResult.error) throw new Error(`canonical_company_fetch_failed:${companyResult.error.message}`)

    const result = buildSearchLagStats(enrichSearchLagRows(lagResult.data, companyResult.data))
    const { data: replaced, error: replaceError } = await supabase.rpc('replace_search_lag_stats', {
      p_company_rows: result.companyRows,
      p_industry_rows: result.industryRows,
      p_role_rows: result.roleRows,
      p_stats_version: SEARCH_LAG_STATS_VERSION,
      p_source_policy: SEARCH_LAG_SOURCE_POLICY,
    })
    if (replaceError) throw new Error(`search_lag_stats_replace_failed:${replaceError.message}`)

    logger.info('search-lag-stats-job: complete', {
      ...result.summary,
      replaced: replaced?.[0] ?? null,
    })
    return result.summary
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: SEARCH_LAG_STATS_LOCK_KEY })
  }
}