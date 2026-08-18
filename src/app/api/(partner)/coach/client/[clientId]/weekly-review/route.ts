import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { verifyCoachAccess, logCoachAccess } from '@/lib/coach-access'

function startOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

const AGENDA_TEMPLATES: Array<{ id: string; label: string; items: string[] }> = [
  {
    id: 'pipeline_reset',
    label: 'Pipeline Reset Session',
    items: ['Pipeline movement review', 'Top blockers', 'Priority outreach decisions', 'Next-week commitments'],
  },
  {
    id: 'interview_readiness',
    label: 'Interview Readiness Session',
    items: ['Role signal recap', 'Brief quality review', 'Story rehearsal', 'Follow-up plan'],
  },
  {
    id: 'executive_positioning',
    label: 'Executive Positioning Session',
    items: ['Narrative clarity', 'Target role calibration', 'Network strategy', 'Action assignment'],
  },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  const { hasAccess, canWrite } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this client' }, { status: 403 })
  }
  if (!canWrite) {
    return NextResponse.json({ error: 'Read-only coach access cannot modify weekly reviews' }, { status: 403 })
  }

  const supabase = await createClient()
  const weekStart = toISODate(startOfWeekUTC(new Date()))

  const [{ data: currentReview }, { data: recentReviews }] = await Promise.all([
    supabase
      .from('coach_weekly_reviews')
      .select('id, week_start, review_answers, next_follow_up_id, status, completed_at, created_at, updated_at')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .eq('week_start', weekStart)
      .maybeSingle(),
    supabase
      .from('coach_weekly_reviews')
      .select('id, week_start, review_answers, next_follow_up_id, status, completed_at, created_at, updated_at')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('week_start', { ascending: false })
      .limit(4),
  ])

  return NextResponse.json(
    {
      data: {
        week_start: weekStart,
        current_review: currentReview ?? null,
        recent_reviews: recentReviews ?? [],
        agenda_templates: AGENDA_TEMPLATES,
      },
    },
    { status: 200, headers: auth.response.headers }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  const { hasAccess, canWrite } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this client' }, { status: 403 })
  }
  if (!canWrite) {
    return NextResponse.json({ error: 'Read-only coach access cannot modify weekly reviews' }, { status: 403 })
  }

  const payload = await request.json().catch(() => ({}))
  const weekStart = typeof payload.week_start === 'string' && payload.week_start ? payload.week_start : toISODate(startOfWeekUTC(new Date()))
  const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {}
  const nextAction = payload.next_action && typeof payload.next_action === 'object' ? payload.next_action : {}
  const nextActionText = typeof nextAction.action === 'string' ? nextAction.action.trim() : ''
  const nextActionOwner = typeof nextAction.owner === 'string' ? nextAction.owner.trim() : ''
  const nextActionDueDate = typeof nextAction.due_date === 'string' ? nextAction.due_date.trim() : ''
  const nextActionStatus = typeof nextAction.status === 'string' ? nextAction.status.trim() : 'pending'
  const agendaTemplate = typeof payload.agenda_template === 'string'
    ? payload.agenda_template.trim()
    : 'pipeline_reset'
  const rawAgendaItems: unknown[] = Array.isArray(payload.agenda_items) ? payload.agenda_items : []
  const agendaItems = rawAgendaItems.length > 0
    ? rawAgendaItems
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    : []
  const sessionNotes = payload.session_notes && typeof payload.session_notes === 'object'
    ? {
        wins: typeof payload.session_notes.wins === 'string' ? payload.session_notes.wins.trim() : '',
        risks: typeof payload.session_notes.risks === 'string' ? payload.session_notes.risks.trim() : '',
        decisions: typeof payload.session_notes.decisions === 'string' ? payload.session_notes.decisions.trim() : '',
        freeform: typeof payload.session_notes.freeform === 'string' ? payload.session_notes.freeform.trim() : '',
      }
    : { wins: '', risks: '', decisions: '', freeform: '' }
  const confidenceLevel = typeof payload.confidence_level === 'string' ? payload.confidence_level.trim() : ''
  const momentumLevel = typeof payload.momentum_level === 'string' ? payload.momentum_level.trim() : ''
  const narrativeDrift = typeof payload.narrative_drift === 'string' ? payload.narrative_drift.trim() : ''

  if (!nextActionText || !nextActionOwner || !nextActionDueDate) {
    return NextResponse.json({ error: 'Weekly review needs a next action owner and due date' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: existingAction } = await supabase
    .from('follow_ups')
    .select('id')
    .eq('user_id', clientId)
    .eq('action', nextActionText)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const actionPayload = {
    user_id: clientId,
    action: nextActionText,
    due_date: nextActionDueDate,
    status: nextActionStatus === 'done' ? 'completed' : 'pending',
    next_action_owner: nextActionOwner,
    next_action_due_date: nextActionDueDate,
    next_action_status: nextActionStatus,
  }

  const { data: savedAction, error: actionError } = existingAction
    ? await supabase
        .from('follow_ups')
        .update(actionPayload)
        .eq('id', existingAction.id)
        .select('id, action, due_date, next_action_owner, next_action_due_date, next_action_status')
        .maybeSingle()
    : await supabase
        .from('follow_ups')
        .insert(actionPayload)
        .select('id, action, due_date, next_action_owner, next_action_due_date, next_action_status')
        .maybeSingle()

  if (actionError || !savedAction) {
    return NextResponse.json({ error: 'Failed to save next action' }, { status: 500 })
  }

  const reviewRecord = {
    coach_id: coachId,
    client_id: clientId,
    week_start: weekStart,
    review_answers: {
      ...answers,
      agenda_template: agendaTemplate,
      agenda_items: agendaItems,
      session_notes: sessionNotes,
      confidence_level: confidenceLevel,
      momentum_level: momentumLevel,
      narrative_drift: narrativeDrift,
    },
    next_follow_up_id: savedAction.id,
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: savedReview, error: reviewError } = await supabase
    .from('coach_weekly_reviews')
    .upsert(reviewRecord, { onConflict: 'coach_id,client_id,week_start' })
    .select('id, week_start, review_answers, next_follow_up_id, status, completed_at, created_at, updated_at')
    .maybeSingle()

  if (reviewError || !savedReview) {
    return NextResponse.json({ error: 'Failed to save weekly review' }, { status: 500 })
  }

  const sessionTimelineAction = `Session artifact (${weekStart})`
  const { data: existingTimeline } = await supabase
    .from('follow_ups')
    .select('id')
    .eq('user_id', clientId)
    .eq('action', sessionTimelineAction)
    .eq('due_date', weekStart)
    .maybeSingle()

  const timelineRecord = {
    user_id: clientId,
    action: sessionTimelineAction,
    due_date: weekStart,
    status: 'completed',
    next_action_owner: coachId,
    next_action_due_date: weekStart,
    next_action_status: 'done',
  }

  const { data: timelineArtifact } = existingTimeline
    ? await supabase
        .from('follow_ups')
        .update(timelineRecord)
        .eq('id', existingTimeline.id)
        .select('id, action, due_date, status')
        .maybeSingle()
    : await supabase
        .from('follow_ups')
        .insert(timelineRecord)
        .select('id, action, due_date, status')
        .maybeSingle()

  await logCoachAccess(coachId, clientId, 'coach_weekly_reviews', savedReview.id, 'create', null, reviewRecord)
  await logCoachAccess(coachId, clientId, 'follow_ups', savedAction.id, existingAction ? 'update' : 'create', null, actionPayload)
  if (timelineArtifact?.id) {
    await logCoachAccess(coachId, clientId, 'follow_ups', timelineArtifact.id, existingTimeline ? 'update' : 'create', null, timelineRecord)
  }

  return NextResponse.json(
    {
      data: {
        weekly_review: savedReview,
        next_action: savedAction,
        session_artifact: timelineArtifact ?? null,
        timeline_linked: Boolean(timelineArtifact?.id),
      },
    },
    { status: 200, headers: auth.response.headers }
  )
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
