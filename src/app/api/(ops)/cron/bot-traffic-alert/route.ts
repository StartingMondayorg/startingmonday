/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateBotTrafficAlerts, getBotTrafficSnapshot } from '@/lib/bot-traffic-report'
import { buildAlertMessage, deliverBotAlert } from '@/lib/bot-alert-slack'

// SMK-467: hourly bot traffic check.
//
// Turnstile is paused. This job exists so that decision is held on evidence
// rather than on assumption: it watches the traffic, alerts Slack when the
// numbers stop looking benign, and does nothing else. It never blocks, never
// challenges, and never changes auth behavior.

export const runtime = 'nodejs'

const COOLDOWN_HOURS = Number(process.env.BOT_ALERT_COOLDOWN_HOURS ?? '6')
const RETAIN_DAYS = Number(process.env.BOT_SIGNAL_RETAIN_DAYS ?? '30')
const DASHBOARD_PATH = '/dashboard/admin/operations/bot-traffic'

function dashboardUrl(request: NextRequest): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin
  return `${base.replace(/\/$/, '')}${DASHBOARD_PATH}`
}

/**
 * Suppress an alert code that already fired inside the cooldown window, so a
 * sustained attack produces one message every few hours instead of one an hour.
 * Alert fatigue is how monitoring like this dies.
 */
async function filterByCooldown(
  sb: any,
  codes: string[],
): Promise<{ allowed: string[]; suppressed: string[] }> {
  if (codes.length === 0) return { allowed: [], suppressed: [] }

  const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()
  const allowed: string[] = []
  const suppressed: string[] = []

  for (const code of codes) {
    const alertKey = `bot_traffic:${code}`
    const { data } = await sb
      .from('monitoring_alert_state')
      .select('last_stale_alert_at')
      .eq('alert_key', alertKey)
      .maybeSingle()

    const lastSent = (data as { last_stale_alert_at?: string | null } | null)?.last_stale_alert_at
    if (lastSent && lastSent > cutoff) suppressed.push(code)
    else allowed.push(code)
  }

  return { allowed, suppressed }
}

async function recordAlertSent(sb: any, codes: string[], details: Record<string, unknown>) {
  const now = new Date().toISOString()
  for (const code of codes) {
    await sb.from('monitoring_alert_state').upsert(
      {
        alert_key: `bot_traffic:${code}`,
        last_status: 'stale',
        last_checked_at: now,
        last_stale_alert_at: now,
        last_details: details,
        updated_at: now,
      },
      { onConflict: 'alert_key' },
    )
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  const sb = createAdminClient() as any

  let snapshot
  try {
    snapshot = await getBotTrafficSnapshot(sb)
  } catch (error) {
    console.error('[bot_traffic_alert] snapshot failed', error)
    return NextResponse.json({ error: 'Failed to read bot signal events' }, { status: 500 })
  }

  const alerts = evaluateBotTrafficAlerts(snapshot)

  // Retention runs every time so the table cannot grow unbounded the way
  // public.rate_limits has since migration 018.
  let pruned: number | null = null
  if (!dryRun) {
    const { data } = await sb.rpc('prune_bot_signal_events', { p_retain_days: RETAIN_DAYS })
    pruned = typeof data === 'number' ? data : null
  }

  if (alerts.length === 0) {
    return NextResponse.json({
      ok: true,
      dryRun,
      alerted: false,
      pruned,
      snapshot: {
        botRequests1h: snapshot.botRequests1h,
        botRequests24h: snapshot.botRequests24h,
        totalRequests24h: snapshot.totalRequests24h,
        baselineHourlyMedian: snapshot.baselineHourlyMedian,
      },
    })
  }

  const { allowed, suppressed } = await filterByCooldown(sb, alerts.map((alert) => alert.code))
  const firing = alerts.filter((alert) => allowed.includes(alert.code))

  // Every alert is written to automation_alerts regardless of Slack delivery,
  // so the Operations Hub shows the full picture even for suppressed repeats.
  if (!dryRun) {
    for (const alert of alerts) {
      await sb.from('automation_alerts').insert({
        source_table: 'bot_traffic_runs',
        alert_code: alert.code,
        severity: alert.severity,
        message: alert.message,
        details: {
          detail: alert.detail,
          botRequests1h: snapshot.botRequests1h,
          botRequests24h: snapshot.botRequests24h,
          baselineHourlyMedian: snapshot.baselineHourlyMedian,
          slackSuppressed: suppressed.includes(alert.code),
        },
      })
    }
  }

  if (firing.length === 0) {
    return NextResponse.json({
      ok: true,
      dryRun,
      alerted: false,
      pruned,
      suppressed,
      reason: 'all firing alert codes are within their cooldown window',
    })
  }

  const message = buildAlertMessage(firing, snapshot, dashboardUrl(request))

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldAlert: firing.map((alert) => alert.code),
      suppressed,
      message,
    })
  }

  const { delivered, errors } = await deliverBotAlert(message)

  if (delivered > 0) {
    await recordAlertSent(sb, firing.map((alert) => alert.code), {
      botRequests1h: snapshot.botRequests1h,
      baselineHourlyMedian: snapshot.baselineHourlyMedian,
    })
  }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    alerted: delivered > 0,
    delivered,
    errors,
    pruned,
    codes: firing.map((alert) => alert.code),
    suppressed,
  })
}
