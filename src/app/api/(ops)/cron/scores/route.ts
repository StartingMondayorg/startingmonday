import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { getOwnerEmail } from '@/lib/owner-email'
import { ACTION_SCORES, compositeScore, GROUP_LABELS, type ScoreGroup } from '@/lib/action-scores'

const OWNER_EMAIL = getOwnerEmail()

const GROUP_ORDER: ScoreGroup[] = [
  'onboarding', 'pipeline', 'intelligence', 'signals', 'communication', 'profile',
]

function scoreBar(value: number, max = 10): string {
  const filled = Math.round((value / max) * 8)
  return '&#9632;'.repeat(filled) + '&#9633;'.repeat(8 - filled)
}

function buildEmail(
  weekLabel: string,
  top3: { label: string; composite: number; count7d: number; group: string }[],
  bottom3: { label: string; composite: number; count7d: number; group: string }[],
  groupTotals: { group: ScoreGroup; count7d: number; count30d: number }[],
  totalEvents7d: number,
): string {
  const dashboardUrl = `${APP_URL}/dashboard/admin/metrics`

  const rowStyle = 'padding:6px 0;border-bottom:1px solid #f1f5f9;'
  const labelStyle = 'font-size:13px;color:#334155;'
  const numStyle = 'font-size:13px;font-weight:700;color:#0f172a;text-align:right;padding-left:16px;'
  const subStyle = 'font-size:11px;color:#94a3b8;'

  function actionRows(items: typeof top3, accentColor: string) {
    return items.map(r => `
      <tr>
        <td style="${rowStyle}">
          <span style="${labelStyle}">${r.label}</span><br>
          <span style="${subStyle}">${GROUP_LABELS[r.group as ScoreGroup]} &middot; ${r.count7d} events this week</span>
        </td>
        <td style="${rowStyle}${numStyle}" width="60">
          <span style="color:${accentColor}">${r.composite}</span>
        </td>
      </tr>`).join('')
  }

  function groupRows() {
    return groupTotals.map(r => `
      <tr>
        <td style="${rowStyle}">
          <span style="${labelStyle}">${GROUP_LABELS[r.group]}</span>
        </td>
        <td style="${rowStyle}${numStyle}" width="60">${r.count7d}</td>
        <td style="${rowStyle}font-size:11px;color:#94a3b8;text-align:right;padding-left:8px;" width="60">${r.count30d} / 30d</td>
      </tr>`).join('')
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<tr><td style="background:#0f172a;padding:28px 40px;">
  <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;">Starting Monday &middot; Internal</div>
  <div style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2;">Action Scores - ${weekLabel}</div>
  <div style="color:#475569;font-size:13px;margin-top:6px;">${totalEvents7d} events tracked this week</div>
</td></tr>

<tr><td style="padding:28px 40px 8px 40px;">
  <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#16a34a;">Highest composite</p>
  <p style="margin:0 0 14px 0;font-size:11px;color:#94a3b8;">emotion + retention &minus; cognitive load</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${actionRows(top3, '#16a34a')}
  </table>
</td></tr>

<tr><td style="padding:20px 40px 8px 40px;">
  <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#dc2626;">Lowest composite - review for friction</p>
  <p style="margin:0 0 14px 0;font-size:11px;color:#94a3b8;">these interactions have the least net impact</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${actionRows(bottom3, '#dc2626')}
  </table>
</td></tr>

<tr><td style="padding:20px 40px 8px 40px;">
  <p style="margin:0 0 14px 0;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#334155;">Event volume by group</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${groupRows()}
  </table>
</td></tr>

<tr><td style="padding:24px 40px 32px 40px;">
  <table cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#0f172a;border-radius:4px;">
      <a href="${dashboardUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;">View full dashboard &rarr;</a>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:16px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:11px;color:#94a3b8;">Weekly action scores digest. Sent every Monday morning.</p>
</td></tr>

</table></td></tr></table>
</body></html>`
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!OWNER_EMAIL) {
    return NextResponse.json({ error: 'OWNER_EMAIL or NOTIFY_EMAIL not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const since7d  = new Date(now - 7  * 86_400_000).toISOString()
  const since30d = new Date(now - 30 * 86_400_000).toISOString()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTodayIso = startOfToday.toISOString()
  const startOfTomorrowIso = new Date(startOfToday.getTime() + 86_400_000).toISOString()

  const [{ data: rows7d }, { data: rows30d }] = await Promise.all([
    admin.from('user_events').select('event_name, created_at').gte('created_at', since7d).limit(20000),
    admin.from('user_events').select('event_name').gte('created_at', since30d).limit(50000),
  ])

  const counts7d:  Record<string, number> = {}
  const counts30d: Record<string, number> = {}
  for (const e of rows7d  ?? []) counts7d[e.event_name]  = (counts7d[e.event_name]  ?? 0) + 1
  for (const e of rows30d ?? []) counts30d[e.event_name] = (counts30d[e.event_name] ?? 0) + 1

  const allScored = Object.entries(ACTION_SCORES).map(([name, score]) => ({
    event_name: name,
    label:      score.label,
    group:      score.group,
    composite:  compositeScore(score),
    count7d:    counts7d[name]  ?? 0,
    count30d:   counts30d[name] ?? 0,
  }))

  const byComposite = [...allScored].sort((a, b) => b.composite - a.composite)
  const top3    = byComposite.slice(0, 3)
  const bottom3 = byComposite.slice(-3).reverse()

  const groupTotals = GROUP_ORDER.map(group => ({
    group,
    count7d:  allScored.filter(e => e.group === group).reduce((s, e) => s + e.count7d,  0),
    count30d: allScored.filter(e => e.group === group).reduce((s, e) => s + e.count30d, 0),
  }))

  const totalEvents7d = (rows7d ?? []).length

  const trendByDay: Record<string, { paused: number; resumed: number }> = {}
  for (const e of rows7d ?? []) {
    const dayKey = e.created_at?.slice(0, 10)
    if (!dayKey) continue
    if (!trendByDay[dayKey]) trendByDay[dayKey] = { paused: 0, resumed: 0 }
    if (e.event_name === 'search_paused') trendByDay[dayKey].paused += 1
    if (e.event_name === 'search_resumed') trendByDay[dayKey].resumed += 1
  }

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const dailyTrend = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - idx))
    const dayKey = d.toISOString().slice(0, 10)
    const row = trendByDay[dayKey] ?? { paused: 0, resumed: 0 }
    return { dayKey, paused: row.paused, resumed: row.resumed, net: row.paused - row.resumed }
  })

  function telemetryLevel(window: { net: number }[]): 'normal' | 'watch' | 'risk' {
    const netSum = window.reduce((sum, row) => sum + row.net, 0)
    const positiveDays = window.filter((row) => row.net > 0).length
    if (netSum >= 6 || positiveDays === 3) return 'risk'
    if (netSum >= 3 || positiveDays >= 2) return 'watch'
    return 'normal'
  }

  const previous3d = dailyTrend.slice(1, 4)
  const recent3d = dailyTrend.slice(-3)
  const previousLevel = telemetryLevel(previous3d)
  const currentLevel = telemetryLevel(recent3d)
  const flippedToRisk = currentLevel === 'risk' && previousLevel !== 'risk'

  const weekLabel = new Date(now).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const html = buildEmail(weekLabel, top3, bottom3, groupTotals, totalEvents7d)

  const { error } = await sendEmail({
    to: OWNER_EMAIL,
    subject: `Action scores week of ${weekLabel}`,
    html,
  })

  if (error) {
    return NextResponse.json({ error: (error as { message?: string }).message ?? 'send failed' }, { status: 500 })
  }

  let pauseRiskAlertSent = false
  if (flippedToRisk) {
    const { count: alertsToday } = await admin
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'admin_pause_risk_alerted')
      .gte('created_at', startOfTodayIso)
      .lt('created_at', startOfTomorrowIso)

    if ((alertsToday ?? 0) === 0) {
      const ownerUser = await admin
        .from('users')
        .select('id')
        .eq('email', OWNER_EMAIL)
        .maybeSingle()

      if (ownerUser.data?.id) {
        await admin.from('user_events').insert({
          user_id: ownerUser.data.id,
          event_name: 'admin_pause_risk_alerted',
          properties: {
            previous_level: previousLevel,
            current_level: currentLevel,
            net_paused_last_3d: recent3d.reduce((sum, row) => sum + row.net, 0),
          },
        })
      }

      await sendEmail({
        to: OWNER_EMAIL,
        subject: `Pause/Resume at risk: ${weekLabel}`,
        html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
          <h2 style="margin:0 0 12px 0;">Pause/Resume risk alert</h2>
          <p style="margin:0 0 10px 0;">Search control telemetry flipped to <strong>At risk</strong> over the latest 3-day window.</p>
          <p style="margin:0 0 10px 0;">Previous window: <strong>${previousLevel}</strong> &middot; Current window: <strong>${currentLevel}</strong></p>
          <table style="border-collapse:collapse;font-size:13px;">
            <tr><th align="left" style="padding:4px 12px 4px 0;color:#64748b;">Day</th><th align="right" style="padding:4px 12px;">Paused</th><th align="right" style="padding:4px 12px;">Resumed</th><th align="right" style="padding:4px 0;">Net</th></tr>
            ${dailyTrend.map((r) => `<tr><td style="padding:4px 12px 4px 0;">${r.dayKey}</td><td align="right" style="padding:4px 12px;">${r.paused}</td><td align="right" style="padding:4px 12px;">${r.resumed}</td><td align="right" style="padding:4px 0;">${r.net > 0 ? `+${r.net}` : r.net}</td></tr>`).join('')}
          </table>
          <p style="margin:14px 0 0 0;"><a href="${APP_URL}/dashboard/admin" style="color:#0f172a;">Open admin dashboard</a></p>
        </body></html>`,
      })
      pauseRiskAlertSent = true
    }
  }

  return NextResponse.json({
    ok: true,
    week: weekLabel,
    total_events_7d: totalEvents7d,
    pause_risk: {
      previous_level: previousLevel,
      current_level: currentLevel,
      flipped_to_risk: flippedToRisk,
      alert_sent: pauseRiskAlertSent,
    },
  })
}
