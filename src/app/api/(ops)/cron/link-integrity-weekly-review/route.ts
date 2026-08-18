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

type LinkReport = {
  generatedAt: string
  fixMode: boolean
  summary: {
    filesScanned: number
    totalLinks: number
    internalLinks: number
    externalLinks: number
    brokenInternal: number
    brokenExternal: number
    restrictedExternal: number
    autoFixes: number
  }
  autoFixes: Array<{ file: string; line: number; before: string; after: string }>
  brokenInternal: Array<{ file: string; line: number; url: string; suggestedFix?: string | null }>
  brokenExternal: Array<{ url: string; status: number; method: string; refs: Array<{ file: string; line: number }> }>
  restrictedExternal: Array<{ url: string; status: number; method: string; refs: Array<{ file: string; line: number }> }>
}

function buildHtmlSummary(report: LinkReport): string {
  const s = report.summary
  const fixes = report.autoFixes.slice(0, 12)
  const brokenInternal = report.brokenInternal.slice(0, 12)
  const brokenExternal = report.brokenExternal.slice(0, 12)

  const fixRows = fixes.length
    ? fixes.map((f) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${f.file}:${f.line}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${f.before}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${f.after}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="padding:10px;color:#64748b;">No automatic fixes were applied.</td></tr>'

  const internalRows = brokenInternal.length
    ? brokenInternal.map((i) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${i.file}:${i.line}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${i.url}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${i.suggestedFix ?? ''}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="padding:10px;color:#64748b;">No broken internal links.</td></tr>'

  const externalRows = brokenExternal.length
    ? brokenExternal.map((e) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${e.url}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${e.status}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${e.method}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="padding:10px;color:#64748b;">No broken external links.</td></tr>'

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="760" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 24px;">
      <div style="font-size:18px;font-weight:700;color:#ffffff;">Weekly Link Integrity Review</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${new Date(report.generatedAt).toUTCString()}</div>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <span style="background:#e2e8f0;color:#0f172a;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Links: ${s.totalLinks}</span>
        <span style="background:#dcfce7;color:#166534;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Auto-fixed: ${s.autoFixes}</span>
        <span style="background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Broken internal: ${s.brokenInternal}</span>
        <span style="background:#fee2e2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Broken external: ${s.brokenExternal}</span>
        <span style="background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">Restricted external: ${s.restrictedExternal}</span>
      </div>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Automatic fixes applied</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:14px;">
        <thead><tr style="background:#f8fafc;"><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">FILE</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">BEFORE</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">AFTER</th></tr></thead>
        <tbody>${fixRows}</tbody>
      </table>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Broken internal links</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:14px;">
        <thead><tr style="background:#f8fafc;"><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">FILE</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">URL</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">SUGGESTED</th></tr></thead>
        <tbody>${internalRows}</tbody>
      </table>

      <h3 style="font-size:14px;color:#0f172a;margin:0 0 8px 0;">Broken external links</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <thead><tr style="background:#f8fafc;"><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">URL</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">STATUS</th><th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;">METHOD</th></tr></thead>
        <tbody>${externalRows}</tbody>
      </table>

      <p style="margin-top:14px;font-size:11px;color:#64748b;">Full reports: docs/link-integrity-weekly-report.md and docs/link-integrity-weekly-report.json</p>
    </td></tr>
  </table>
</body></html>`
}

function buildSlackSummary(report: LinkReport): string {
  const s = report.summary
  const topFixes = report.autoFixes.slice(0, 5)
  const topBrokenInternal = report.brokenInternal.slice(0, 5)
  const topBrokenExternal = report.brokenExternal.slice(0, 5)

  return [
    '*Starting Monday Weekly Link Integrity Review*',
    `- Links scanned: ${s.totalLinks}`,
    `- Auto-fixed internal links: ${s.autoFixes}`,
    `- Broken internal links: ${s.brokenInternal}`,
    `- Broken external links: ${s.brokenExternal}`,
    `- Restricted external links (401/403): ${s.restrictedExternal}`,
    '',
    '*Auto-fixes*',
    ...(topFixes.length ? topFixes.map((f) => `- ${f.file}:${f.line} :: ${f.before} -> ${f.after}`) : ['- none']),
    '',
    '*Broken internal*',
    ...(topBrokenInternal.length ? topBrokenInternal.map((i) => `- ${i.file}:${i.line} :: ${i.url}`) : ['- none']),
    '',
    '*Broken external*',
    ...(topBrokenExternal.length ? topBrokenExternal.map((e) => `- ${e.url} (${e.status})`) : ['- none']),
    '',
    'Reports: docs/link-integrity-weekly-report.md',
  ].join('\n')
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const root = process.cwd()
  const jsonPath = path.join(root, 'docs', 'link-integrity-weekly-report.json')
  const mdPath = path.join(root, 'docs', 'link-integrity-weekly-report.md')
  const to = process.env.LINK_REVIEW_EMAIL_TO ?? getOwnerEmail() ?? 'rothschild@gmail.com'

  try {
    let auditWarning: string | null = null
    try {
      await execFileAsync('node', [
        'scripts/link-integrity-audit.mjs',
        '--fix',
        '--json',
        'docs/link-integrity-weekly-report.json',
        '--md',
        'docs/link-integrity-weekly-report.md',
      ], { cwd: root })
    } catch (error) {
      // The audit script exits non-zero when broken links are found.
      // That signal is expected and should not fail the weekly review route.
      auditWarning = error instanceof Error ? error.message : 'Link audit exited non-zero'
    }

    const reportText = await readFile(jsonPath, 'utf8')
    const report = JSON.parse(reportText) as LinkReport
    const html = buildHtmlSummary(report)
    const s = report.summary
    const subject = `Weekly link review: ${s.brokenInternal} internal, ${s.brokenExternal} external, auto-fixed ${s.autoFixes}`

    const emailResult = await sendEmail({ to, subject, html })
    const emailError = (emailResult as { error?: { message?: string } } | null)?.error?.message
    const slackResult = await sendSlackMessage({ text: buildSlackSummary(report) })
    const warnings: string[] = []

    if (auditWarning) warnings.push(`audit: ${auditWarning}`)
    if (emailError) warnings.push(`email: ${emailError}`)
    if (!slackResult.ok) warnings.push(`slack: ${slackResult.error}`)

    return NextResponse.json({
      ok: true,
      sent: { email: !emailError, slack: slackResult.ok },
      warnings,
      reportFiles: {
        json: path.relative(root, jsonPath),
        markdown: path.relative(root, mdPath),
      },
      summary: report.summary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Link integrity weekly review failed'
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'link_integrity_weekly_review_error', message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
