import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

type ScoreValue = 'clear' | 'partial' | 'vague'

type DebriefPayload = {
  meetingName?: unknown
  meetingDate?: unknown
  interviewerName?: unknown
  interviewStage?: unknown
  coreAnswers?: unknown
  stageAnswers?: unknown
  stageScores?: unknown
  overallReview?: unknown
}

type DebriefDeletePayload = {
  ids?: unknown
}

type DebriefRow = {
  id: string
  meeting_name: string
  meeting_date: string
  interviewer_name: string | null
  interview_stage: string | null
  core_answers: Record<string, string>
  stage_answers: Record<string, string>
  stage_scores: Record<string, ScoreValue>
  overall_review: string | null
  vague_count: number
  risk_flag: boolean
  created_at: string
}

function asTrimmed(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

function asAnswerMap(value: unknown, maxItems: number, maxValueLen: number): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(out).length >= maxItems) break
    if (typeof raw !== 'string') continue
    const cleanedKey = key.trim().slice(0, 120)
    const cleanedValue = raw.trim().slice(0, maxValueLen)
    if (!cleanedKey || !cleanedValue) continue
    out[cleanedKey] = cleanedValue
  }
  return out
}

function asScoreMap(value: unknown, maxItems: number): Record<string, ScoreValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, ScoreValue> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(out).length >= maxItems) break
    if (raw !== 'clear' && raw !== 'partial' && raw !== 'vague') continue
    const cleanedKey = key.trim().slice(0, 120)
    if (!cleanedKey) continue
    out[cleanedKey] = raw
  }
  return out
}

function buildInterviewerConsistency(rows: DebriefRow[]) {
  const grouped = new Map<string, DebriefRow[]>()

  for (const row of rows) {
    const interviewer = (row.interviewer_name ?? '').trim()
    if (!interviewer) continue
    const existing = grouped.get(interviewer) ?? []
    existing.push(row)
    grouped.set(interviewer, existing)
  }

  return [...grouped.entries()]
    .map(([interviewer, entries]) => {
      const meetings = entries.length
      const avgVagueCount = meetings > 0
        ? Number((entries.reduce((sum, entry) => sum + (entry.vague_count ?? 0), 0) / meetings).toFixed(2))
        : 0
      const riskFlagRate = meetings > 0
        ? Number((entries.filter((entry) => entry.risk_flag).length / meetings).toFixed(2))
        : 0
      const latestMeetingDate = entries
        .map((entry) => entry.meeting_date)
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null

      const consistencySignal = avgVagueCount >= 2 || riskFlagRate >= 0.5
        ? 'high-risk'
        : avgVagueCount >= 1 || riskFlagRate >= 0.25
          ? 'mixed'
          : 'stable'

      return {
        interviewer,
        meetings,
        avgVagueCount,
        riskFlagRate,
        latestMeetingDate,
        consistencySignal,
      }
    })
    .sort((a, b) => b.meetings - a.meetings)
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const limitRaw = Number(request.nextUrl.searchParams.get('limit') ?? '40')
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.round(limitRaw), 1), 200)
    : 40

  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await db
    .from('meeting_debriefs')
    .select('id, meeting_name, meeting_date, interviewer_name, interview_stage, core_answers, stage_answers, stage_scores, overall_review, vague_count, risk_flag, created_at')
    .eq('user_id', auth.userId)
    .order('meeting_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return withAuthCookies(
      NextResponse.json({ error: 'Failed to load debrief history' }, { status: 500 }),
      auth,
    )
  }

  const rows = (data ?? []) as DebriefRow[]
  const interviewerConsistency = buildInterviewerConsistency(rows)

  return withAuthCookies(
    NextResponse.json({ ok: true, items: rows, interviewerConsistency }),
    auth,
  )
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as DebriefPayload | null
  if (!body) {
    return withAuthCookies(
      NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
      auth,
    )
  }

  const meetingName = asTrimmed(body.meetingName, 200)
  const meetingDate = asTrimmed(body.meetingDate, 20)
  const interviewerName = asTrimmed(body.interviewerName, 200)
  const interviewStage = asTrimmed(body.interviewStage, 120)
  const overallReview = asTrimmed(body.overallReview, 4000)

  if (!meetingName) {
    return withAuthCookies(
      NextResponse.json({ error: 'Meeting name is required' }, { status: 400 }),
      auth,
    )
  }

  if (!meetingDate || Number.isNaN(Date.parse(meetingDate))) {
    return withAuthCookies(
      NextResponse.json({ error: 'Meeting date is required' }, { status: 400 }),
      auth,
    )
  }

  const coreAnswers = asAnswerMap(body.coreAnswers, 20, 2500)
  const stageAnswers = asAnswerMap(body.stageAnswers, 40, 2500)
  const stageScores = asScoreMap(body.stageScores, 40)
  const vagueCount = Object.values(stageScores).filter((value) => value === 'vague').length
  const riskFlag = vagueCount >= 2

  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await db
    .from('meeting_debriefs')
    .insert({
      user_id: auth.userId,
      meeting_name: meetingName,
      meeting_date: meetingDate,
      interviewer_name: interviewerName || null,
      interview_stage: interviewStage || null,
      core_answers: coreAnswers,
      stage_answers: stageAnswers,
      stage_scores: stageScores,
      overall_review: overallReview || null,
      vague_count: vagueCount,
      risk_flag: riskFlag,
    })
    .select('id, meeting_name, meeting_date, interviewer_name, interview_stage, core_answers, stage_answers, stage_scores, overall_review, vague_count, risk_flag, created_at')
    .single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'meetings/debrief', op: 'save', userId: auth.userId } })
    return withAuthCookies(
      NextResponse.json({ error: 'Failed to save debrief' }, { status: 500 }),
      auth,
    )
  }

  return withAuthCookies(
    NextResponse.json({ ok: true, item: data }),
    auth,
  )
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as DebriefDeletePayload | null
  const idsRaw = Array.isArray(body?.ids) ? body?.ids : []
  const ids = idsRaw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 50)

  if (ids.length === 0) {
    return withAuthCookies(
      NextResponse.json({ error: 'At least one debrief id is required' }, { status: 400 }),
      auth,
    )
  }

  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await db
    .from('meeting_debriefs')
    .delete()
    .in('id', ids)
    .eq('user_id', auth.userId)
    .select('id')

  if (error) {
    Sentry.captureException(error, { extra: { route: 'meetings/debrief', op: 'delete', userId: auth.userId } })
    return withAuthCookies(
      NextResponse.json({ error: 'Failed to delete debriefs' }, { status: 500 }),
      auth,
    )
  }

  return withAuthCookies(
    NextResponse.json({ ok: true, deletedIds: (data ?? []).map((row: { id: string }) => row.id) }),
    auth,
  )
}
