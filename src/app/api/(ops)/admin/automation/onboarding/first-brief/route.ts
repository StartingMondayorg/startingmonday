/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function buildBrief(contextPayload: Record<string, any>): string {
  const profile = contextPayload.profile ?? {}
  const companies = Array.isArray(contextPayload.top_companies) ? contextPayload.top_companies : []
  const contacts = Array.isArray(contextPayload.top_contacts) ? contextPayload.top_contacts : []

  const targetTitle = Array.isArray(profile.target_titles) && profile.target_titles.length > 0
    ? profile.target_titles[0]
    : profile.current_title ?? 'next leadership role'

  const topCompany = companies[0]?.name ?? 'priority targets'
  const topContact = contacts[0]?.name ?? 'your strongest connection'

  return [
    `Focus this week on momentum toward ${targetTitle}.`,
    `Start with ${topCompany} and map one concrete outreach move through ${topContact}.`,
    `Primary objective: complete one high-quality outreach sequence and lock one next-step follow-up within 72 hours.`,
  ].join(' ')
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const { data: latestSnapshot } = await sb
    .from('onboarding_context_snapshots')
    .select('id, context_payload')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestSnapshot?.id) {
    return NextResponse.json({ error: 'No context snapshot found. Run Ticket 16 first.' }, { status: 400 })
  }

  const briefText = buildBrief((latestSnapshot.context_payload ?? {}) as Record<string, any>)

  const { data: run, error } = await sb
    .from('onboarding_brief_runs')
    .insert({
      user_id: userId,
      context_snapshot_id: latestSnapshot.id,
      status: 'generated',
      brief_text: briefText,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create first brief' }, { status: 500 })

  await sb
    .from('activation_milestones')
    .upsert({ user_id: userId, first_brief_at: new Date().toISOString(), status: 'pending' }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true, briefRunId: run?.id, briefText })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
