import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { verifyCoachAccess, logCoachAccess } from '@/lib/coach-access'

// GET /api/coach/client/[clientId]/session-snapshot
// Returns a one-screen pre-session view: what changed since last session.
// Covers: activity delta (last 7 days), stalled lanes, overdue actions,
// recent weekly-review notes, upcoming due dates, and next recommended move.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  const { hasAccess } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this client' }, { status: 403 })
  }

  await logCoachAccess(coachId, clientId, 'session_snapshots', clientId, 'view')

  const supabase = await createClient()
  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const todayIso = now.toISOString().slice(0, 10)

  const [
    eventsRes,
    followUpsRes,
    weeklyReviewRes,
    companiesRes,
    momentumRes,
  ] = await Promise.all([
    // Activity in the last 7 days
    supabase
      .from('user_events')
      .select('event_name, created_at')
      .eq('user_id', clientId)
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(50),

    // Open follow-ups: overdue and upcoming
    supabase
      .from('follow_ups')
      .select('id, action, due_date, status, next_action_status, next_action_due_date')
      .eq('user_id', clientId)
      .not('status', 'in', '("done","completed","sent")')
      .order('due_date', { ascending: true })
      .limit(20),

    // Latest weekly review note (within last 14 days)
    supabase
      .from('coach_weekly_reviews')
      .select('week_start, status, review_answers, completed_at')
      .eq('client_id', clientId)
      .gte('week_start', since14d.slice(0, 10))
      .order('week_start', { ascending: false })
      .limit(1),

    // Active pipeline companies
    supabase
      .from('companies')
      .select('id, name, stage')
      .eq('user_id', clientId)
      .is('archived_at', null)
      .not('stage', 'is', null)
      .limit(30),

    // Latest momentum score
    supabase
      .from('momentum_scores')
      .select('score, week_of')
      .eq('user_id', clientId)
      .order('week_of', { ascending: false })
      .limit(1),
  ])

  const events = eventsRes.data ?? []
  const followUps = followUpsRes.data ?? []
  const weeklyReviews = weeklyReviewRes.data ?? []
  const companies = companiesRes.data ?? []
  const momentumScores = (momentumRes.data ?? []) as Array<{ score: number; week_of: string }>

  // Activity delta
  const eventTypeCounts: Record<string, number> = {}
  for (const ev of events) {
    eventTypeCounts[ev.event_name] = (eventTypeCounts[ev.event_name] ?? 0) + 1
  }

  // Overdue vs upcoming actions
  const overdueActions = followUps.filter((f) => f.due_date < todayIso)
  const upcomingActions = followUps.filter((f) => f.due_date >= todayIso).slice(0, 5)

  // Stalled lanes: companies with no recent signal (no event touching them in 7d)
  // We can't join events to companies easily here, so we surface active companies
  // that haven't been "active" as a proxy stall indicator
  const pipelineCount = companies.length
  const pipelineByStage: Record<string, number> = {}
  for (const c of companies) {
    const stage = c.stage ?? 'unknown'
    pipelineByStage[stage] = (pipelineByStage[stage] ?? 0) + 1
  }

  // Latest momentum score
  const latestMomentum = momentumScores[0] ?? null
  const momentumScore = latestMomentum?.score ?? null

  // Latest weekly review
  const latestReview = weeklyReviews[0] ?? null

  // Next recommended move heuristic
  function recommendedMove(): string {
    if (overdueActions.length > 0) {
      return `${overdueActions.length} overdue action${overdueActions.length > 1 ? 's' : ''} need closure - review and update status before the session.`
    }
    if (momentumScore !== null && momentumScore < 40) {
      return 'Low momentum score - explore blockers and rebuild confidence before the session.'
    }
    if (pipelineCount === 0) {
      return 'No active pipeline companies - session focus should be adding 2-3 target companies.'
    }
    if (events.length === 0) {
      return 'No activity in the last 7 days - check in on what is preventing outreach and action.'
    }
    return 'Healthy momentum. Review recent activity and confirm next priority before the session.'
  }

  // Emit session_prep_viewed outcome event if this client is linked to a partner
  // We do this fire-and-forget (no admin client needed; just supabase user client)
  // The partner linkage is handled separately when the counselor is operating in partner context.

  const snapshot = {
    generated_at: now.toISOString(),
    client_id: clientId,
    momentum: {
      score: momentumScore,
      week_of: latestMomentum?.week_of ?? null,
    },
    activity_7d: {
      event_count: events.length,
      event_types: eventTypeCounts,
      last_event_at: events[0]?.created_at ?? null,
    },
    pipeline: {
      total_active: pipelineCount,
      by_stage: pipelineByStage,
    },
    actions: {
      overdue: overdueActions.map((f) => ({
        id: f.id,
        action: f.action,
        due_date: f.due_date,
      })),
      upcoming: upcomingActions.map((f) => ({
        id: f.id,
        action: f.action,
        due_date: f.due_date,
      })),
    },
    last_review: latestReview
      ? {
        week_start: latestReview.week_start,
        status: latestReview.status,
        completed_at: latestReview.completed_at,
        review_answers: latestReview.review_answers,
      }
      : null,
    recommended_move: recommendedMove(),
  }

  return NextResponse.json({ ok: true, data: snapshot })
}
