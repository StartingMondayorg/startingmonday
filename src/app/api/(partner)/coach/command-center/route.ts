/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccessFeature, getUserSubscription } from '@/lib/subscription'

type UrgencyBand = 'high' | 'medium' | 'low'

type RiskInputs = {
  momentum_score: number | null
  overdue_actions: number
  days_since_activity: number
  active_pipeline_companies: number
}

type WeeklyReviewSummary = {
  week_start: string
  confidence_level: string | null
  momentum_level: string | null
  narrative_drift: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function dayDiff(fromIso: string | null, now: Date): number {
  if (!fromIso) return 999
  const deltaMs = now.getTime() - new Date(fromIso).getTime()
  return Math.max(0, Math.floor(deltaMs / 86_400_000))
}

function computeRiskScore(inputs: RiskInputs): number {
  let score = 0

  if (inputs.momentum_score === null) score += 20
  else if (inputs.momentum_score < 40) score += 35
  else if (inputs.momentum_score < 60) score += 20

  if (inputs.overdue_actions > 0) {
    score += clamp(inputs.overdue_actions * 8, 8, 30)
  }

  if (inputs.days_since_activity >= 7) score += 20
  else if (inputs.days_since_activity >= 3) score += 10

  if (inputs.active_pipeline_companies === 0) score += 15

  return clamp(score, 0, 100)
}

function urgencyBand(score: number): UrgencyBand {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export async function GET(request: NextRequest) {
  try {
    const startedAt = Date.now()
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const { userId } = auth
    const supabase = await createClient()
    const sub = await getUserSubscription(userId, supabase)
    if (!canAccessFeature(sub, 'coach_dashboard')) {
      return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
    }

    const query = request.nextUrl.searchParams
    const page = Math.max(1, Number(query.get('page') ?? 1))
    const pageSize = clamp(Number(query.get('pageSize') ?? 25), 10, 50)

    const { data: seats, error: seatsError } = await supabase
      .from('team_seats')
      .select('member_user_id, member_email, accepted_at')
      .eq('owner_id', userId)
      .eq('status', 'accepted')

    if (seatsError) {
      return NextResponse.json({ error: 'Failed to load command center seats' }, { status: 500 })
    }

    const allClientIds = (seats ?? []).map((seat) => seat.member_user_id).filter(Boolean) as string[]
    const totalClients = allClientIds.length
    const totalPages = Math.max(1, Math.ceil(totalClients / pageSize))
    const normalizedPage = Math.min(page, totalPages)
    const startIndex = (normalizedPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const clientIds = allClientIds.slice(startIndex, endIndex)
    if (totalClients === 0) {
      return NextResponse.json({
        ok: true,
        ticket: 'PB-Q1-007',
        generated_at: new Date().toISOString(),
        portfolio: {
          total_clients: 0,
          urgency: { high: 0, medium: 0, low: 0 },
          average_risk_score: 0,
          stale_clients: 0,
        },
        clients: [],
        risk_scoring_inputs: [
          'momentum_score',
          'overdue_actions',
          'days_since_activity',
          'active_pipeline_companies',
        ],
        freshness_sla: {
          max_lag_hours: 48,
          alert_threshold_days: 2,
        },
        pagination: {
          page: 1,
          page_size: pageSize,
          total_clients: 0,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      })
    }

    const admin = createAdminClient()
    const adminAny = admin as any
    const now = new Date()
    const since60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const [profilesRes, companiesRes, followUpsRes, eventsRes, weeklyReviewsRes] = await Promise.all([
      admin
        .from('user_profiles')
        .select('user_id, full_name, momentum_score, search_persona')
        .in('user_id', clientIds),
      admin
        .from('companies')
        .select('user_id, stage')
        .in('user_id', clientIds)
        .is('archived_at', null),
      admin
        .from('follow_ups')
        .select('user_id, action, due_date, next_action_due_date, next_action_owner, next_action_status, status')
        .in('user_id', clientIds)
        .eq('status', 'pending')
        .order('due_date', { ascending: true }),
      admin
        .from('user_events')
        .select('user_id, created_at')
        .in('user_id', clientIds)
        .gte('created_at', since60d)
        .order('created_at', { ascending: false })
        .limit(50000),
      admin
        .from('coach_weekly_reviews')
        .select('client_id, week_start, review_answers')
        .eq('coach_id', userId)
        .in('client_id', clientIds)
        .order('week_start', { ascending: false })
        .limit(500),
    ])

    const profiles = profilesRes.data ?? []
    const companies = companiesRes.data ?? []
    const followUps = followUpsRes.data ?? []
    const events = eventsRes.data ?? []
    const weeklyReviews = weeklyReviewsRes.data ?? []

    const profileMap = new Map(profiles.map((row) => [row.user_id, row]))
    const seatMetaMap = new Map((seats ?? []).map((seat) => [seat.member_user_id ?? '', seat]))
    const activeCompanyCount = new Map<string, number>()
    const overdueActionCount = new Map<string, number>()
    const nextActionMap = new Map<string, {
      action: string | null
      due_date: string | null
      owner: string | null
      status: string | null
    }>()
    const weeklyReviewMap = new Map<string, WeeklyReviewSummary>()
    const lastActivityMap = new Map<string, string>()

    for (const row of companies) {
      if (!row.user_id) continue
      if (!['applied', 'interviewing', 'offer'].includes(row.stage ?? '')) continue
      activeCompanyCount.set(row.user_id, (activeCompanyCount.get(row.user_id) ?? 0) + 1)
    }

    const todayKey = now.toISOString().slice(0, 10)
    for (const row of followUps) {
      if (!row.user_id) continue
      overdueActionCount.set(row.user_id, (overdueActionCount.get(row.user_id) ?? 0) + 1)

      if (!nextActionMap.has(row.user_id)) {
        nextActionMap.set(row.user_id, {
          action: row.action ?? null,
          due_date: row.next_action_due_date ?? row.due_date ?? null,
          owner: row.next_action_owner ?? null,
          status: row.next_action_status ?? row.status ?? null,
        })
      }

      const due = row.next_action_due_date ?? row.due_date
      if (due && due >= todayKey && due < (nextActionMap.get(row.user_id)?.due_date ?? '9999-12-31')) {
        nextActionMap.set(row.user_id, {
          action: row.action ?? null,
          due_date: due,
          owner: row.next_action_owner ?? null,
          status: row.next_action_status ?? row.status ?? null,
        })
      }
    }

    for (const row of events) {
      if (!row.user_id || !row.created_at) continue
      if (!lastActivityMap.has(row.user_id)) {
        lastActivityMap.set(row.user_id, row.created_at)
      }
    }

    for (const row of weeklyReviews) {
      if (!row.client_id || weeklyReviewMap.has(row.client_id)) continue

      const answers = row.review_answers && typeof row.review_answers === 'object'
        ? row.review_answers as Record<string, unknown>
        : {}

      const confidenceLevel = typeof answers.confidence_level === 'string'
        ? answers.confidence_level
        : null
      const momentumLevel = typeof answers.momentum_level === 'string'
        ? answers.momentum_level
        : null
      const narrativeDriftText = typeof answers.narrative_drift === 'string'
        ? answers.narrative_drift.trim()
        : ''

      weeklyReviewMap.set(row.client_id, {
        week_start: row.week_start,
        confidence_level: confidenceLevel,
        momentum_level: momentumLevel,
        narrative_drift: narrativeDriftText.length > 0,
      })
    }

    const clients = clientIds.map((clientId) => {
      const profile = profileMap.get(clientId)
      const seatMeta = seatMetaMap.get(clientId)
      const inputs: RiskInputs = {
        momentum_score: profile?.momentum_score ?? null,
        overdue_actions: overdueActionCount.get(clientId) ?? 0,
        days_since_activity: dayDiff(lastActivityMap.get(clientId) ?? null, now),
        active_pipeline_companies: activeCompanyCount.get(clientId) ?? 0,
      }

      const score = computeRiskScore(inputs)
      const urgency = urgencyBand(score)
      const nextAction = nextActionMap.get(clientId) ?? null

      return {
        user_id: clientId,
        name: profile?.full_name ?? null,
        email: seatMeta?.member_email ?? null,
        persona: profile?.search_persona ?? null,
        accepted_at: seatMeta?.accepted_at ?? null,
        last_activity_at: lastActivityMap.get(clientId) ?? null,
        risk_score: score,
        urgency,
        risk_inputs: inputs,
        next_action: nextAction,
        weekly_review_summary: weeklyReviewMap.get(clientId) ?? null,
      }
    })

    const urgencyCounts = {
      high: clients.filter((row) => row.urgency === 'high').length,
      medium: clients.filter((row) => row.urgency === 'medium').length,
      low: clients.filter((row) => row.urgency === 'low').length,
    }

    const staleClients = clients.filter((row) => row.risk_inputs.days_since_activity > 2)
    const averageRisk = clients.length > 0
      ? Number((clients.reduce((sum, row) => sum + row.risk_score, 0) / clients.length).toFixed(2))
      : 0

    const upcomingSessions = clients
      .filter((row) => Boolean(row.next_action?.due_date))
      .map((row) => ({
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        scheduled_for: row.next_action?.due_date,
        owner: row.next_action?.owner ?? null,
        action: row.next_action?.action ?? null,
        urgency: row.urgency,
      }))
      .filter((row) => Boolean(row.scheduled_for && row.scheduled_for >= todayKey))
      .sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))
      .slice(0, 12)

    if (staleClients.length > 0) {
      await adminAny.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'user_events',
        alert_code: 'coach_command_center_data_lag',
        severity: 'medium',
        message: `Coach command center lag: ${staleClients.length} clients have activity lag greater than 2 days.`,
        status: 'open',
      })
    }

    return NextResponse.json({
      ok: true,
      ticket: 'PB-Q1-009',
      generated_at: now.toISOString(),
      compute_schedule: {
        cadence: 'daily',
        recommended_cron_utc: '0 7 * * *',
        supports_clients_per_coach: 50,
      },
      risk_scoring_inputs: [
        'momentum_score',
        'overdue_actions',
        'days_since_activity',
        'active_pipeline_companies',
      ],
      risk_scoring_formula: {
        momentum_bands: {
          null: 20,
          below_40: 35,
          below_60: 20,
        },
        overdue_actions_weight: 'min(max(overdue_actions * 8, 8), 30)',
        activity_lag_weight: {
          at_least_7_days: 20,
          at_least_3_days: 10,
        },
        no_active_pipeline_bonus: 15,
        score_bounds: [0, 100],
      },
      freshness_sla: {
        max_lag_hours: 48,
        alert_threshold_days: 2,
        stale_clients: staleClients.length,
      },
      pagination: {
        page: normalizedPage,
        page_size: pageSize,
        total_clients: totalClients,
        total_pages: totalPages,
        has_next: normalizedPage < totalPages,
        has_previous: normalizedPage > 1,
      },
      monitoring: {
        route: '/api/coach/command-center',
        budget_ms: 900,
        fetch_ms: Date.now() - startedAt,
        payload_clients: clients.length,
        payload_sessions: upcomingSessions.length,
      },
      portfolio: {
        total_clients: totalClients,
        urgency: urgencyCounts,
        average_risk_score: averageRisk,
      },
      upcoming_sessions: upcomingSessions,
      clients,
    })
  } catch (error) {
    console.error('[coach.command-center] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}