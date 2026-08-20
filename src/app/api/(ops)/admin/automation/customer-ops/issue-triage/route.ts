/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function triage(issue: string): { severity: 'low' | 'medium' | 'high'; category: string; routeTo: string } {
  const text = issue.toLowerCase()
  if (/(payment|billing|charge|invoice|refund)/.test(text)) {
    return { severity: 'high', category: 'billing', routeTo: 'billing_queue' }
  }
  if (/(error|crash|bug|broken|500|failed)/.test(text)) {
    return { severity: 'high', category: 'product_bug', routeTo: 'engineering_queue' }
  }
  if (/(login|password|auth|access)/.test(text)) {
    return { severity: 'medium', category: 'account_access', routeTo: 'support_queue' }
  }
  return { severity: 'low', category: 'general', routeTo: 'support_queue' }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))

    const rawIssues = Array.isArray(body?.issues) ? body.issues : []
    const issues = rawIssues
      .map((v: unknown) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
      .slice(0, 100)

    if (issues.length === 0) {
      return NextResponse.json({ error: 'issues[] is required' }, { status: 400 })
    }

    const rows = issues.map((issueText: string) => {
      const t = triage(issueText)
      return {
        user_id: userId,
        issue_text: issueText,
        severity: t.severity,
        category: t.category,
        route_to: t.routeTo,
        status: 'open',
      }
    })

    const { data: inserted } = await sb.from('support_issue_triage').insert(rows).select('id, severity, category, route_to')

    return NextResponse.json({ ok: true, triaged: inserted?.length ?? 0, items: inserted ?? [] })
  } catch (error) {
    console.error('[customer-ops.issue-triage] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
