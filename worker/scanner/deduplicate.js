import { logger } from '../lib/logger.js'

// The rescan window exists to stop a company being fetched twice inside one
// scheduled cycle. It must therefore stay strictly BELOW the shortest gap
// between two scheduled runs for that company, or it swallows the very cadence
// it is meant to protect.
//
// Standard tiers run Mon/Wed/Fri 08:00 UTC — shortest gap 48h. A 48h window
// collided exactly: Monday's row is written after fetch and scoring finish, so
// its scanned_at lands past the Wednesday cutoff and Wednesday was skipped.
// Daily tiers (executive, campaign) are scheduled at 08:00 and 20:00 UTC —
// shortest gap 12h.
//
// Each window keeps roughly a 2h margin under its cadence to absorb job
// runtime, queue backlog and cron drift.
export const RESCAN_WINDOW_STANDARD_HOURS = 40
export const RESCAN_WINDOW_DAILY_HOURS = 10

// Tiers scheduled more often than Mon/Wed/Fri. Kept in sync with DAILY_TIERS in
// worker/jobs/scan-job.js.
const DAILY_SCAN_TIERS = new Set(['executive', 'campaign'])

// Window a company's tier is entitled to. Unknown or missing tier falls back to
// the standard cadence.
export function rescanWindowHoursForTier(tier) {
  return DAILY_SCAN_TIERS.has(tier) ? RESCAN_WINDOW_DAILY_HOURS : RESCAN_WINDOW_STANDARD_HOURS
}

// Returns true if this company was successfully scanned within the rescan window.
// Prevents hammering a site twice in the same cycle.
export async function wasRecentlyScanned(supabase, companyId, windowHours = RESCAN_WINDOW_STANDARD_HOURS) {
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('scan_results')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'success')
    .gte('scanned_at', cutoff.toISOString())
    .limit(1)

  if (error) {
    logger.error('deduplicate: DB query failed', { companyId, error: error.message })
    return false
  }

  return data.length > 0
}

// Returns job titles from the most recent scan for this company, used to detect
// new postings vs ones already seen and notified.
export async function getPreviousHitTitles(supabase, companyId) {
  const { data, error } = await supabase
    .from('scan_results')
    .select('raw_hits')
    .eq('company_id', companyId)
    .eq('status', 'success')
    .order('scanned_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) return new Set()

  const hits = data[0].raw_hits ?? []
  return new Set(hits.map(h => h.title?.toLowerCase()))
}
