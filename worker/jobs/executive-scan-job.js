import { getSupabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'
import { trackUsage } from '../lib/usage-tracker.js'
import { createLimiter } from '../lib/concurrency.js'
import { writeScanFailureDeadLetter } from '../lib/scan-dead-letter.js'
import { scanCompany } from '../scanner/scan-company.js'
import { RESCAN_WINDOW_DAILY_HOURS } from '../scanner/deduplicate.js'
import { sendRoleFitAlert } from '../lib/signal-alert.js'

const MAX_CONCURRENT_SCANS = 5

async function scanWithRetry(supabase, company, profile) {
  // Executive tier is scheduled at 08:00 and 20:00 UTC -- 12h apart.
  const options = { rescanWindowHours: RESCAN_WINDOW_DAILY_HOURS }
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
    logger.warn(`executive-scan-job: transient error for ${company.name}, retrying in 3s`, { error: err.message })
    await new Promise(r => setTimeout(r, 3000))
    return scanCompany(supabase, company, profile, options)
  }
}

const EXEC_SCAN_LOCK_KEY = 8812743901n

export async function runExecutiveScanJob() {
  const supabase = getSupabase()
  logger.info('executive-scan-job: starting')

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: EXEC_SCAN_LOCK_KEY })
  if (!locked) {
    logger.warn('executive-scan-job: another instance already running — skipping')
    return
  }

  // Only scan companies for executive tier users
  const { data: execUsers, error: userErr } = await supabase
    .from('users')
    .select('id, email')
    .eq('subscription_tier', 'executive')
    .eq('subscription_status', 'active')

  if (userErr) {
    logger.error('executive-scan-job: failed to fetch executive users', { error: userErr.message })
    await supabase.rpc('advisory_unlock', { p_key: EXEC_SCAN_LOCK_KEY })
    return
  }

  if (!execUsers?.length) {
    logger.info('executive-scan-job: no executive users — done')
    await supabase.rpc('advisory_unlock', { p_key: EXEC_SCAN_LOCK_KEY })
    return
  }

  const execUserIds = execUsers.map(u => u.id)
  const userEmailById = Object.fromEntries(execUsers.map(u => [u.id, u.email]))

  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('*')
    .in('user_id', execUserIds)
    .is('archived_at', null)
    .limit(1000)

  if (companyErr) {
    logger.error('executive-scan-job: failed to fetch companies', { error: companyErr.message })
    await supabase.rpc('advisory_unlock', { p_key: EXEC_SCAN_LOCK_KEY })
    return
  }

  if (!companies?.length) {
    logger.info('executive-scan-job: no companies for executive users — done')
    await supabase.rpc('advisory_unlock', { p_key: EXEC_SCAN_LOCK_KEY })
    return
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', execUserIds)

  const profileByUserId = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))

  logger.info(`executive-scan-job: ${companies.length} companies for ${execUserIds.length} executive user(s)`)

  let browserlessCalls = 0
  let anthropicCalls = 0

  const limit = createLimiter(MAX_CONCURRENT_SCANS)
  const tasks = companies.map(company =>
    limit(async () => {
      const profile = profileByUserId[company.user_id] ?? {}
      try {
        const result = await scanWithRetry(supabase, company, profile)
        if (!result.skipped && !result.blocked) {
          // Count a browserless.io call only when a render actually happened.
          // ATS-feed and plain-fetch scans open no browser, so counting every
          // scan made recorded usage meaningless (SMK-476).
          if (result.acquisitionPath === 'render') {
            browserlessCalls++
          }
          anthropicCalls += result.hits ?? 0
          const email = userEmailById[company.user_id]
          if (email && result.newMatchTitles?.length > 0) {
            sendRoleFitAlert({
              to: email,
              companyName: company.name,
              companyId: company.id,
              matchTitles: result.newMatchTitles,
            }).catch(err => logger.error('executive-scan-job: role fit alert failed', { company: company.name, error: err.message }))
          }
        }
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.error('executive-scan-job: company scan failed', {
          event: 'scan_failure',
          company_id: company.id,
          company_name: company.name,
          user_id: company.user_id,
          error: msg,
        })
        await writeScanFailureDeadLetter(supabase, {
          jobName: 'executive-scan-job',
          userId: company.user_id,
          companyId: company.id,
          companyName: company.name,
          error: msg,
        })
      }
    })
  )

  try {
    await Promise.all(tasks)
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: EXEC_SCAN_LOCK_KEY })
  }

  if (browserlessCalls > 0) {
    await trackUsage(supabase, { service: 'browserless', requests: browserlessCalls })
  }
  if (anthropicCalls > 0) {
    await trackUsage(supabase, { service: 'anthropic', requests: anthropicCalls, tokens: anthropicCalls * 200 })
  }

  logger.info('executive-scan-job: complete', { browserlessCalls, anthropicCalls, companies: companies.length })
}
