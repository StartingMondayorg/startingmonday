import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { getStaffMember } from '@/lib/staff'

const VALID_STATUSES = new Set(['prospect', 'reached_out', 'in_conversation', 'meeting_scheduled', 'closed'])

function normalizeEmail(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const fullName = (body?.fullName ?? '').toString().trim()
  const company = (body?.company ?? '').toString().trim()
  const status = (body?.status ?? '').toString().trim()

  if (!email || !status) {
    return NextResponse.json({ error: 'email and status are required.' }, { status: 400 })
  }
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('contacts')
    .select('id, company_id')
    .eq('user_id', userId)
    .ilike('email', email)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let resolvedCompanyId = existing?.company_id ?? null
  if (!resolvedCompanyId && company) {
    const { data: companyRow } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', company)
      .is('archived_at', null)
      .limit(1)
      .maybeSingle()
    resolvedCompanyId = companyRow?.id ?? null
  }

  if (existing?.id) {
    await supabase
      .from('contacts')
      .update({ outreach_status: status })
      .eq('id', existing.id)
      .eq('user_id', userId)
  } else {
    await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        company_id: resolvedCompanyId,
        name: fullName || email,
        firm: company || null,
        email,
        channel: 'cold',
        status: 'active',
        outreach_status: status,
      })
  }

  const stageProps = {
    stage: status,
    source: 'outreach_status_route',
    company: company || null,
    company_id: resolvedCompanyId,
  }
  await logEvent(userId, 'pipeline_stage_changed', stageProps)
  captureServerEvent(userId, 'pipeline_stage_changed', stageProps)

  if (status === 'in_conversation' && resolvedCompanyId) {
    await logEvent(userId, PMF_EVENTS.cadence.follow_up_logged, {
      company_id: resolvedCompanyId,
      source: 'outreach_status_route',
      action_context: 'relationship_progressed',
    })
    captureServerEvent(userId, PMF_EVENTS.cadence.follow_up_logged, {
      company_id: resolvedCompanyId,
      source: 'outreach_status_route',
      action_context: 'relationship_progressed',
    })
  }

  if (status === 'meeting_scheduled' && resolvedCompanyId) {
    await logEvent(userId, PMF_EVENTS.outcomes.first_interview_reached, {
      company_id: resolvedCompanyId,
      source: 'outreach_status_route',
      action_context: 'meeting_scheduled',
    })
    captureServerEvent(userId, PMF_EVENTS.outcomes.first_interview_reached, {
      company_id: resolvedCompanyId,
      source: 'outreach_status_route',
      action_context: 'meeting_scheduled',
    })
  }

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
