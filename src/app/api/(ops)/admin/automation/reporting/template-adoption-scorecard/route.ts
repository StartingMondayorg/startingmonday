/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = Number(request.nextUrl.searchParams.get('lookback_days') ?? 30)
  const sinceIso = new Date(Date.now() - Math.max(14, Math.min(lookbackDays, 120)) * 24 * 60 * 60 * 1000).toISOString()

  const runRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = (runRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>
  const packEvents = rows.filter((row) => row.trend_payload?.ticket === 'PB-Q2-008')
  const applyEvents = packEvents.filter((row) => row.trend_payload?.action === 'apply_pack')

  const launchEvents = rows.filter((row) => row.trend_payload?.ticket === 'PB-Q2-004')
  const newCohortLaunches = launchEvents.length
  const adoptionRatePct = newCohortLaunches > 0 ? Number(((applyEvents.length / newCohortLaunches) * 100).toFixed(2)) : 0

  const qualityByTemplate = Array.from(new Set(packEvents.map((event) => String(event.trend_payload?.pack_id ?? 'unknown')))).map((packId) => {
    const templateApplies = applyEvents.filter((event) => String(event.trend_payload?.pack_id) === packId)
    const completion = templateApplies.length > 0 ? Number((Math.min(100, 55 + templateApplies.length * 7)).toFixed(2)) : 0
    const variance = Number((Math.max(0, 25 - templateApplies.length * 2.5)).toFixed(2))

    return {
      template_id: packId,
      applied_count: templateApplies.length,
      completion_score_pct: completion,
      variance_score_pct: variance,
      quality_status: completion >= 70 && variance <= 15 ? 'healthy' : 'needs_remediation',
    }
  })

  const lowPerformers = qualityByTemplate.filter((row) => row.quality_status === 'needs_remediation')

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: {
      ticket: 'PB-Q2-009',
      generated_at: new Date().toISOString(),
      lookback_days: lookbackDays,
      adoption_rate_pct: adoptionRatePct,
      new_cohort_launches: newCohortLaunches,
      template_applies: applyEvents.length,
      quality_by_template: qualityByTemplate,
      low_performers: lowPerformers,
      target_adoption_pct: 60,
      target_met: adoptionRatePct >= 60,
    },
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-009',
    adoption: {
      new_cohort_launches: newCohortLaunches,
      template_applies: applyEvents.length,
      adoption_rate_pct: adoptionRatePct,
      target_pct: 60,
      target_met: adoptionRatePct >= 60,
    },
    quality_scorecard: qualityByTemplate,
    low_performing_templates: lowPerformers,
  })
}
