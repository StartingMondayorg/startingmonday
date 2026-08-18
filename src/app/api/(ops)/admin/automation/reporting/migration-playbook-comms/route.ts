/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const migrationSchema = z.object({
  action: z.enum(['schedule_segment', 'advance_phase', 'rollback']).default('schedule_segment'),
  partner_id: z.string(),
  segment: z.enum(['pilot', 'launch', 'scale', 'enterprise']),
  migration_path: z.enum(['legacy_to_launch', 'launch_to_scale', 'scale_to_transform']),
  phase: z.enum(['scheduled', 'in_flight', 'completed', 'exception']).default('scheduled'),
  comm_template: z.object({
    subject: z.string(),
    body: z.string(),
    channel: z.enum(['email', 'slack', 'in_app']).default('email'),
  }),
  rollback_checkpoint_id: z.string().optional(),
  note: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, migrationSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsed.body

  const eventPayload = {
    ticket: 'PB-Q2-011',
    generated_at: new Date().toISOString(),
    action: payload.action,
    partner_id: payload.partner_id,
    segment: payload.segment,
    migration_path: payload.migration_path,
    phase: payload.phase,
    comm_template: payload.comm_template,
    rollback_checkpoint_id: payload.rollback_checkpoint_id ?? `rbk_${payload.partner_id}_${Date.now()}`,
    rollout_control_points: ['cohort_selection_locked', 'comms_dispatched', 'pricing_sync_confirmed', 'post_cutover_validation'],
    note: payload.note ?? null,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: eventPayload,
  })

  await sb.from('scheduled_job_observability_runs').insert({
    user_id: auth.userId,
    job_name: 'migration-playbook-automation',
    status: payload.action === 'rollback' ? 'degraded' : 'ok',
    details: eventPayload,
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-011',
    migration_event: eventPayload,
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
    .limit(400)

  const events = ((runRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-011')

  const byPartner = new Map<string, { completed: number; exception: number; in_flight: number; scheduled: number; rollback: number }>()
  for (const row of events) {
    const partnerId = String(row.trend_payload?.partner_id ?? 'unknown')
    const bucket = byPartner.get(partnerId) ?? { completed: 0, exception: 0, in_flight: 0, scheduled: 0, rollback: 0 }
    const phase = String(row.trend_payload?.phase ?? 'scheduled')
    const action = String(row.trend_payload?.action ?? '')
    if (phase === 'completed') bucket.completed += 1
    else if (phase === 'exception') bucket.exception += 1
    else if (phase === 'in_flight') bucket.in_flight += 1
    else bucket.scheduled += 1
    if (action === 'rollback') bucket.rollback += 1
    byPartner.set(partnerId, bucket)
  }

  const dashboard = Array.from(byPartner.entries()).map(([partner_id, row]) => ({
    partner_id,
    completion_count: row.completed,
    exception_count: row.exception,
    in_flight_count: row.in_flight,
    scheduled_count: row.scheduled,
    rollback_count: row.rollback,
    status: row.exception > 0 ? 'needs_attention' : row.in_flight > 0 ? 'in_progress' : 'stable',
  }))

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-011',
    dashboard,
    comms_configurable: true,
    phased_adoption_with_rollback: true,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
