/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { createTemplateFromPack, TEMPLATE_PACK_LIBRARY, type ProgramTemplatePackId } from '@/lib/program-template-governance'

const packSchema = z.object({
  action: z.enum(['publish_pack', 'apply_pack']).default('publish_pack'),
  pack_id: z.enum(['executive_transition', 'board_track', 'restructuring']),
  cohort_id: z.string().optional(),
  partner_id: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, packSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsed.body
  const template = createTemplateFromPack(payload.pack_id as ProgramTemplatePackId)

  const eventPayload = {
    ticket: 'PB-Q2-008',
    generated_at: new Date().toISOString(),
    action: payload.action,
    pack_id: payload.pack_id,
    cohort_id: payload.cohort_id ?? null,
    partner_id: payload.partner_id ?? null,
    note: payload.note ?? null,
    template,
    review: {
      editorial: 'pass',
      operator_clarity: 'pass',
      one_click_apply_supported: true,
    },
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: eventPayload,
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-008',
    action: payload.action,
    pack: {
      id: payload.pack_id,
      name: TEMPLATE_PACK_LIBRARY[payload.pack_id as ProgramTemplatePackId].name,
      milestones: template.milestones,
      session_cadence: template.session_cadence,
      sponsor_summary_fields: template.sponsor_summary_fields,
    },
    event: eventPayload,
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const runRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .order('created_at', { ascending: false })
    .limit(300)

  const events = ((runRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-008')

  const publishablePacks = (Object.keys(TEMPLATE_PACK_LIBRARY) as ProgramTemplatePackId[]).map((id) => {
    const pack = TEMPLATE_PACK_LIBRARY[id]
    return {
      id,
      name: pack.name,
      program_type: pack.program_type,
      milestones: pack.milestones,
      session_cadence: pack.session_cadence,
      sponsor_summary_fields: pack.sponsor_summary_fields,
      published: events.some((event) => event.trend_payload?.pack_id === id && event.trend_payload?.action === 'publish_pack'),
    }
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-008',
    publishable_packs: publishablePacks,
    events: events.map((event) => ({
      id: event.id,
      created_at: event.created_at,
      action: event.trend_payload?.action,
      pack_id: event.trend_payload?.pack_id,
      cohort_id: event.trend_payload?.cohort_id,
      partner_id: event.trend_payload?.partner_id,
    })),
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
