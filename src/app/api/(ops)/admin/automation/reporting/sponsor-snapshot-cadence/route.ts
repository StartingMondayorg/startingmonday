 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { buildCohortModel } from '@/lib/outplacement-cohort-model'

function parseCadenceDays(request: NextRequest): number {
  const raw = Number(request.nextUrl.searchParams.get('cadence_days') ?? 7)
  if (!Number.isFinite(raw)) return 7
  return Math.max(3, Math.min(30, Math.floor(raw)))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const cadenceDays = parseCadenceDays(request)
  const startIso = new Date(Date.now() - cadenceDays * 24 * 60 * 60 * 1000).toISOString()

  const [partnersRes, attributionRes, eventsRes, prepRes, outreachRes, followupRes] = await Promise.all([
    sb.from('partners').select('id,name,is_active').eq('is_active', true),
    sb.from('referral_attributions').select('partner_id,signup_user_id,attributed_at').limit(200000),
    sb.from('user_events').select('user_id').gte('created_at', startIso).limit(200000),
    sb.from('briefs').select('user_id,type').in('type', ['prep', 'prep_section']).gte('created_at', startIso).limit(200000),
    sb.from('outreach_logs').select('user_id').gte('sent_at', startIso).limit(200000),
    sb.from('follow_ups').select('user_id,status,next_action_status').gte('created_at', startIso).limit(200000),
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
  const checks = cohorts.map((cohort) => {
    const fields = cohort.sponsorSnapshot.fields
    const missingFields = Object.entries(fields)
      .filter(([, value]) => value === null || value === undefined || Number.isNaN(Number(value)))
      .map(([key]) => key)

    return {
      cohort_id: cohort.cohortId,
      partner_name: cohort.partnerName,
      cohort_key: cohort.cohortKey,
      snapshot_status: cohort.sponsorSnapshot.status,
      cadence_adherence_rate: fields.cadence_adherence_rate,
      missing_fields: missingFields,
      pass: missingFields.length === 0,
    }
  })

  const failing = checks.filter((row) => !row.pass)
  const cadenceAdherence = checks.length > 0
    ? Number((checks.reduce((sum, row) => sum + row.cadence_adherence_rate, 0) / checks.length).toFixed(2))
    : 0

  if (failing.length > 0) {
    await sb.from('automation_alerts').insert({
      user_id: auth.userId,
      source_table: 'trend_report_runs',
      alert_code: 'sponsor_snapshot_missing_fields',
      severity: 'medium',
      message: `Sponsor snapshot cadence monitor found ${failing.length} cohorts with missing snapshot fields.`,
      status: 'open',
    })
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: {
      ticket: 'PB-Q2-003',
      generated_at: new Date().toISOString(),
      cadence_days: cadenceDays,
      cadence_adherence_rate: cadenceAdherence,
      failing_count: failing.length,
      checks,
    },
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-003',
    generatedAt: new Date().toISOString(),
    cadence: {
      days: cadenceDays,
      recommended_cron_utc: '0 14 * * 1',
      cadence_adherence_rate: cadenceAdherence,
      target_pct: 70,
      target_met: cadenceAdherence >= 70,
    },
    summary: {
      cohort_count: checks.length,
      failing_count: failing.length,
      passing_count: checks.length - failing.length,
    },
    checks,
  })
}
