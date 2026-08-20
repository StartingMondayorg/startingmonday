/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function routeIssue(issue: string): { slug: string; reason: string } {
  const text = issue.toLowerCase()
  if (/(billing|invoice|payment|plan)/.test(text)) {
    return { slug: 'billing-and-subscriptions', reason: 'Billing intent detected.' }
  }
  if (/(brief|company signal|intel|insight)/.test(text)) {
    return { slug: 'briefing-and-intelligence', reason: 'Briefing/intelligence intent detected.' }
  }
  if (/(coach|team|invite|seat|permission)/.test(text)) {
    return { slug: 'team-and-coach-access', reason: 'Team/access intent detected.' }
  }
  return { slug: 'getting-started', reason: 'Default onboarding/getting-started route.' }
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
    const issueText = (body?.issueText ?? '').toString().trim()

    if (!issueText) return NextResponse.json({ error: 'issueText is required' }, { status: 400 })

    const route = routeIssue(issueText)
    await sb.from('help_center_routing_logs').insert({
      user_id: userId,
      issue_text: issueText,
      routed_article_slug: route.slug,
      route_reason: route.reason,
    })

    return NextResponse.json({ ok: true, articleSlug: route.slug, reason: route.reason })
  } catch (error) {
    console.error('[customer-ops.help-center-routing] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
