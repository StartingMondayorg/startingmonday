import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getOwnerEmail } from '@/lib/owner-email'
import { sendSlackMessage } from '@/lib/slack'
import {
  DEFAULT_HUMAN_TONE_PASS_THRESHOLD,
  evaluateHumanTone,
  humanToneSkeleton,
} from '@/lib/outreach/human-tone-guard'
import { depitchBody, depitchSubject, firstNameFromRecipient } from '@/lib/outreach/auto-remediate'

type OutreachQueuedRow = {
  id: string | number
  recipient_name: string | null
  recipient_email: string | null
  sender_email: string | null
  subject: string | null
  message_body: string | null
  delivery_status: string | null
  outreach_channel: string | null
  sent_at?: string | null
}

type ScoredRow = {
  id: string | number
  recipientName: string
  recipientEmail: string
  senderEmail: string
  status: string
  channel: string
  subject: string
  score: number
  passed: boolean
  reasons: string[]
}

type RemediationDelta = {
  id: string | number
  channel: string
  recipientEmail: string
  beforeScore: number
  afterScore: number
  delta: number
  changedSubject: boolean
  changedBody: boolean
}

type ChannelSummary = {
  channel: string
  total: number
  passed: number
  failed: number
  averageScore: number
  minScore: number
  passRate: number
}

const PASS_THRESHOLD = Number(process.env.OUTREACH_TONE_GUARD_PASS_THRESHOLD ?? DEFAULT_HUMAN_TONE_PASS_THRESHOLD)
const AUTO_REMEDIATE_DEFAULT = String(process.env.OUTREACH_TONE_GUARD_AUTO_REMEDIATE ?? '').toLowerCase() === 'true'

function isQueuedUnsentStatus(status: string | null): boolean {
  const normalized = (status ?? '').toLowerCase().trim()
  if (!normalized) return true
  return ['pending', 'queued', 'draft', 'scheduled'].includes(normalized)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtmlSummary(
  mode: 'weekly' | 'presend',
  summary: {
    queuedRowsScanned: number
    scoredRows: number
    passed: number
    failed: number
    averageScore: number
    passRate: number
  },
  beforeSummary: {
    passed: number
    failed: number
    averageScore: number
    passRate: number
  },
  byChannel: ChannelSummary[],
  failures: ScoredRow[],
  deltas: RemediationDelta[],
  remediationApplied: boolean,
  dryRun: boolean,
): string {
  const rows = failures.slice(0, 25)
  const tableRows = rows.length
    ? rows.map((f) => {
      const reasons = f.reasons.length ? f.reasons.join('; ') : '-'
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escapeHtml(String(f.id))}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(f.channel)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(f.recipientName || f.recipientEmail)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(f.status)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#991b1b;font-weight:600;">${f.score}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(f.subject)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(reasons)}</td>
      </tr>`
    }).join('')
    : '<tr><td colspan="7" style="padding:10px;color:#64748b;">No below-threshold rows.</td></tr>'

  const channelRows = byChannel.length
    ? byChannel.map((c) => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escapeHtml(c.channel)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${c.total}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#166534;">${c.passed}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#991b1b;">${c.failed}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${c.averageScore}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${c.passRate}%</td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="padding:10px;color:#64748b;">No queued rows found.</td></tr>'

  const deltaRows = deltas.slice(0, 20)
  const deltaTableRows = deltaRows.length
    ? deltaRows.map((d) => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escapeHtml(String(d.id))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(d.channel)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${escapeHtml(d.recipientEmail || '-')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${d.beforeScore}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#166534;">${d.afterScore}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#166534;">+${d.delta}</td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="padding:10px;color:#64748b;">No remediation deltas recorded.</td></tr>'

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="760" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 24px;">
      <div style="font-size:18px;font-weight:700;color:#ffffff;">${mode === 'weekly' ? 'Weekly Outreach Human Tone Guard' : 'Pre-send Outreach Human Tone Guard'}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${new Date().toUTCString()}</div>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <span style="background:#e2e8f0;color:#0f172a;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Queued rows scanned: ${summary.queuedRowsScanned}</span>
        <span style="background:#e2e8f0;color:#0f172a;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Scored rows: ${summary.scoredRows}</span>
        <span style="background:#dcfce7;color:#166534;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Passed (>=${PASS_THRESHOLD}): ${summary.passed}</span>
        <span style="background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Failed: ${summary.failed}</span>
        <span style="background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Avg score: ${summary.averageScore}</span>
        <span style="background:#f8fafc;color:#334155;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Pass rate: ${summary.passRate}%</span>
      </div>

      <p style="font-size:13px;color:#334155;line-height:1.5;margin:0 0 14px 0;">
        Human Tone Guard rubric scores each queued email from 0 to 100. Threshold is <strong>${PASS_THRESHOLD}</strong>. Rows below threshold are listed for rewrite.
      </p>

      <p style="font-size:12px;color:#475569;line-height:1.5;margin:0 0 14px 0;">
        Remediation: <strong>${remediationApplied ? (dryRun ? 'DRY RUN' : 'APPLIED') : 'disabled'}</strong> |
        Before: ${beforeSummary.passed} passed / ${beforeSummary.failed} failed (avg ${beforeSummary.averageScore}, pass ${beforeSummary.passRate}%) |
        After: ${summary.passed} passed / ${summary.failed} failed (avg ${summary.averageScore}, pass ${summary.passRate}%).
      </p>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Auto-remediation deltas</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:14px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">ID</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">CHANNEL</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">RECIPIENT</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">BEFORE</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">AFTER</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">DELTA</th>
        </tr></thead>
        <tbody>${deltaTableRows}</tbody>
      </table>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Per-channel summary</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:14px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">CHANNEL</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">TOTAL</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">PASSED</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">FAILED</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">AVG</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">PASS RATE</th>
        </tr></thead>
        <tbody>${channelRows}</tbody>
      </table>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Below-threshold queued rows</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">ID</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">CHANNEL</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">RECIPIENT</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">STATUS</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">SCORE</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">SUBJECT</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">LOW-SCORING METRICS</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>

      <p style="margin-top:14px;font-size:11px;color:#64748b;">Action for fails: node scripts/depitch-queued-outreach.mjs --apply</p>
    </td></tr>
  </table>
</body></html>`
}

function buildSlackSummary(
  mode: 'weekly' | 'presend',
  summary: {
    queuedRowsScanned: number
    scoredRows: number
    passed: number
    failed: number
    averageScore: number
    passRate: number
  },
  beforeSummary: {
    passed: number
    failed: number
    averageScore: number
    passRate: number
  },
  byChannel: ChannelSummary[],
  failures: ScoredRow[],
  deltas: RemediationDelta[],
  remediationApplied: boolean,
  dryRun: boolean,
): string {
  const top = failures.slice(0, 8)
  return [
    `*Starting Monday ${mode === 'weekly' ? 'Weekly' : 'Pre-send'} Outreach Human Tone Guard*`,
    `- Queued rows scanned: ${summary.queuedRowsScanned}`,
    `- Scored rows: ${summary.scoredRows}`,
    `- Remediation: ${remediationApplied ? (dryRun ? 'dry-run' : 'applied') : 'disabled'}`,
    `- Before: ${beforeSummary.passed}/${beforeSummary.passed + beforeSummary.failed} passed, avg ${beforeSummary.averageScore}`,
    `- Passed (>=${PASS_THRESHOLD}): ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Avg score: ${summary.averageScore}`,
    `- Pass rate: ${summary.passRate}%`,
    `- Remediated rows: ${deltas.length}`,
    '',
    '*By channel*',
    ...(byChannel.length
      ? byChannel.map((c) => `- ${c.channel}: ${c.passed}/${c.total} passed, avg ${c.averageScore}`)
      : ['- none']),
    '',
    '*Top fails*',
    ...(top.length
      ? top.map((f) => {
          const reasons = f.reasons.slice(0, 2).join(' | ')
          return `- id ${f.id} [${f.channel}] score ${f.score}: ${reasons || 'metric quality issues'}`
        })
      : ['- none']),
    '',
    'Action for fails: node scripts/depitch-queued-outreach.mjs --apply',
  ].join('\n')
}

function scoreRows(rows: OutreachQueuedRow[]) {
  const skeletonCount = new Map<string, number>()
  for (const row of rows) {
    const skeleton = humanToneSkeleton({
      subject: row.subject ?? '',
      body: row.message_body ?? '',
      recipientName: row.recipient_name ?? undefined,
    })
    skeletonCount.set(skeleton, (skeletonCount.get(skeleton) ?? 0) + 1)
  }

  const scoredRows: ScoredRow[] = rows.map((row) => {
    const skeleton = humanToneSkeleton({
      subject: row.subject ?? '',
      body: row.message_body ?? '',
      recipientName: row.recipient_name ?? undefined,
    })
    const result = evaluateHumanTone(
      {
        subject: row.subject ?? '',
        body: row.message_body ?? '',
        recipientName: row.recipient_name ?? undefined,
      },
      {
        threshold: PASS_THRESHOLD,
        duplicateCount: skeletonCount.get(skeleton) ?? 1,
      },
    )

    return {
      id: row.id,
      recipientName: row.recipient_name ?? '',
      recipientEmail: row.recipient_email ?? '',
      senderEmail: row.sender_email ?? '',
      status: row.delivery_status ?? 'pending',
      channel: row.outreach_channel ?? 'unknown',
      subject: row.subject ?? '',
      score: result.score,
      passed: result.passed,
      reasons: result.reasons,
    }
  })

  const failures = scoredRows.filter((row) => !row.passed).sort((a, b) => a.score - b.score)

  const grouped = new Map<string, ScoredRow[]>()
  for (const row of scoredRows) {
    const list = grouped.get(row.channel) ?? []
    list.push(row)
    grouped.set(row.channel, list)
  }

  const byChannel: ChannelSummary[] = Array.from(grouped.entries())
    .map(([channel, entries]) => {
      const passed = entries.filter((r) => r.passed).length
      const failed = entries.length - passed
      const averageScore = Number((entries.reduce((sum, r) => sum + r.score, 0) / entries.length).toFixed(1))
      const minScore = entries.reduce((min, r) => Math.min(min, r.score), 100)
      const passRate = Number(((passed / entries.length) * 100).toFixed(1))
      return { channel, total: entries.length, passed, failed, averageScore, minScore, passRate }
    })
    .sort((a, b) => a.averageScore - b.averageScore)

  const passed = scoredRows.length - failures.length
  const summary = {
    queuedRowsScanned: rows.length,
    scoredRows: scoredRows.length,
    passed,
    failed: failures.length,
    averageScore: Number((scoredRows.reduce((sum, row) => sum + row.score, 0) / scoredRows.length).toFixed(1)),
    passRate: Number(((passed / scoredRows.length) * 100).toFixed(1)),
  }

  return { scoredRows, failures, byChannel, summary }
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const to = process.env.OUTREACH_TONE_GUARD_EMAIL_TO ?? getOwnerEmail() ?? 'rothschild@gmail.com'
  const mode = request.nextUrl.searchParams.get('mode') === 'presend' ? 'presend' : 'weekly'
  const remediationRequested = request.nextUrl.searchParams.get('remediate') === '1' || AUTO_REMEDIATE_DEFAULT
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1'

  const { data, error } = await admin
    .from('outreach_logs')
    .select('id, recipient_name, recipient_email, sender_email, subject, message_body, delivery_status, outreach_channel, sent_at')
    .is('sent_at', null)
    .order('id', { ascending: false })
    .limit(2000)

  if (error) {
    const message = error.message || 'Failed to query outreach logs'
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'outreach_tone_guard_query_error', message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const unsentRows = ((data ?? []) as unknown as OutreachQueuedRow[])
    .filter((row) => !row.sent_at)
    .filter((row) => isQueuedUnsentStatus(row.delivery_status))

  if (!unsentRows.length) {
    return NextResponse.json({
      ok: true,
      sent: false,
      queuedRowsScanned: 0,
      scoredRows: 0,
      reason: 'No queued outreach rows found',
    })
  }

  const workingRows = unsentRows.map((row) => ({ ...row }))
  const initial = scoreRows(workingRows)
  const beforeSummary = {
    passed: initial.summary.passed,
    failed: initial.summary.failed,
    averageScore: initial.summary.averageScore,
    passRate: initial.summary.passRate,
  }

  const deltas: RemediationDelta[] = []
  if (remediationRequested && initial.failures.length > 0) {
    const beforeById = new Map(initial.scoredRows.map((row) => [String(row.id), row]))
    const changedRows: Array<{ id: string | number; subject: string; message_body: string }> = []

    for (const row of workingRows) {
      const before = beforeById.get(String(row.id))
      if (!before || before.passed) continue

      const firstName = firstNameFromRecipient(row.recipient_name)
      const nextSubject = depitchSubject(row.subject, firstName)
      const nextBody = depitchBody(row.message_body, firstName)
      const changedSubject = nextSubject !== (row.subject ?? '')
      const changedBody = nextBody !== (row.message_body ?? '')

      if (!changedSubject && !changedBody) continue

      row.subject = nextSubject
      row.message_body = nextBody
      changedRows.push({ id: row.id, subject: nextSubject, message_body: nextBody })
      deltas.push({
        id: row.id,
        channel: row.outreach_channel ?? 'unknown',
        recipientEmail: row.recipient_email ?? '',
        beforeScore: before.score,
        afterScore: before.score,
        delta: 0,
        changedSubject,
        changedBody,
      })
    }

    if (!dryRun) {
      for (const row of changedRows) {
        const { error: updateError } = await admin
          .from('outreach_logs')
          .update({ subject: row.subject, message_body: row.message_body })
          .eq('id', String(row.id))

        if (updateError) {
          return NextResponse.json({ error: `Failed to update row ${row.id}: ${updateError.message}` }, { status: 500 })
        }
      }
    }
  }

  const final = scoreRows(workingRows)
  const finalById = new Map(final.scoredRows.map((row) => [String(row.id), row]))
  for (const delta of deltas) {
    const after = finalById.get(String(delta.id))
    if (!after) continue
    delta.afterScore = after.score
    delta.delta = after.score - delta.beforeScore
  }

  const subject = `${mode === 'weekly' ? 'Weekly' : 'Pre-send'} outreach tone guard: ${final.summary.passed}/${final.summary.scoredRows} passed (>=${PASS_THRESHOLD}), fails ${final.summary.failed}`
  const html = buildHtmlSummary(mode, final.summary, beforeSummary, final.byChannel, final.failures, deltas, remediationRequested, dryRun)
  const emailResult = await sendEmail({ to, subject, html })
  const emailError = (emailResult as { error?: { message?: string } } | null)?.error?.message
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 502 })
  }

  const slackResult = await sendSlackMessage({ text: buildSlackSummary(mode, final.summary, beforeSummary, final.byChannel, final.failures, deltas, remediationRequested, dryRun) })

  return NextResponse.json({
    ok: true,
    sent: {
      email: true,
      slack: slackResult.ok,
    },
    slackError: slackResult.ok ? null : slackResult.error,
    mode,
    remediation: {
      requested: remediationRequested,
      dryRun,
      appliedRows: deltas.length,
      scoreLift: deltas.reduce((sum, row) => sum + row.delta, 0),
    },
    threshold: PASS_THRESHOLD,
    beforeSummary,
    summary: final.summary,
    byChannel: final.byChannel,
    deltas: deltas.slice(0, 25),
    fails: final.failures.slice(0, 25).map((f) => ({
      id: f.id,
      channel: f.channel,
      score: f.score,
      recipientEmail: f.recipientEmail,
      reasons: f.reasons,
    })),
  })
}
