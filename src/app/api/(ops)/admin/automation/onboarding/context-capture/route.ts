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
  const body = await request.json().catch(() => ({}))
  const source = (body?.source ?? 'automation_ticket_16').toString().slice(0, 80)
  const sb = supabase as any

  const [{ data: profile }, { data: companies }, { data: contacts }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, role_type, search_status, target_titles, target_sectors, target_locations, current_title, current_company')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('id, name, stage, fit_score, sector')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('contacts')
      .select('id, name, title, firm, channel, outreach_status, is_priority')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const payload = {
    captured_at: new Date().toISOString(),
    profile: profile ?? null,
    top_companies: companies ?? [],
    top_contacts: contacts ?? [],
  }

  const { data: inserted, error } = await sb
    .from('onboarding_context_snapshots')
    .insert({ user_id: userId, source, context_payload: payload })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to capture context' }, { status: 500 })
  return NextResponse.json({ ok: true, snapshotId: inserted?.id, companyCount: companies?.length ?? 0, contactCount: contacts?.length ?? 0 })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
