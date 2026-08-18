import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getOwnerEmail } from '@/lib/owner-email'

const OWNER_EMAIL = getOwnerEmail()
const CONSECUTIVE_THRESHOLD = 3
const RE_ALERT_DAYS = 7

function isMissingScanAlertColumnError(message: string): boolean {
  return /scan_alert_sent_at/i.test(message)
}

function isNonProductive(scan: { status: string; raw_hits: unknown }): boolean {
  if (scan.status === 'error') return true
  if (!scan.raw_hits) return true
  if (Array.isArray(scan.raw_hits) && scan.raw_hits.length === 0) return true
  return false
}

type ScanSummary = { date: string; isError: boolean }

type FailingCompany = {
  companyId: string
  name: string
  userId: string
  careerPageUrl: string | null
  scans: ScanSummary[]
}

function diagnose(scans: ScanSummary[]): { label: string; action: string } {
  const errorCount = scans.filter(s => s.isError).length
  if (errorCount === scans.length) return {
    label: 'Scraper crashing',
    action: 'Check that the career page URL still works',
  }
  if (errorCount === 0) return {
    label: 'Page loads, no jobs found',
    action: 'Career page structure may have changed',
  }
  return {
    label: 'Intermittent failures',
    action: 'Check URL and whether the page uses heavy JavaScript',
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mode = request.nextUrl.searchParams.get('mode')
  const health = request.nextUrl.searchParams.get('health')
  const dryRun = request.nextUrl.searchParams.get('dry_run')
  const healthMode = mode === 'health' || health === '1' || dryRun === '1'

  if (healthMode) {
    return NextResponse.json({ checked: 0, alerted: 0, mode: 'health', skipped: true })
  }

  if (!OWNER_EMAIL) {
    return NextResponse.json({
      checked: 0,
      alerted: 0,
      mode: 'live',
      skipped: true,
      reason: 'OWNER_EMAIL or NOTIFY_EMAIL not configured',
    })
  }

  const admin = createAdminClient()

  let hasScanAlertSentAtColumn = true
  let { data: companies, error: compErr } = await admin
    .from('companies')
    .select('id, name, user_id, career_page_url, scan_alert_sent_at')
    .not('career_page_url', 'is', null)
    .is('archived_at', null)

  if (compErr && isMissingScanAlertColumnError(compErr.message)) {
    hasScanAlertSentAtColumn = false
    const fallback = await admin
      .from('companies')
      .select('id, name, user_id, career_page_url')
      .not('career_page_url', 'is', null)
      .is('archived_at', null)
    companies = (fallback.data ?? []).map((company) => ({ ...company, scan_alert_sent_at: null }))
    compErr = fallback.error
  }

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })
  if (!companies?.length) return NextResponse.json({ checked: 0, alerted: 0 })

  const reAlertCutoff = new Date(Date.now() - RE_ALERT_DAYS * 86_400_000).toISOString()

  const failing: FailingCompany[] = []

  for (const company of companies) {
    if (company.scan_alert_sent_at && company.scan_alert_sent_at > reAlertCutoff) continue

    const { data: scans } = await admin
      .from('scan_results')
      .select('status, raw_hits, scanned_at')
      .eq('company_id', company.id)
      .order('scanned_at', { ascending: false })
      .limit(CONSECUTIVE_THRESHOLD)

    if (!scans || scans.length < CONSECUTIVE_THRESHOLD) continue
    if (!scans.every(s => isNonProductive(s))) continue

    failing.push({
      companyId: company.id,
      name: company.name,
      userId: company.user_id,
      careerPageUrl: company.career_page_url,
      scans: scans.map(s => ({
        date: new Date(s.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isError: s.status === 'error',
      })),
    })
  }

  if (!failing.length) {
    return NextResponse.json({
      checked: companies.length,
      alerted: 0,
      mode: healthMode ? 'health' : 'live',
    })
  }

  if (healthMode) {
    return NextResponse.json({
      checked: companies.length,
      alerted: 0,
      mode: 'health',
      wouldAlert: failing.length,
      sample: failing.slice(0, 5).map((f) => ({
        companyId: f.companyId,
        name: f.name,
        scanPattern: f.scans.map((s) => s.isError ? 'error' : 'empty').join(' -> '),
      })),
    })
  }

  const ownerEmail = OWNER_EMAIL as string

  const userIds = [...new Set(failing.map(f => f.userId))]
  const { data: users } = await admin
    .from('users')
    .select('id, email')
    .in('id', userIds)

  const emailByUser: Record<string, string> = {}
  for (const u of users ?? []) emailByUser[u.id] = u.email

  const rows = failing.map(f => {
    const ownerEmail = emailByUser[f.userId] ?? '(unknown)'
    const { label, action } = diagnose(f.scans)
    const scanDots = f.scans.map(s =>
      s.isError
        ? `<span style="color:#dc2626;font-weight:600;">x error</span>`
        : `<span style="color:#94a3b8;">- no jobs</span>`
    ).join('<br>')
    const urlCell = f.careerPageUrl
      ? `<a href="${f.careerPageUrl}" style="color:#3b82f6;font-size:11px;word-break:break-all;">${f.careerPageUrl}</a>`
      : '<span style="color:#94a3b8;font-size:11px;">no URL</span>'

    return `<tr>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
        <div style="font-weight:600;color:#0f172a;margin-bottom:4px;">${f.name}</div>
        <div style="color:#64748b;font-size:11px;margin-bottom:4px;">${ownerEmail}</div>
        ${urlCell}
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:12px;line-height:1.8;">
        ${scanDots}
      </td>
      <td style="padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
        <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:4px;">${label}</div>
        <div style="font-size:11px;color:#64748b;">${action}</div>
      </td>
    </tr>`
  }).join('')

  const n = failing.length
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:660px;margin:40px auto;padding:0 16px;color:#334155;">

<p style="font-size:18px;font-weight:700;color:#dc2626;margin:0 0 6px 0;">
  ${n} ${n === 1 ? 'company' : 'companies'} went dark
</p>
<p style="font-size:14px;color:#64748b;margin:0 0 6px 0;">
  The scanner ran ${CONSECUTIVE_THRESHOLD} times and got nothing useful back each time.
</p>
<p style="font-size:13px;color:#94a3b8;margin:0 0 24px 0;">
  Two things can cause this: the scraper crashes before reading the page (URL broken, JavaScript timeout), or it reads the page but can't find any job listings (page structure changed). The diagnosis column below tells you which.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;font-size:13px;">
  <thead>
    <tr style="background:#f8fafc;">
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;width:45%;">Company</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;width:20%;">Last ${CONSECUTIVE_THRESHOLD} scans</th>
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;width:35%;">Diagnosis</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<p style="font-size:12px;color:#94a3b8;margin-top:24px;">Starting Monday scan monitor - you will not receive another alert for these companies for ${RE_ALERT_DAYS} days.</p>
</body>
</html>`

  const { error: sendError } = await sendEmail({
    to: ownerEmail,
    subject: `[SM Alert] ${n} ${n === 1 ? 'company' : 'companies'} went dark - scan health`,
    html,
    bypassCouncil: true,
  })

  if (sendError) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'scan_alert_email_failed',
      to: ownerEmail,
      message: (sendError as { message?: string }).message ?? 'send failed',
      failingCompanyCount: n,
    }))
    return NextResponse.json({
      checked: companies.length,
      alerted: 0,
      mode: 'live',
      skipped: true,
      reason: 'scan alert email failed',
      email_error: (sendError as { message?: string }).message ?? 'send failed',
    })
  }

  const now = new Date().toISOString()
  if (hasScanAlertSentAtColumn) {
    for (const f of failing) {
      await admin.from('companies').update({ scan_alert_sent_at: now }).eq('id', f.companyId)
    }
  }

  return NextResponse.json({
    checked: companies.length,
    alerted: n,
    mode: 'live',
    schema_fallback: !hasScanAlertSentAtColumn,
  })
}
