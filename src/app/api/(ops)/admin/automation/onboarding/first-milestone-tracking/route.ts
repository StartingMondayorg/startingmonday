/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const [{ data: latestBrief }, { data: latestSignal }, { data: latestAction }] = await Promise.all([
    sb.from('onboarding_brief_runs').select('created_at').eq('user_id', userId).eq('status', 'generated').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('company_signals').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('follow_ups').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const firstAlertAt = latestSignal?.created_at ?? null
  const firstBriefAt = latestBrief?.created_at ?? null
  const firstActionAt = latestAction?.created_at ?? null

  const completed = !!(firstAlertAt && firstBriefAt && firstActionAt)

  await sb
    .from('activation_milestones')
    .upsert({
      user_id: userId,
      first_alert_at: firstAlertAt,
      first_brief_at: firstBriefAt,
      first_action_at: firstActionAt,
      status: completed ? 'completed' : 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true, firstAlertAt, firstBriefAt, firstActionAt, status: completed ? 'completed' : 'pending' })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
