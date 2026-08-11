import { logger } from '../lib/logger.js'
import { sendWorkerSlackAlert } from '../lib/slack-alert.js'
import { callCronRoute } from '../lib/cron-route.js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
const CRON_SECRET = process.env.CRON_SECRET

export async function runProviderQualityAuditJob() {
  if (!CRON_SECRET) {
    await sendWorkerSlackAlert('*Provider quality audit hard failure*\n- Reason: CRON_SECRET is missing in worker runtime\n- Job: provider-quality-audit-job')
    throw new Error('provider-quality-audit-job: CRON_SECRET missing')
  }

  const url = `${APP_URL}/api/cron/provider-quality-audit`
  const result = await callCronRoute({
    job: 'provider-quality-audit-job',
    url,
    cronSecret: CRON_SECRET,
    userAgent: 'startingmonday-worker/provider-quality-audit-job',
  })

  if (!result.ok && result.transient) {
    logger.warn('provider-quality-audit-job: transient upstream failure, skipping hard error', {
      status: result.status,
      error: result.error,
      body: result.payload,
    })
    return
  }

  if (!result.ok) {
    logger.error('provider-quality-audit-job: web route failed', {
      status: result.status,
      body: result.payload,
    })
    throw new Error(`provider-quality-audit route failed with status ${result.status}`)
  }

  logger.info('provider-quality-audit-job: completed', result.payload)
}
