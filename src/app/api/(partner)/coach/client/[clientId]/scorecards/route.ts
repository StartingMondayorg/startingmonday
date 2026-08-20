import { requireAuth } from '@/lib/require-auth'
import { buildCoachSessionSnapshot } from '@/lib/coach-session-snapshot'
import { logEvent } from '@/lib/events'
import { createClient } from '@/lib/supabase/server'
import { verifyCoachAccess } from '@/lib/coach-access'
import { NextRequest, NextResponse } from 'next/server'

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function startOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

function weekLabel(date: Date): string {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  // Verify coach has access
  const { hasAccess } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this client' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

  type Company = { stage: string; fit_score: number | null }
  type Signal = { signal_date: string; signal_type: string }
  type Brief = { created_at: string }
  type Interview = { created_at: string; interview_stage: string | null }
  type ScanResult = { ai_score: number | null; scanned_at: string }

  const now = new Date()
  const last30dIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const last30dDate = toISODate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
  const todayIso = toISODate(now)
  const todayStartIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  const snapshotResult = await buildCoachSessionSnapshot(supabase, { clientId, coachId, now })
  const {
    companies,
    signals,
    briefs,
    interviews,
    followUps,
    snapshot,
  } = snapshotResult

  // Fetch scorecards
  const [
    { data: scansData },
    { count: stallEventCount },
  ] = await Promise.all([
    supabase
      .from('scan_results')
      .select('ai_score, scanned_at')
      .eq('user_id', clientId)
      .gte('scanned_at', last30dIso),
    supabase
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', clientId)
      .eq('event_name', 'stall_state_detected')
      .gte('created_at', todayStartIso),
  ])

  const scans = (scansData || []) as ScanResult[]
  if (snapshot.stalledLanes.some((lane) => lane.state === 'stalled') && !stallEventCount) {
    await logEvent(clientId, 'stall_state_detected', {
      source: 'coach_scorecard',
      coach_id: coachId,
      stalled_lanes: snapshot.stalledLanes
        .filter((lane) => lane.state === 'stalled')
        .map((lane) => lane.lane)
        .join(','),
      snapshot_started_at: snapshot.baselineStartedAt,
      stalled_lane_count: snapshot.stalledLanes.filter((lane) => lane.state === 'stalled').length,
    })
  }

  const thisWeekStart = startOfWeekUTC(now)
  const weeklyTrends = [0, 1, 2, 3].map((offset) => {
    const weekStart = new Date(thisWeekStart)
    weekStart.setUTCDate(thisWeekStart.getUTCDate() - offset * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7)

    const inWeek = (dateStr: string) => {
      const ts = new Date(dateStr).getTime()
      return ts >= weekStart.getTime() && ts < weekEnd.getTime()
    }

    return {
      week_start: weekLabel(weekStart),
      signals: signals.filter((s) => inWeek(s.signal_date)).length,
      briefs: briefs.filter((b) => inWeek(b.created_at)).length,
      interviews: interviews.filter((i) => inWeek(i.created_at)).length,
    }
  }).reverse()

  const scorecards = {
    pipeline: {
      total_companies: companies.length,
      by_stage: {
        watching: companies.filter((c) => c.stage === 'watching').length,
        researching: companies.filter((c) => c.stage === 'researching').length,
        applied: companies.filter((c) => c.stage === 'applied').length,
        interviewing_or_offer: companies.filter((c) => c.stage === 'interviewing' || c.stage === 'offer').length,
      },
      avg_fit_score: companies.length
        ? Math.round(
            companies.reduce((sum, c) => sum + (c.fit_score || 0), 0) / companies.length
          )
        : 0,
    },
    signals: {
      last_30_days: signals.length,
      avg_score: scans.length
        ? Math.round(scans.reduce((sum, s) => sum + (s.ai_score || 0), 0) / scans.length)
        : 0,
    },
    preparation: {
      briefs_last_30_days: briefs.length,
      interviews_last_30_days: interviews.length,
      interviews_by_outcome: {
        successful: companies.filter((c) => c.stage === 'offer').length,
        advancing: interviews.filter((i) => !!i.interview_stage).length,
        rejected: 0,
      },
    },
    activity_health: {
      is_active: signals.length > 0 || briefs.length > 0 || interviews.length > 0,
      last_signal_days: snapshot.lastSignalDays,
      last_brief_days: snapshot.lastBriefDays,
    },
    session_prep_snapshot: {
      baseline_started_at: snapshot.baselineStartedAt,
      baseline_label: snapshot.baselineLabel,
      signals_since_last_session: snapshot.signalsSinceLastSession,
      pipeline_changes_since_last_session: snapshot.pipelineChangesSinceLastSession,
      brief_reviews_since_last_session: snapshot.briefReviewsSinceLastSession,
      brief_uses_since_last_session: snapshot.briefUsesSinceLastSession,
      interviews_since_last_session: snapshot.interviewsSinceLastSession,
      active_pipeline_count: snapshot.activePipelineCount,
      overdue_actions: snapshot.overdueActions,
      stalled_lanes: snapshot.stalledLanes,
    },
    weekly_trends: weeklyTrends,
  }

  return NextResponse.json({ data: scorecards }, { status: 200, headers: auth.response.headers })
}
