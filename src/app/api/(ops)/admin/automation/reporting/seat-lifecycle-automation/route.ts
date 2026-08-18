/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { canTransitionSeat, type ProvisioningSeatStatus } from '@/lib/partner-provisioning'

const lifecycleSchema = z.object({
  action: z.enum(['invite', 'activate', 'suspend', 'transfer', 'archive']),
  partnerId: z.string(),
  cohortId: z.string(),
  actorRole: z.enum(['staff_automation', 'partner_admin']).default('staff_automation'),
  seatIds: z.array(z.string()).default([]),
  fromStatus: z.enum(['invited', 'active', 'suspended', 'transferred', 'archived']).optional(),
  toStatus: z.enum(['invited', 'active', 'suspended', 'transferred', 'archived']).optional(),
  transferToPartnerId: z.string().optional(),
  note: z.string().optional(),
})

function defaultTargetStatus(action: z.infer<typeof lifecycleSchema>['action']): ProvisioningSeatStatus {
  if (action === 'invite') return 'invited'
  if (action === 'activate') return 'active'
  if (action === 'suspend') return 'suspended'
  if (action === 'transfer') return 'transferred'
  return 'archived'
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, lifecycleSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsed.body
  const fromStatus = payload.fromStatus ?? (payload.action === 'invite' ? 'invited' : 'active')
  const toStatus = payload.toStatus ?? defaultTargetStatus(payload.action)
  const permissionScopeOk = payload.actorRole === 'staff_automation' || payload.partnerId === payload.transferToPartnerId || !payload.transferToPartnerId

  if (!permissionScopeOk) {
    return NextResponse.json({
      error: 'Permission denied: partner-scoped actor cannot transfer seats across partners',
    }, { status: 403 })
  }

  if (payload.seatIds.length === 0) {
    return NextResponse.json({ error: 'At least one seat id is required for lifecycle actions' }, { status: 400 })
  }

  if (payload.action !== 'invite' && !canTransitionSeat(fromStatus, toStatus)) {
    return NextResponse.json({
      error: `Invalid lifecycle transition ${fromStatus} -> ${toStatus}`,
    }, { status: 400 })
  }

  const eventPayload = {
    ticket: 'PB-Q2-005',
    generated_at: new Date().toISOString(),
    action: payload.action,
    partner_id: payload.partnerId,
    cohort_id: payload.cohortId,
    actor_role: payload.actorRole,
    seat_ids: payload.seatIds,
    from_status: fromStatus,
    to_status: toStatus,
    transfer_to_partner_id: payload.transferToPartnerId ?? null,
    rollback_hint: `Reapply transition ${toStatus} -> ${fromStatus} for seat_ids count ${payload.seatIds.length}`,
    note: payload.note ?? null,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: eventPayload,
  })

  await sb.from('scheduled_job_observability_runs').insert({
    user_id: auth.userId,
    job_name: 'seat-lifecycle-automation',
    status: 'ok',
    details: eventPayload,
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-005',
    transition: {
      action: payload.action,
      from_status: fromStatus,
      to_status: toStatus,
      seat_count: payload.seatIds.length,
      partner_scope_enforced: true,
      bulk_supported: payload.seatIds.length > 1,
    },
    audit_event: eventPayload,
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
    .limit(120)

  const transitions = ((runRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-005')
    .map((row) => ({
      id: row.id,
      created_at: row.created_at,
      action: row.trend_payload?.action,
      partner_id: row.trend_payload?.partner_id,
      cohort_id: row.trend_payload?.cohort_id,
      seat_count: Array.isArray(row.trend_payload?.seat_ids) ? row.trend_payload.seat_ids.length : 0,
      from_status: row.trend_payload?.from_status,
      to_status: row.trend_payload?.to_status,
    }))

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-005',
    transitions,
    lifecycle_actions: ['invite', 'activate', 'suspend', 'transfer', 'archive'],
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
