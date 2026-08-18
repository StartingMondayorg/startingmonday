import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { verifyCoachAccess, logCoachAccess } from '@/lib/coach-access'

type ActionStatus = 'pending' | 'done' | 'blocked'

type ClosureStatus = 'open' | 'in_progress' | 'completed'

function isActionStatus(value: unknown): value is ActionStatus {
  return value === 'pending' || value === 'done' || value === 'blocked'
}

function isClosureStatus(value: unknown): value is ClosureStatus {
  return value === 'open' || value === 'in_progress' || value === 'completed'
}

function toClosureStatus(value: string | null | undefined): ClosureStatus {
  if (value === 'completed' || value === 'done') return 'completed'
  if (value === 'in_progress' || value === 'blocked') return 'in_progress'
  return 'open'
}

function toFollowUpStatus(value: ClosureStatus): ActionStatus {
  if (value === 'completed') return 'done'
  if (value === 'in_progress') return 'blocked'
  return 'pending'
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  const { hasAccess } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this client' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follow_ups')
    .select('id, action, due_date, status, next_action_owner, next_action_due_date, next_action_status, created_at')
    .eq('user_id', clientId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 })
  }

  const rows = data ?? []
  const current = rows.find((item) => item.status === 'pending' || item.next_action_status === 'open' || item.next_action_status === 'in_progress')
    ?? rows[0]
    ?? null
  const assignedCount = rows.filter((item) => Boolean(item.next_action_owner && item.next_action_owner.trim())).length
  const totalCount = rows.length
  const unassignedRate = totalCount > 0 ? Number((((totalCount - assignedCount) / totalCount) * 100).toFixed(2)) : 0
  const completedCount = rows.filter((item) => toClosureStatus(item.next_action_status ?? item.status) === 'completed').length
  const closureCompletionRate = totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(2)) : 0

  return NextResponse.json(
    {
      data: {
        current_action: current
          ? {
              id: current.id,
              action: current.action,
              due_date: current.next_action_due_date ?? current.due_date,
              status: toClosureStatus(current.next_action_status ?? current.status),
              next_action_owner: current.next_action_owner,
              next_action_due_date: current.next_action_due_date ?? current.due_date,
              next_action_status: toClosureStatus(current.next_action_status ?? current.status),
              is_overdue: (current.next_action_due_date ?? current.due_date) < todayIso(),
            }
          : null,
        metrics: {
          total_actions: totalCount,
          unassigned_action_rate: unassignedRate,
          pilot_closure_completion_rate: closureCompletionRate,
          closure_target_pct: 75,
          closure_target_met: closureCompletionRate >= 75,
        },
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
    return NextResponse.json({ error: 'Read-only coach access cannot modify actions' }, { status: 403 })
  }

  const payload = await request.json().catch(() => ({}))
  const owner = typeof payload.owner === 'string' ? payload.owner.trim() : ''
  const dueDate = typeof payload.due_date === 'string' && payload.due_date.trim()
    ? payload.due_date.trim()
    : new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

  const supabase = await createClient()
  const { data: latestReview } = await supabase
    .from('coach_weekly_reviews')
    .select('review_answers, week_start')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  const answers = latestReview?.review_answers && typeof latestReview.review_answers === 'object'
    ? latestReview.review_answers as Record<string, unknown>
    : {}

  const sessionNotes = answers.session_notes && typeof answers.session_notes === 'object'
    ? answers.session_notes as Record<string, unknown>
    : {}

  const sourceText = [
    typeof answers.nextStep === 'string' ? answers.nextStep : '',
    typeof answers.brief === 'string' ? answers.brief : '',
    typeof sessionNotes.decisions === 'string' ? sessionNotes.decisions : '',
    typeof sessionNotes.freeform === 'string' ? sessionNotes.freeform : '',
  ].join('\n')

  const extractedActions = Array.from(
    new Set(
      sourceText
        .split(/\n|\.|;/g)
        .map((part) => part.trim())
        .filter((part) => part.length >= 12)
        .filter((part) => /send|review|prepare|confirm|schedule|follow|draft|share|update|align|reach/i.test(part))
        .slice(0, 5),
    ),
  )

  if (extractedActions.length === 0) {
    return NextResponse.json(
      { data: { extracted: 0, actions: [], message: 'No actionable items found in latest session notes' } },
      { status: 200, headers: auth.response.headers },
    )
  }

  const inserts = extractedActions.map((action) => ({
    user_id: clientId,
    action,
    due_date: dueDate,
    status: 'pending',
    next_action_owner: owner || null,
    next_action_due_date: dueDate,
    next_action_status: owner ? 'open' : 'open',
  }))

  const { data: created, error } = await supabase
    .from('follow_ups')
    .insert(inserts)
    .select('id, action, due_date, status, next_action_owner, next_action_due_date, next_action_status')

  if (error) {
    return NextResponse.json({ error: 'Failed to extract actions' }, { status: 500 })
  }

  for (const row of created ?? []) {
    await logCoachAccess(coachId, clientId, 'follow_ups', row.id, 'create', null, row)
  }

  const total = created?.length ?? 0
  const unassigned = (created ?? []).filter((row) => !row.next_action_owner).length
  const unassignedRate = total > 0 ? Number(((unassigned / total) * 100).toFixed(2)) : 0

  return NextResponse.json(
    {
      data: {
        extracted: total,
        actions: (created ?? []).map((row) => ({
          ...row,
          next_action_status: toClosureStatus(row.next_action_status ?? row.status),
        })),
        metrics: {
          unassigned_action_rate: unassignedRate,
        },
      },
    },
    { status: 200, headers: auth.response.headers },
  )
}

export async function PATCH(
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
    return NextResponse.json({ error: 'Read-only coach access cannot modify actions' }, { status: 403 })
  }

  const payload = await request.json().catch(() => ({}))
  const action = typeof payload.action === 'string' ? payload.action.trim() : ''
  const dueDate = typeof payload.due_date === 'string' ? payload.due_date.trim() : ''
  const nextActionOwner = typeof payload.next_action_owner === 'string' ? payload.next_action_owner.trim() : ''
  const nextActionDueDate = typeof payload.next_action_due_date === 'string' ? payload.next_action_due_date.trim() : ''
  const closureStatus = isClosureStatus(payload.next_action_status)
    ? payload.next_action_status
    : toClosureStatus(typeof payload.status === 'string' ? payload.status : 'pending')
  const followUpStatus = toFollowUpStatus(closureStatus)
  const recordId = typeof payload.id === 'string' ? payload.id.trim() : ''

  if (!action || !dueDate || !nextActionOwner || !nextActionDueDate) {
    return NextResponse.json({ error: 'Action, owner, and due date are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const record = {
    user_id: clientId,
    action,
    due_date: dueDate,
    status: followUpStatus,
    next_action_owner: nextActionOwner,
    next_action_due_date: nextActionDueDate,
    next_action_status: closureStatus,
  }

  const query = recordId
    ? supabase
        .from('follow_ups')
        .update(record)
        .eq('id', recordId)
        .eq('user_id', clientId)
    : supabase
        .from('follow_ups')
        .insert(record)

  const { data, error } = await query
    .select('id, action, due_date, status, next_action_owner, next_action_due_date, next_action_status')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to save action' }, { status: 500 })
  }

  await logCoachAccess(coachId, clientId, 'follow_ups', data.id, recordId ? 'update' : 'create', null, record)

  return NextResponse.json(
    {
      data: {
        ...data,
        status: toClosureStatus(data.next_action_status ?? data.status),
        next_action_status: toClosureStatus(data.next_action_status ?? data.status),
      },
    },
    { status: 200, headers: auth.response.headers }
  )
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
