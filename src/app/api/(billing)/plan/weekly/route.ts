import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/require-auth'

function getWeekStartIso(input?: string | null): string {
  const base = input ? new Date(input) : new Date()
  const date = Number.isNaN(base.getTime()) ? new Date() : base
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function normalizeActions(value: unknown): [string, string, string] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error('actions must be an array of exactly 3 items.')
  }

  const normalized = value.map((item) => (typeof item === 'string' ? item.trim() : ''))
  if (normalized.some((item) => item.length === 0)) {
    throw new Error('Each weekly action must be non-empty.')
  }

  if (normalized.some((item) => item.length > 280)) {
    throw new Error('Each weekly action must be 280 characters or fewer.')
  }

  return [normalized[0], normalized[1], normalized[2]]
}

type WeeklyPlanRow = {
  id: string
  week_start: string
  action_1: string
  action_2: string
  action_3: string
  completed_1: boolean
  completed_2: boolean
  completed_3: boolean
  reflection_notes: string | null
}

type WeeklyHistoryRow = {
  week_start: string
  action_1: string
  action_2: string
  action_3: string
  completed_1: boolean
  completed_2: boolean
  completed_3: boolean
  reflection_notes: string | null
}

function buildSuggestedActions(stats: {
  companyCount: number
  contactCount: number
  pendingFollowUpCount: number
  confirmedRelationshipCount: number
}): [string, string, string] {
  const { companyCount, contactCount, pendingFollowUpCount, confirmedRelationshipCount } = stats

  return [
    `Move one target company this week (${companyCount} tracked): add one intel update and one next follow-up action.`,
    `Advance relationship flow: confirm or activate one warm connection (${confirmedRelationshipCount} confirmed, ${contactCount} total contacts).`,
    `Close pending execution risk: complete one overdue follow-up and keep queue under control (${pendingFollowUpCount} pending).`,
  ]
}

function normalizeCompletions(value: unknown): [boolean, boolean, boolean] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error('completions must be an array of exactly 3 booleans.')
  }

  const normalized = value.map((item) => Boolean(item))
  return [normalized[0], normalized[1], normalized[2]]
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const weekStart = getWeekStartIso(searchParams.get('week_start'))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dashboard_weekly_plans' as never)
    .select('id, week_start, action_1, action_2, action_3, completed_1, completed_2, completed_3, reflection_notes')
    .eq('user_id', auth.userId)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) {
    return Response.json({ error: 'Failed to load weekly plan.' }, { status: 500 })
  }

  const row = (data as unknown as WeeklyPlanRow | null)

  const [historyRes, profileRes] = await Promise.all([
    supabase
      .from('dashboard_weekly_plans' as never)
      .select('week_start, action_1, action_2, action_3, completed_1, completed_2, completed_3, reflection_notes')
      .eq('user_id', auth.userId)
      .order('week_start', { ascending: false })
      .limit(4),
    supabase
      .from('profiles')
      .select('momentum_score')
      .eq('id', auth.userId)
      .maybeSingle(),
  ])

  const historyRows = (historyRes.data ?? []) as unknown as WeeklyHistoryRow[]
  const history = historyRows.map((item) => ({
    week_start: item.week_start,
    actions: [item.action_1, item.action_2, item.action_3],
    completions: [item.completed_1, item.completed_2, item.completed_3],
    completed_count: [item.completed_1, item.completed_2, item.completed_3].filter(Boolean).length,
    reflection_notes: item.reflection_notes ?? '',
  }))

  const momentumScore = ((profileRes.data as { momentum_score: number | null } | null)?.momentum_score) ?? null

  return Response.json({
    week_start: weekStart,
    plan_id: row?.id ?? null,
    actions: row
      ? [row.action_1, row.action_2, row.action_3]
      : ['Reach out to one warm relationship for a target role.', 'Advance one target company with a clear follow-up.', 'Close one preparation step before your next conversation.'],
    completions: row
      ? [row.completed_1, row.completed_2, row.completed_3]
      : [false, false, false],
    reflection_notes: row?.reflection_notes ?? '',
    history,
    momentum_score: momentumScore,
    is_default: !row,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  let body: { week_start?: string; actions?: string[]; completions?: boolean[]; reflection_notes?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  let actions: [string, string, string]
  let completions: [boolean, boolean, boolean]
  try {
    actions = normalizeActions(body.actions)
    completions = normalizeCompletions(body.completions ?? [false, false, false])
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid actions payload.' }, { status: 400 })
  }

  const reflectionNotes = typeof body.reflection_notes === 'string' ? body.reflection_notes.trim() : ''

  const weekStart = getWeekStartIso(body.week_start)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dashboard_weekly_plans' as never)
    .upsert({
      user_id: auth.userId,
      week_start: weekStart,
      action_1: actions[0],
      action_2: actions[1],
      action_3: actions[2],
      completed_1: completions[0],
      completed_2: completions[1],
      completed_3: completions[2],
      reflection_notes: reflectionNotes,
    } as never, { onConflict: 'user_id,week_start' })
    .select('id, week_start, action_1, action_2, action_3, completed_1, completed_2, completed_3, reflection_notes')
    .single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'plan/weekly', op: 'save', userId: auth.userId } })
    return Response.json({ error: 'Failed to save weekly plan.' }, { status: 500 })
  }

  const row = data as unknown as WeeklyPlanRow

  return Response.json({
    week_start: row.week_start,
    plan_id: row.id,
    actions: [row.action_1, row.action_2, row.action_3],
    completions: [row.completed_1, row.completed_2, row.completed_3],
    reflection_notes: row.reflection_notes ?? '',
    saved: true,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  let body: { week_start?: string; overwrite?: boolean }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const weekStart = getWeekStartIso(body.week_start)
  const overwrite = body.overwrite === true

  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from('dashboard_weekly_plans' as never)
    .select('id, week_start, action_1, action_2, action_3, completed_1, completed_2, completed_3, reflection_notes')
    .eq('user_id', auth.userId)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (existingError) {
    Sentry.captureException(existingError, { extra: { route: 'plan/weekly', op: 'regenerate-load', userId: auth.userId } })
    return Response.json({ error: 'Failed to load current plan.' }, { status: 500 })
  }

  const existingRow = existing as unknown as WeeklyPlanRow | null
  const existingActions = existingRow
    ? [existingRow.action_1, existingRow.action_2, existingRow.action_3]
    : null

  const hasExistingValues = Boolean(existingActions && existingActions.some((action) => action.trim().length > 0))

  if (hasExistingValues && !overwrite) {
    return Response.json({
      error: 'Existing weekly plan has content. Confirm overwrite to regenerate.',
      requires_overwrite: true,
      week_start: weekStart,
      existing_actions: existingActions,
    }, { status: 409 })
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  const [companiesRes, contactsRes, pendingRes, confirmedRes] = await Promise.all([
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .is('archived_at', null),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('status', 'active'),
    supabase
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .lte('due_date', todayIso),
    supabase
      .from('company_people_connection_matches' as never)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('user_confirmed', true),
  ])

  const suggestedActions = buildSuggestedActions({
    companyCount: companiesRes.count ?? 0,
    contactCount: contactsRes.count ?? 0,
    pendingFollowUpCount: pendingRes.count ?? 0,
    confirmedRelationshipCount: confirmedRes.count ?? 0,
  })

  const { data: saved, error: saveError } = await supabase
    .from('dashboard_weekly_plans' as never)
    .upsert({
      user_id: auth.userId,
      week_start: weekStart,
      action_1: suggestedActions[0],
      action_2: suggestedActions[1],
      action_3: suggestedActions[2],
      completed_1: false,
      completed_2: false,
      completed_3: false,
      reflection_notes: '',
    } as never, { onConflict: 'user_id,week_start' })
    .select('id, week_start, action_1, action_2, action_3, completed_1, completed_2, completed_3, reflection_notes')
    .single()

  if (saveError) {
    Sentry.captureException(saveError, { extra: { route: 'plan/weekly', op: 'regenerate-save', userId: auth.userId } })
    return Response.json({ error: 'Failed to regenerate weekly plan.' }, { status: 500 })
  }

  const savedRow = saved as unknown as WeeklyPlanRow

  await supabase
    .from('dashboard_weekly_plan_regeneration_logs' as never)
    .insert({
      user_id: auth.userId,
      plan_id: savedRow.id,
      week_start: weekStart,
      overwrite_applied: overwrite,
      previous_actions: existingActions,
      generated_actions: suggestedActions,
      generator: 'heuristic_v1',
    } as never)

  return Response.json({
    week_start: savedRow.week_start,
    plan_id: savedRow.id,
    actions: [savedRow.action_1, savedRow.action_2, savedRow.action_3],
    completions: [savedRow.completed_1, savedRow.completed_2, savedRow.completed_3],
    reflection_notes: savedRow.reflection_notes ?? '',
    regenerated: true,
    overwrite_applied: overwrite,
  })
}
