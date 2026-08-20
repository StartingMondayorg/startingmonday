 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

type FollowUpRow = {
  id: string
  user_id: string
  action: string
  status: string | null
  next_action_status: string | null
  next_action_owner: string | null
  created_at: string | null
  updated_at: string | null
}

const VALID_CLOSURE_STATUSES = new Set(['open', 'in_progress', 'completed'])

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function toHours(startIso: string | null, endIso: string | null): number | null {
  if (!startIso || !endIso) return null
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
  return Number(((end - start) / 3_600_000).toFixed(2))
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1))
  return Number(sorted[index].toFixed(2))
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const body = await request.json().catch(() => ({}))

    const referenceDate = typeof body.referenceDate === 'string' ? new Date(body.referenceDate) : new Date()
    const endDate = Number.isNaN(referenceDate.getTime()) ? new Date() : referenceDate
    const startDate = new Date(endDate.getTime() - 30 * 86_400_000)

    const startIso = `${dateKey(startDate)}T00:00:00.000Z`
    const endIso = `${dateKey(endDate)}T23:59:59.999Z`

    const followUpsRes = await sb
      .from('follow_ups')
      .select('id,user_id,action,status,next_action_status,next_action_owner,created_at,updated_at')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .limit(200000)

    const rows = (followUpsRes.data ?? []) as FollowUpRow[]
    const scoped = rows.filter((row) => (row.action ?? '').toLowerCase().includes('session') || row.next_action_status)

    const completed = scoped.filter((row) => row.next_action_status === 'completed' || row.status === 'done' || row.status === 'completed')
    const unassigned = scoped.filter((row) => !row.next_action_owner || row.next_action_owner.trim().length === 0)
    const total = scoped.length

    const closureCompletion = total > 0 ? Number(((completed.length / total) * 100).toFixed(2)) : 0
    const unassignedRate = total > 0 ? Number(((unassigned.length / total) * 100).toFixed(2)) : 0
    const timeToCloseHours = completed
      .map((row) => toHours(row.created_at, row.updated_at))
      .filter((value): value is number => value !== null)

    const invalidStatusRows = scoped.filter((row) => {
      const status = row.next_action_status
      if (!status) return true
      return !VALID_CLOSURE_STATUSES.has(status)
    })

    const runPayload = {
      ticket: 'PB-Q1-012',
      generated_at: new Date().toISOString(),
      window: {
        start: startIso,
        end: endIso,
      },
      metrics: {
        closure_completion_rate: closureCompletion,
        unassigned_action_rate: unassignedRate,
        time_to_close_hours: {
          p50: percentile(timeToCloseHours, 50),
          p90: percentile(timeToCloseHours, 90),
          sample_size: timeToCloseHours.length,
        },
      },
      qa_monitor: {
        missing_or_invalid_closure_events: invalidStatusRows.length,
        valid_statuses: Array.from(VALID_CLOSURE_STATUSES),
        sample_invalid_rows: invalidStatusRows.slice(0, 10).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          next_action_status: row.next_action_status,
          status: row.status,
        })),
      },
      dashboard: {
        cadence: 'daily',
        recommended_cron_utc: '0 8 * * *',
        refresh_route: '/api/admin/automation/reporting/session-closure-monitor',
      },
    }

    await sb.from('trend_report_runs').insert({
      user_id: userId,
      trend_payload: runPayload,
    })

    if (invalidStatusRows.length > 0) {
      await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'follow_ups',
        alert_code: 'session_closure_invalid_events',
        severity: 'high',
        message: `Session closure monitor found ${invalidStatusRows.length} missing/invalid closure events.`,
        status: 'open',
      })
    }

    if (closureCompletion < 75 && total > 0) {
      await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'follow_ups',
        alert_code: 'session_closure_completion_below_target',
        severity: 'medium',
        message: `Session closure completion ${closureCompletion}% is below target (75%).`,
        status: 'open',
      })
    }

    return NextResponse.json({
      ok: true,
      ticket: 'PB-Q1-012',
      run: runPayload,
    })
  } catch (error) {
    console.error('[reporting.session-closure-monitor] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}