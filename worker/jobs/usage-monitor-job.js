import { getSupabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'
import { getMonthlyUsage } from '../lib/usage-tracker.js'
import { notify } from '../lib/notify.js'

// Configurable limits via env vars — update when you upgrade a plan.
const LIMITS = {
  anthropic:   parseInt(process.env.ANTHROPIC_MONTHLY_TOKEN_LIMIT  ?? '1000000'),  // 1M tokens
  // WARNING: BROWSERLESS_MONTHLY_SESSION_LIMIT is not set on the Railway worker, so
  // this falls back to 50, a placeholder that has never matched the real browserless.io
  // plan. Recorded usage is ~491 sessions/month, so this alerts at ~982% every day.
  // Set the env var to the actual plan limit before trusting this number (SMK-472).
  browserless: parseInt(process.env.BROWSERLESS_MONTHLY_SESSION_LIMIT ?? '50'),
  resend:      parseInt(process.env.RESEND_MONTHLY_EMAIL_LIMIT      ?? '3000'),    // free tier
}

const WARN_THRESHOLD  = 0.75
const ALERT_THRESHOLD = 0.90

export async function runUsageMonitorJob() {
  const supabase = getSupabase()
  logger.info('usage-monitor-job: checking monthly usage')

  const results = await Promise.all(
    Object.entries(LIMITS).map(async ([service, limit]) => {
      const usage = await getMonthlyUsage(supabase, { service })
      const metric = service === 'anthropic' ? usage.tokens : usage.requests
      const pct = limit > 0 ? metric / limit : 0
      return { service, metric, limit, pct }
    })
  )

  const warnings = results.filter(r => r.pct >= WARN_THRESHOLD)

  if (!warnings.length) {
    logger.info('usage-monitor-job: all services within limits', {
      usage: results.map(r => `${r.service}: ${(r.pct * 100).toFixed(1)}%`).join(', '),
    })
    return
  }

  for (const w of warnings) {
    const level = w.pct >= ALERT_THRESHOLD ? 'ALERT' : 'WARNING'
    const metricLabel = w.service === 'anthropic' ? 'tokens' : 'requests'
    const subject = `${level}: ${w.service} at ${(w.pct * 100).toFixed(0)}% of monthly limit`
    const body = [
      `Service: ${w.service}`,
      `Usage this month: ${w.metric.toLocaleString()} ${metricLabel}`,
      `Monthly limit: ${w.limit.toLocaleString()} ${metricLabel}`,
      `Utilization: ${(w.pct * 100).toFixed(1)}%`,
      '',
      w.pct >= ALERT_THRESHOLD
        ? `ACTION REQUIRED: You are at ${(w.pct * 100).toFixed(0)}% of your ${w.service} plan. Upgrade now to avoid service interruption.`
        : `You are at ${(w.pct * 100).toFixed(0)}% of your ${w.service} plan. Consider upgrading soon.`,
      '',
      `To update the limit after upgrading, set ${w.service.toUpperCase()}_MONTHLY_${w.service === 'anthropic' ? 'TOKEN' : w.service === 'browserless' ? 'SESSION' : 'EMAIL'}_LIMIT in your environment variables.`,
    ].join('\n')

    logger.warn(`usage-monitor-job: ${subject}`)
    await notify({ subject, body })
  }
}
