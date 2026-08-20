/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { buildCohortModel } from '@/lib/outplacement-cohort-model'

const payloadSchema = z.object({
  action: z.enum(['create_cohort', 'update_milestone', 'update_roster']).optional(),
  cohortId: z.string().optional(),
  partnerId: z.string().optional(),
  partnerName: z.string().optional(),
  cohortKey: z.string().optional(),
  milestoneId: z.string().optional(),
  completedUsers: z.number().optional(),
  addUserIds: z.array(z.string()).optional(),
  removeUserIds: z.array(z.string()).optional(),
  note: z.string().optional(),
})

function applyOverrides(args: {
  cohorts: ReturnType<typeof buildCohortModel>
  operations: Array<{ id: string; created_at: string; trend_payload: any }>
}) {
  const map = new Map(args.cohorts.map((row) => [row.cohortId, row]))

  const sortedOperations = [...args.operations].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  for (const operation of sortedOperations) {
    const payload = operation.trend_payload ?? {}
    if (payload?.ticket !== 'PB-Q2-002') continue

    if (payload.action === 'create_cohort' && payload.cohortId && payload.partnerId) {
      if (!map.has(payload.cohortId)) {
        map.set(payload.cohortId, {
          cohortId: payload.cohortId,
          partnerId: payload.partnerId,
          partnerName: payload.partnerName ?? 'Unknown partner',
          cohortKey: payload.cohortKey ?? 'unknown',
          program: 'outplacement_standard',
          rosterUserIds: [],
          rosterSize: 0,
          milestones: [],
          sponsorSnapshot: {
            status: 'needs_attention',
            fields: {
              roster_size: 0,
              active_seats: 0,
              milestone_completion_rate: 0,
              utilization_rate: 0,
              cadence_adherence_rate: 0,
            },
          },
        })
      }
    }

    const cohortId = payload.cohortId as string | undefined
    if (!cohortId) continue
    const cohort = map.get(cohortId)
    if (!cohort) continue

    if (payload.action === 'update_roster') {
      const addUserIds: string[] = Array.isArray(payload.addUserIds)
        ? payload.addUserIds.filter((item: unknown): item is string => typeof item === 'string')
        : []
      const removeUserIds: Set<string> = new Set(
        Array.isArray(payload.removeUserIds)
          ? payload.removeUserIds.filter((item: unknown): item is string => typeof item === 'string')
          : [],
      )
      const current = new Set(cohort.rosterUserIds)

      for (const userId of addUserIds) current.add(userId)
      for (const userId of removeUserIds) current.delete(userId)

      const rosterUserIds = Array.from(current)
      cohort.rosterUserIds = rosterUserIds
      cohort.rosterSize = rosterUserIds.length
      cohort.sponsorSnapshot.fields.roster_size = rosterUserIds.length
    }

    if (payload.action === 'update_milestone' && payload.milestoneId) {
      const milestoneId = String(payload.milestoneId)
      const completedUsers = Math.max(0, Number(payload.completedUsers ?? 0))
      const existing = cohort.milestones.find((row) => row.id === milestoneId)
      if (existing) {
        existing.completedUsers = completedUsers
        existing.completionRate = cohort.rosterSize > 0
          ? Number(((completedUsers / cohort.rosterSize) * 100).toFixed(2))
          : 0
      }
    }

    map.set(cohort.cohortId, cohort)
  }

  return Array.from(map.values())
}

async function loadCohortView(sb: any) {
  const [partnersRes, attributionRes, eventsRes, prepRes, outreachRes, followupRes, opsRes] = await Promise.all([
    sb.from('partners').select('id,name,is_active').eq('is_active', true),
    sb.from('referral_attributions').select('partner_id,signup_user_id,attributed_at').limit(200000),
    sb.from('user_events').select('user_id').limit(200000),
    sb.from('briefs').select('user_id,type').in('type', ['prep', 'prep_section']).limit(200000),
    sb.from('outreach_logs').select('user_id').limit(200000),
    sb.from('follow_ups').select('user_id,status,next_action_status').limit(200000),
    sb.from('trend_report_runs').select('id,created_at,trend_payload').order('created_at', { ascending: false }).limit(300),
  ])

  const partners = (partnersRes.data ?? []) as Array<{ id: string; name: string }>
  const partnerIds = partners.map((row) => row.id)
  const partnerSettingsRes = partnerIds.length > 0
    ? await sb
      .from('partner_program_settings')
      .select('partner_id,default_program,cohort_naming_prefix')
      .in('partner_id', partnerIds)
    : { data: [] }

  const defaultProgramByPartnerId = new Map(
    ((partnerSettingsRes.data ?? []) as Array<{ partner_id: string; default_program: string | null }> )
      .filter((row) => typeof row.default_program === 'string' && row.default_program.length > 0)
      .map((row) => [row.partner_id, row.default_program as string]),
  )

  const cohortNamingPrefixByPartnerId = new Map(
    ((partnerSettingsRes.data ?? []) as Array<{ partner_id: string; cohort_naming_prefix: string | null }> )
      .map((row) => [row.partner_id, row.cohort_naming_prefix]),
  )

  const attributions = (attributionRes.data ?? []) as Array<{ partner_id: string; signup_user_id: string; attributed_at: string }>
  const activeUsers = new Set(((eventsRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
  const prepUsers = new Set(((prepRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
  const outreachUsers = new Set(((outreachRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
  const closedFollowupUsers = new Set(
    ((followupRes.data ?? []) as Array<{ user_id: string; status: string | null; next_action_status: string | null }>)
      .filter((row) => {
        const status = (row.next_action_status ?? row.status ?? '').toLowerCase()
        return status === 'completed' || status === 'done'
      })
      .map((row) => row.user_id),
  )

  const cohorts = buildCohortModel({
    partners,
    attributions,
    activeUsers,
    prepUsers,
    outreachUsers,
    closedFollowupUsers,
    defaultProgramByPartnerId,
    cohortNamingPrefixByPartnerId,
  })
  const operations = (opsRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>
  return applyOverrides({ cohorts, operations })
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const cohorts = await loadCohortView(sb)

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-002',
    generatedAt: new Date().toISOString(),
    role_access: {
      required: 'staff_automation',
      enforced: true,
    },
    summary: {
      cohort_count: cohorts.length,
      roster_users: cohorts.reduce((sum, row) => sum + row.rosterSize, 0),
      on_track: cohorts.filter((row) => row.sponsorSnapshot.status === 'on_track').length,
      needs_attention: cohorts.filter((row) => row.sponsorSnapshot.status === 'needs_attention').length,
      at_risk: cohorts.filter((row) => row.sponsorSnapshot.status === 'at_risk').length,
    },
    cohorts,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsedBody = await parseAutomationBody(request, payloadSchema)
  if (!parsedBody.ok) return parsedBody.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsedBody.body
  if (!payload.action) {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 })
  }

  const operationPayload = {
    ticket: 'PB-Q2-002',
    action: payload.action,
    cohortId: payload.cohortId,
    partnerId: payload.partnerId,
    partnerName: payload.partnerName,
    cohortKey: payload.cohortKey,
    milestoneId: payload.milestoneId,
    completedUsers: payload.completedUsers,
    addUserIds: payload.addUserIds ?? [],
    removeUserIds: payload.removeUserIds ?? [],
    note: payload.note ?? null,
    actor: auth.userId,
    at: new Date().toISOString(),
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: operationPayload,
  })

  await sb.from('scheduled_job_observability_runs').insert({
    user_id: auth.userId,
    job_name: 'outplacement-cohort-admin-audit',
    status: 'ok',
    details: operationPayload,
  })

  const cohorts = await loadCohortView(sb)
  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-002',
    operation: operationPayload,
    summary: {
      cohort_count: cohorts.length,
      roster_users: cohorts.reduce((sum, row) => sum + row.rosterSize, 0),
    },
    cohorts,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
