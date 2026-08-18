import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCronRequest } from '@/lib/cron-auth'
import { loadOnboardingQaScorecard } from '@/lib/onboarding-agent-scorecard'

export async function POST(request: NextRequest) {
  const isCronRequest = validateCronRequest(request)
  if (!isCronRequest) {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response
  }

  const body = await request.json().catch(() => ({})) as { referenceDate?: string }
  const admin = createAdminClient() as any
  const scorecard = await loadOnboardingQaScorecard(admin, body.referenceDate)

  const notes = scorecard.notes

  const { data, error } = await admin
    .from('onboarding_qa_weekly_scorecards')
    .upsert({
      week_start: scorecard.window.week_start,
      started_users: scorecard.summary.started_users,
      completed_users: scorecard.summary.completed_users,
      transition_first_completed: scorecard.summary.transition_first_completed,
      median_seconds_to_first_value: scorecard.summary.median_seconds_to_first_value,
      under_ten_min_rate: scorecard.summary.under_ten_min_rate,
      avg_manual_fields_reduction_rate: scorecard.summary.avg_manual_fields_reduction_rate,
      low_energy_mode_rate: scorecard.summary.low_energy_mode_rate,
      nudge_coverage_rate: scorecard.summary.nudge_coverage_rate,
      channel_mix: scorecard.summary.channel_mix,
      persona_mix: scorecard.summary.persona_mix,
      notes: notes.length > 0 ? notes.join('; ') : null,
      generated_at: scorecard.window.generated_at,
    }, { onConflict: 'week_start' })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    runId: data?.id,
    weekStart: scorecard.window.week_start,
    startedUsers: scorecard.summary.started_users,
    completedUsers: scorecard.summary.completed_users,
    transitionFirstCompleted: scorecard.summary.transition_first_completed,
    medianSecondsToFirstValue: scorecard.summary.median_seconds_to_first_value,
    underTenMinRate: scorecard.summary.under_ten_min_rate,
    avgManualFieldsReductionRate: scorecard.summary.avg_manual_fields_reduction_rate,
    lowEnergyModeRate: scorecard.summary.low_energy_mode_rate,
    nudgeCoverageRate: scorecard.summary.nudge_coverage_rate,
    journeyHealth: scorecard.journey_health,
    integrity: scorecard.integrity,
    overall: scorecard.overall,
    notes,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
