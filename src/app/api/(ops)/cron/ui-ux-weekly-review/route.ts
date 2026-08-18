import { type NextRequest, NextResponse } from 'next/server'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { validateCronRequest } from '@/lib/cron-auth'
import { sendEmail } from '@/lib/email'
import { getOwnerEmail } from '@/lib/owner-email'
import { sendSlackMessage } from '@/lib/slack'

const execFileAsync = promisify(execFile)

type AuditRow = {
  route: string
  file: string
  category: string
  score: number
  grade: string
  excellent: boolean
  findings: string
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === ',') {
      out.push(current)
      current = ''
    } else if (ch === '"') {
      inQuotes = true
    } else {
      current += ch
    }
  }

  out.push(current)
  return out
}

function parseAuditCsv(csvText: string): AuditRow[] {
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const index = (name: string) => headers.findIndex((h) => h === name)

  const routeIndex = index('route')
  const fileIndex = index('file')
  const categoryIndex = index('category')
  const scoreIndex = index('score')
  const gradeIndex = index('grade')
  const excellentIndex = index('excellent')
  const findingsIndex = index('findings')

  if ([routeIndex, fileIndex, categoryIndex, scoreIndex, gradeIndex, excellentIndex, findingsIndex].some((i) => i < 0)) {
    return []
  }

  const rows: AuditRow[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i])
    rows.push({
      route: values[routeIndex] ?? '',
      file: values[fileIndex] ?? '',
      category: values[categoryIndex] ?? '',
      score: Number(values[scoreIndex] ?? 0),
      grade: values[gradeIndex] ?? '',
      excellent: (values[excellentIndex] ?? '').toLowerCase() === 'true',
      findings: values[findingsIndex] ?? '',
    })
  }

  return rows
}

function buildHtmlSummary(rows: AuditRow[]): string {
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const total = rows.length
  const excellent = rows.filter((r) => r.score >= 90).length
  const highRisk = rows.filter((r) => r.score < 80).length
  const excellenceRate = total > 0 ? ((excellent / total) * 100).toFixed(1) : '0.0'
  const lowest = [...rows].sort((a, b) => a.score - b.score).slice(0, 12)

  const lowestRows = lowest.length
    ? lowest.map((r) => {
        const safeFindings = r.findings || 'No major static UX risks detected'
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${r.route}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${r.score}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${r.grade}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${safeFindings}</td>
        </tr>`
      }).join('')
    : '<tr><td colspan="4" style="padding:10px;color:#64748b;">No routes found.</td></tr>'

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="680" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 24px;">
      <div style="font-size:18px;font-weight:700;color:#ffffff;">Weekly UI/UX Site Review</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${dateLabel}</div>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <span style="background:#e2e8f0;color:#0f172a;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Routes: ${total}</span>
        <span style="background:#dcfce7;color:#166534;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Excellent (>=90): ${excellent}</span>
        <span style="background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Excellence rate: ${excellenceRate}%</span>
        <span style="background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">High risk (<80): ${highRisk}</span>
      </div>

      <p style="font-size:13px;color:#334155;line-height:1.5;margin:0 0 16px 0;">
        Scanned all App Router pages under src/app/**/page.tsx. Lowest-scoring routes are listed below for triage.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">ROUTE</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">SCORE</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">GRADE</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">PRIMARY FINDINGS</th>
          </tr>
        </thead>
        <tbody>${lowestRows}</tbody>
      </table>

      <p style="margin-top:16px;font-size:11px;color:#64748b;">
        Checklist reference: docs/ui-ux-weekly-review-checklist.md
      </p>
    </td></tr>
  </table>
</body></html>`
}

function buildSlackSummary(rows: AuditRow[]): string {
  const total = rows.length
  const excellent = rows.filter((r) => r.score >= 90).length
  const highRisk = rows.filter((r) => r.score < 80).length
  const excellenceRate = total > 0 ? ((excellent / total) * 100).toFixed(1) : '0.0'
  const lowest = [...rows].sort((a, b) => a.score - b.score).slice(0, 8)

  const lines = [
    '*Starting Monday Weekly UI/UX Review*',
    `- Routes: ${total}`,
    `- Excellent (>=90): ${excellent}`,
    `- Excellence rate: ${excellenceRate}%`,
    `- High risk (<80): ${highRisk}`,
    '',
    '*Lowest-scoring routes*',
    ...lowest.map((r) => `- ${r.route} - ${r.score} (${r.grade}) - ${r.findings || 'No major static UX risks detected'}`),
    '',
    'Checklist: docs/ui-ux-weekly-review-checklist.md',
  ]
  return lines.join('\n')
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const root = process.cwd()
  const csvPath = path.join(root, 'docs', 'ui-ux-page-scores-2026-05-21.csv')
  const to = process.env.UX_WEEKLY_REVIEW_EMAIL_TO ?? getOwnerEmail() ?? 'rothschild@gmail.com'
  const warnings: string[] = []

  try {
    let rows: AuditRow[] = []

    try {
      await execFileAsync('node', ['scripts/ui-ux-council-audit.mjs'], { cwd: root })
      const csv = await readFile(csvPath, 'utf8')
      rows = parseAuditCsv(csv)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'audit script failed'
      warnings.push(`audit: ${message}`)
    }

    if (!rows.length) {
      try {
        const fallbackCsv = await readFile(csvPath, 'utf8')
        rows = parseAuditCsv(fallbackCsv)
        if (rows.length) warnings.push('audit: used cached CSV fallback')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'fallback CSV read failed'
        warnings.push(`audit_fallback: ${message}`)
      }
    }

    if (!rows.length) {
      return NextResponse.json({
        ok: true,
        sent: {
          email: false,
          slack: false,
        },
        skipped: true,
        warnings: [...warnings, 'audit: no rows available'],
      })
    }

    const total = rows.length
    const excellent = rows.filter((r) => r.score >= 90).length
    const highRisk = rows.filter((r) => r.score < 80).length
    const excellenceRate = Number(((excellent / total) * 100).toFixed(1))

    const subject = `Weekly UI/UX review: ${excellent}/${total} excellent (${excellenceRate}%), high risk ${highRisk}`
    const html = buildHtmlSummary(rows)
    const emailResult = await sendEmail({ to, subject, html })

    const slackText = buildSlackSummary(rows)
    const slackResult = await sendSlackMessage({ text: slackText })

    const emailError = (emailResult as { error?: { message?: string } } | null)?.error?.message
    if (emailError) warnings.push(`email: ${emailError}`)
    if (!slackResult.ok) warnings.push(`slack: ${slackResult.error}`)

    return NextResponse.json({
      ok: true,
      sent: {
        email: !emailError,
        slack: slackResult.ok,
      },
      warnings,
      summary: {
        total,
        excellent,
        highRisk,
        excellenceRate,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Weekly review failed'
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'ui_ux_weekly_review_error', message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
