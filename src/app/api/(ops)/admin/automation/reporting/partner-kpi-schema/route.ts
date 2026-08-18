 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import {
  PARTNER_KPI_DEFINITIONS,
  PARTNER_PROGRAMS,
  cohortKeyFromDate,
  inferPartnerProgramFromTier,
  toPercent,
  type PartnerProgram,
} from '@/lib/partner-kpi-schema'

type ScopedMember = {
  userId: string
  partnerId: string
  partnerName: string
  cohortKey: string
  program: PartnerProgram
}

type BreakdownRow = {
  partner_id: string
  partner_name: string
  cohort_key: string
  program: PartnerProgram
  users_in_scope: number
  utilization_rate: number
  prep_completion_rate: number
  followup_completion_rate: number
  pipeline_movement_rate: number
}

function toIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function parseWindowDays(request: NextRequest): number {
  const raw = Number(request.nextUrl.searchParams.get('window_days') ?? 30)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(365, Math.floor(raw)))
}

function parseOptional(value: string | null): string | null {
  const normalized = (value ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

function parseProgram(value: string | null): PartnerProgram | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  return PARTNER_PROGRAMS.includes(normalized as PartnerProgram) ? (normalized as PartnerProgram) : null
}

function uniqueUserIds(members: ScopedMember[]): string[] {
  return Array.from(new Set(members.map((row) => row.userId)))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const windowDays = parseWindowDays(request)
  const partnerFilter = parseOptional(request.nextUrl.searchParams.get('partner_id'))
  const cohortFilter = parseOptional(request.nextUrl.searchParams.get('cohort_key'))
  const programFilter = parseProgram(request.nextUrl.searchParams.get('program'))
  const sinceIso = toIsoDaysAgo(windowDays)

  const [partnerResult, attributionResult] = await Promise.all([
    sb.from('partners').select('id,name,is_active').eq('is_active', true),
    sb.from('referral_attributions').select('partner_id,signup_user_id,attributed_at').gte('attributed_at', sinceIso),
  ])

  const partners = (partnerResult.data ?? []) as Array<{ id: string; name: string }>
  const attributions = (attributionResult.data ?? []) as Array<{ partner_id: string; signup_user_id: string; attributed_at: string }>

  const partnerMap = new Map(partners.map((row) => [row.id, row.name]))
  const allUserIds = Array.from(new Set(attributions.map((row) => row.signup_user_id)))

  let userRows: Array<{ id: string; created_at: string; subscription_tier: string | null }> = []
  if (allUserIds.length > 0) {
    const usersResult = await sb
      .from('users')
      .select('id,created_at,subscription_tier')
      .in('id', allUserIds)
      .limit(20000)
    userRows = (usersResult.data ?? []) as typeof userRows
  }

  const userMap = new Map(userRows.map((row) => [row.id, row]))
  const members: ScopedMember[] = []

  for (const attr of attributions) {
    const partnerName = partnerMap.get(attr.partner_id)
    if (!partnerName) continue
    const user = userMap.get(attr.signup_user_id)
    const inferredProgram = inferPartnerProgramFromTier(user?.subscription_tier ?? null)
    const cohortKey = cohortKeyFromDate(user?.created_at ?? attr.attributed_at)

    members.push({
      userId: attr.signup_user_id,
      partnerId: attr.partner_id,
      partnerName,
      cohortKey,
      program: inferredProgram,
    })
  }

  const filteredMembers = members.filter((row) => {
    if (partnerFilter && row.partnerId !== partnerFilter) return false
    if (cohortFilter && row.cohortKey !== cohortFilter) return false
    if (programFilter && row.program !== programFilter) return false
    return true
  })

  const scopedUserIds = uniqueUserIds(filteredMembers)

  let activeEventRows: Array<{ user_id: string }> = []
  let prepRows: Array<{ user_id: string }> = []
  let followupRows: Array<{ user_id: string }> = []
  let pipelineRows: Array<{ user_id: string }> = []

  if (scopedUserIds.length > 0) {
    const [eventsResult, prepResult, followupResult, pipelineResult] = await Promise.all([
      sb.from('user_events').select('user_id').in('user_id', scopedUserIds).gte('created_at', sinceIso).limit(100000),
      sb.from('briefs').select('user_id').in('user_id', scopedUserIds).in('type', ['prep', 'prep_section']).gte('created_at', sinceIso).limit(100000),
      sb.from('follow_ups').select('user_id,status').in('user_id', scopedUserIds).gte('created_at', sinceIso).limit(100000),
      sb.from('outreach_logs').select('user_id').in('user_id', scopedUserIds).gte('sent_at', sinceIso).limit(100000),
    ])

    activeEventRows = (eventsResult.data ?? []) as Array<{ user_id: string }>
    prepRows = (prepResult.data ?? []) as Array<{ user_id: string }>
    followupRows = ((followupResult.data ?? []) as Array<{ user_id: string; status: string | null }>)
      .filter((row) => {
        const status = (row.status ?? '').toLowerCase()
        return status === 'done' || status === 'completed' || status === 'sent'
      })
      .map((row) => ({ user_id: row.user_id }))
    pipelineRows = (pipelineResult.data ?? []) as Array<{ user_id: string }>
  }

  const activeUsers = new Set(activeEventRows.map((row) => row.user_id))
  const prepUsers = new Set(prepRows.map((row) => row.user_id))
  const followupUsers = new Set(followupRows.map((row) => row.user_id))
  const pipelineUsers = new Set(pipelineRows.map((row) => row.user_id))

  const groupMap = new Map<string, ScopedMember[]>()
  for (const row of filteredMembers) {
    const key = `${row.partnerId}::${row.cohortKey}::${row.program}`
    const existing = groupMap.get(key)
    if (existing) {
      existing.push(row)
    } else {
      groupMap.set(key, [row])
    }
  }

  const breakdown: BreakdownRow[] = []
  for (const groupedRows of groupMap.values()) {
    const sample = groupedRows[0]
    const groupUsers = uniqueUserIds(groupedRows)
    const userSet = new Set(groupUsers)

    const utilizationCount = groupUsers.filter((id) => activeUsers.has(id)).length
    const prepCount = groupUsers.filter((id) => prepUsers.has(id)).length
    const followupCount = groupUsers.filter((id) => followupUsers.has(id)).length
    const movementCount = groupUsers.filter((id) => pipelineUsers.has(id)).length

    breakdown.push({
      partner_id: sample.partnerId,
      partner_name: sample.partnerName,
      cohort_key: sample.cohortKey,
      program: sample.program,
      users_in_scope: userSet.size,
      utilization_rate: toPercent(utilizationCount, userSet.size),
      prep_completion_rate: toPercent(prepCount, userSet.size),
      followup_completion_rate: toPercent(followupCount, userSet.size),
      pipeline_movement_rate: toPercent(movementCount, userSet.size),
    })
  }

  const totalUsers = scopedUserIds.length
  const totals = {
    users_in_scope: totalUsers,
    utilization_rate: toPercent(Array.from(activeUsers).filter((id) => scopedUserIds.includes(id)).length, totalUsers),
    prep_completion_rate: toPercent(Array.from(prepUsers).filter((id) => scopedUserIds.includes(id)).length, totalUsers),
    followup_completion_rate: toPercent(Array.from(followupUsers).filter((id) => scopedUserIds.includes(id)).length, totalUsers),
    pipeline_movement_rate: toPercent(Array.from(pipelineUsers).filter((id) => scopedUserIds.includes(id)).length, totalUsers),
  }

  const parity = {
    utilization: {
      model_numerator: Array.from(activeUsers).filter((id) => scopedUserIds.includes(id)).length,
      raw_numerator: activeEventRows.length > 0 ? new Set(activeEventRows.map((row) => row.user_id)).size : 0,
    },
    prep_completion: {
      model_numerator: Array.from(prepUsers).filter((id) => scopedUserIds.includes(id)).length,
      raw_numerator: prepRows.length > 0 ? new Set(prepRows.map((row) => row.user_id)).size : 0,
    },
    followup_completion: {
      model_numerator: Array.from(followupUsers).filter((id) => scopedUserIds.includes(id)).length,
      raw_numerator: followupRows.length > 0 ? new Set(followupRows.map((row) => row.user_id)).size : 0,
    },
    pipeline_movement: {
      model_numerator: Array.from(pipelineUsers).filter((id) => scopedUserIds.includes(id)).length,
      raw_numerator: pipelineRows.length > 0 ? new Set(pipelineRows.map((row) => row.user_id)).size : 0,
    },
  }

  const parityChecks = {
    utilization_delta: parity.utilization.model_numerator - parity.utilization.raw_numerator,
    prep_completion_delta: parity.prep_completion.model_numerator - parity.prep_completion.raw_numerator,
    followup_completion_delta: parity.followup_completion.model_numerator - parity.followup_completion.raw_numerator,
    pipeline_movement_delta: parity.pipeline_movement.model_numerator - parity.pipeline_movement.raw_numerator,
  }

  const qaStatus = Object.values(parityChecks).every((delta) => delta === 0) ? 'pass' : 'alert'

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    schema: {
      ticket: 'PB-Q1-001',
      approvedBy: {
        revenue: 'pending',
        data: 'pending',
      },
      definitions: PARTNER_KPI_DEFINITIONS,
      dimensions: ['partner_id', 'partner_name', 'program', 'cohort_key', 'window_days'],
      filters: {
        partner_id: partnerFilter,
        program: programFilter,
        cohort_key: cohortFilter,
        window_days: windowDays,
      },
    },
    dataModel: {
      totals,
      breakdown,
      distinct_partners: new Set(filteredMembers.map((row) => row.partnerId)).size,
      distinct_cohorts: new Set(filteredMembers.map((row) => row.cohortKey)).size,
      distinct_programs: new Set(filteredMembers.map((row) => row.program)).size,
    },
    qaBaseline: {
      status: qaStatus,
      parity,
      deltas: parityChecks,
      note: 'Metric parity compares model numerators with raw distinct-user samples over the same scoped window.',
    },
  })
}
