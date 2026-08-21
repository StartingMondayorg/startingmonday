import { getSupabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'
import { trackUsage } from '../lib/usage-tracker.js'
import { createLimiter } from '../lib/concurrency.js'
import { scanCompany } from '../scanner/scan-company.js'
import { rescanWindowHoursForTier } from '../scanner/deduplicate.js'
import { writeScanFailureDeadLetter } from '../lib/scan-dead-letter.js'
import { notify } from '../lib/notify.js'

const MAX_CONCURRENT_SCANS = 10

// Retry a scan once on transient errors (network timeouts, browserless.io blips).
// Does not retry robots.txt blocks or deliberate skips.
async function scanWithRetry(supabase, company, profile, options) {
  try {
    return await scanCompany(supabase, company, profile, options)
  } catch (err) {
    const isTransient = (
      err.message?.includes('timeout') ||
      err.message?.includes('ECONNRESET') ||
      err.message?.includes('ENOTFOUND') ||
      err.message?.includes('502') ||
      err.message?.includes('503')
    )
    if (!isTransient) throw err

    logger.warn(`scan-job: transient error for ${company.name}, retrying in 3s`, { error: err.message })
    await new Promise(r => setTimeout(r, 3000))
    return scanCompany(supabase, company, profile, options)
  }
}

const SCAN_LOCK_KEY = 7329841023n // arbitrary stable bigint key for pg_advisory_lock

export async function runScanJob() {
  const supabase = getSupabase()
  logger.info('scan-job: starting')

  // Acquire a Postgres advisory lock so only one worker instance runs at a time.
  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: SCAN_LOCK_KEY })
  if (!locked) {
    logger.warn('scan-job: another instance is already running — skipping')
    return
  }

  // Everything after lock acquisition is wrapped in try/finally so the lock
  // is always released even if a query fails or an early return is hit.
  let companies = []
  let browserlessCalls = 0
  let anthropicCalls = 0

  try {
    // Only scan companies belonging to active or trialing users — not free/canceled/inactive.
    const { data: activeUsers, error: userErr } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .in('subscription_status', ['active', 'trialing'])
      .limit(2000)

    if (userErr) {
      logger.error('scan-job: failed to fetch active users', { error: userErr.message })
      return
    }

    if (!(activeUsers ?? []).length) {
      logger.info('scan-job: no active users — done')
      return
    }

    // Executive and campaign users scan daily. All others scan Mon/Wed/Fri only.
    const DAILY_TIERS = new Set(['executive', 'campaign'])
    const tierByUserId = Object.fromEntries((activeUsers ?? []).map(u => [u.id, u.subscription_tier]))
    const todayUtc = new Date().getUTCDay() // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
    const isMWF = todayUtc === 1 || todayUtc === 3 || todayUtc === 5
    const eligibleUserIds = isMWF
      ? (activeUsers ?? []).map(u => u.id)
      : (activeUsers ?? []).filter(u => DAILY_TIERS.has(u.subscription_tier)).map(u => u.id)

    if (!eligibleUserIds.length) {
      logger.info(`scan-job: non-MWF day, no executive users to scan — done`)
      return
    }

    logger.info(`scan-job: scanning ${eligibleUserIds.length} user(s) (isMWF=${isMWF})`)

    const { data: companiesData, error: companyErr } = await supabase
      .from('companies')
      .select('id, name, user_id, career_page_url, company_url, linkedin_url, role_watch_description, sector')
      .in('user_id', eligibleUserIds)
      .is('archived_at', null)
      .limit(5000)

    if (companyErr) {
      logger.error('scan-job: failed to fetch companies', { error: companyErr.message })
      return
    }

    companies = companiesData ?? []

    if (!companies.length) {
      logger.info('scan-job: no active companies — done')
      return
    }

    const userIds = [...new Set(companies.map(c => c.user_id))]
    const { data: profiles, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, current_title, target_titles, target_sectors, positioning_summary, role_type, search_persona, beyond_resume, resume_text')
      .in('user_id', userIds)

    if (profileErr) {
      logger.error('scan-job: failed to fetch profiles', { error: profileErr.message })
      return
    }

    const profileByUserId = Object.fromEntries(profiles.map(p => [p.user_id, p]))

    logger.info(`scan-job: ${companies.length} companies across ${userIds.length} user(s)`)

    const limit = createLimiter(MAX_CONCURRENT_SCANS)
    const tasks = companies.map(company =>
      limit(async () => {
        const profile = profileByUserId[company.user_id] ?? {}
        // Daily-tier companies are also scanned by executive-scan-job, so they
        // need the shorter window or this run suppresses their next one.
        const rescanWindowHours = rescanWindowHoursForTier(tierByUserId[company.user_id])
        try {
          const result = await scanWithRetry(supabase, company, profile, { rescanWindowHours })
          if (!result.skipped && !result.blocked) {
            // Count a browserless.io call only when a render actually happened.
            // ATS-feed and plain-fetch scans open no browser, so counting every
            // scan made recorded usage meaningless (SMK-476).
            if (result.acquisitionPath === 'render') {
              browserlessCalls++
            }
            anthropicCalls += result.hits ?? 0
          }
          return result
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error('scan-job: company scan failed', {
            event: 'scan_failure',
            company_id: company.id,
            company_name: company.name,
            user_id: company.user_id,
            error: msg,
          })
          await writeScanFailureDeadLetter(supabase, {
            jobName: 'scan-job',
            userId: company.user_id,
            companyId: company.id,
            companyName: company.name,
            error: msg,
          })
        }
      })
    )

    await Promise.all(tasks)

    // Track aggregate usage for this scan run
    if (browserlessCalls > 0) {
      await trackUsage(supabase, { service: 'browserless', requests: browserlessCalls })
    }
    if (anthropicCalls > 0) {
      // Each score-hit call uses ~200 tokens (Haiku)
      await trackUsage(supabase, { service: 'anthropic', requests: anthropicCalls, tokens: anthropicCalls * 200 })
    }

    // Alert on companies with 3 consecutive non-productive scans (silent failure detection).
    // "Non-productive" = status is 'error' or 'blocked', or status 'success' with 0 raw_hits.
    await checkSilentFailures(supabase, companies)

    logger.info('scan-job: complete', { browserlessCalls, anthropicCalls })
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: SCAN_LOCK_KEY })
  }
}

async function checkSilentFailures(supabase, companies) {
  const companyIds = companies.map(c => c.id)
  if (!companyIds.length) return

  // Fetch the last 3 scan results for every company in this batch in one query.
  // We use a window function approach: fetch all recent results and slice per company in JS.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentScans, error } = await supabase
    .from('scan_results')
    .select('company_id, status, raw_hits, scanned_at')
    .in('company_id', companyIds)
    .gte('scanned_at', since)
    .order('scanned_at', { ascending: false })
    .limit(companyIds.length * 5) // at most 5 recent results per company

  if (error) {
    logger.warn('scan-job: silent-failure check query failed', { error: error.message })
    return
  }

  // Group by company_id, keep latest 3 per company
  const byCompany = {}
  for (const row of (recentScans ?? [])) {
    if (!byCompany[row.company_id]) byCompany[row.company_id] = []
    if (byCompany[row.company_id].length < 3) byCompany[row.company_id].push(row)
  }

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
  const failures = []

  for (const [companyId, scans] of Object.entries(byCompany)) {
    if (scans.length < 3) continue // not enough history yet
    const allNonProductive = scans.every(s =>
      s.status === 'error' ||
      s.status === 'blocked' ||
      (s.status === 'success' && (s.raw_hits ?? []).length === 0)
    )
    if (allNonProductive) {
      failures.push(companyMap[companyId])
    }
  }

  if (!failures.length) return

  const lines = failures.map(c => `  - ${c.name} (user: ${c.user_id}, url: ${c.career_page_url ?? 'none'})`)
  await notify({
    subject: `Silent scan failures: ${failures.length} company${failures.length === 1 ? '' : 's'}`,
    body: `The following companies have returned 0 results on each of the last 3 scans.\n\nThis may mean the career page URL is stale, the site blocks the scraper, or the page structure changed.\n\n${lines.join('\n')}\n\nCheck the scan_results table or Railway logs for details.`,
  })

  logger.warn('scan-job: silent failure alert sent', { count: failures.length, companies: failures.map(c => c.name) })
}
