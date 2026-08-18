 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { OUTPLACEMENT_MILESTONES, buildCohortModel } from '@/lib/outplacement-cohort-model'

function toIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function parseWindowDays(request: NextRequest): number {
  const raw = Number(request.nextUrl.searchParams.get('window_days') ?? 120)
  if (!Number.isFinite(raw)) return 120
  return Math.max(30, Math.min(365, Math.floor(raw)))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const windowDays = parseWindowDays(request)
  const sinceIso = toIsoDaysAgo(windowDays)

  const [partnersRes, attributionRes] = await Promise.all([
    sb.from('partners').select('id,name,is_active').eq('is_active', true),
    sb.from('referral_attributions').select('partner_id,signup_user_id,attributed_at').gte('attributed_at', sinceIso),
  ])

  const partners = (partnersRes.data ?? []) as Array<{ id: string; name: string }>
  const attributions = (attributionRes.data ?? []) as Array<{ partner_id: string; signup_user_id: string; attributed_at: string }>
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

  const scopedUserIds = Array.from(new Set(attributions.map((row) => row.signup_user_id)))

  let activeUsers = new Set<string>()
  let prepUsers = new Set<string>()
  let outreachUsers = new Set<string>()
  let closedFollowupUsers = new Set<string>()

  if (scopedUserIds.length > 0) {
    const [eventsRes, prepRes, outreachRes, followupRes] = await Promise.all([
      sb.from('user_events').select('user_id').in('user_id', scopedUserIds).gte('created_at', sinceIso).limit(200000),
      sb.from('briefs').select('user_id,type').in('user_id', scopedUserIds).in('type', ['prep', 'prep_section']).gte('created_at', sinceIso).limit(200000),
      sb.from('outreach_logs').select('user_id').in('user_id', scopedUserIds).gte('sent_at', sinceIso).limit(200000),
      sb.from('follow_ups').select('user_id,status,next_action_status').in('user_id', scopedUserIds).gte('created_at', sinceIso).limit(200000),
    ])

    activeUsers = new Set(((eventsRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
    prepUsers = new Set(((prepRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
    outreachUsers = new Set(((outreachRes.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id))
    closedFollowupUsers = new Set(
      ((followupRes.data ?? []) as Array<{ user_id: string; status: string | null; next_action_status: string | null }>)
        .filter((row) => {
          const status = (row.next_action_status ?? row.status ?? '').toLowerCase()
          return status === 'completed' || status === 'done'
        })
        .map((row) => row.user_id),
    )
  }

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

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-001',
    generatedAt: new Date().toISOString(),
    schema: {
      entities: ['cohort', 'cohort_roster', 'cohort_milestone', 'sponsor_snapshot'],
      required_fields: {
        cohort: ['cohort_id', 'partner_id', 'cohort_key', 'program', 'status'],
        cohort_roster: ['cohort_id', 'user_id', 'attributed_at'],
        cohort_milestone: ['cohort_id', 'milestone_id', 'completed_users', 'completion_rate'],
        sponsor_snapshot: ['cohort_id', 'roster_size', 'active_seats', 'milestone_completion_rate', 'cadence_adherence_rate'],
      },
      milestone_definitions: OUTPLACEMENT_MILESTONES,
      normalized_snapshot_fields: ['roster_size', 'active_seats', 'milestone_completion_rate', 'utilization_rate', 'cadence_adherence_rate'],
      dimensions: ['partner_id', 'partner_name', 'cohort_key', 'program'],
      window_days: windowDays,
    },
    data_model: {
      cohorts,
      totals: {
        cohort_count: cohorts.length,
        partner_count: new Set(cohorts.map((row) => row.partnerId)).size,
        roster_users: cohorts.reduce((sum, row) => sum + row.rosterSize, 0),
      },
    },
    compatibility: {
      partner_reporting_routes: [
        '/api/admin/automation/reporting/partner-kpi-schema',
        '/api/admin/automation/reporting/sponsor-export-pipeline',
      ],
      contract_status: 'pass',
    },
  })
}
