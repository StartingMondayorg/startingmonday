import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { createAdminClient } from '@/lib/supabase/admin'

type Comparator = '>=' | '<='

type SnapshotRow = {
  metric_name: string
  metric_value: number | null
  metric_status: 'ok' | 'no_data' | 'query_error'
  week_end: string
  generated_at: string
}

type UserEventRow = {
  user_id: string
  event_name: string
  created_at: string
}

type WeeklyDigestUserRow = {
  id: string
  briefing_frequency: string | null
  weekly_digest_sent_at: string | null
}

type WebhookEventRow = {
  received_at: string
  processed_at: string | null
  event_status: string
}

type SloDefinition = {
  key: string
  label: string
  target: number
  comparator: Comparator
  defaultOwner: string
}

const payloadSchema = z.object({
  referenceDate: z.string().datetime().optional(),
  sloOverrides: z.record(z.string(), z.number()).optional(),
  ownerMap: z.record(z.string(), z.string()).optional(),
})

const SPRINT_KEY = 'sprint_6_emi_slo_monitoring'
const JOB_NAME = 'emi-slo-monitoring-alerts'

const SLO_DEFINITIONS: SloDefinition[] = [
  {
    key: 'assessment_flow_availability_percent',
    label: 'Assessment flow availability',
    target: 99.9,
    comparator: '>=',
    defaultOwner: 'Product Engineering',
  },
  {
    key: 'daily_loop_load_success_percent',
    label: 'Daily loop load success',
    target: 99.5,
    comparator: '>=',
    defaultOwner: 'Product Engineering',
  },
  {
    key: 'weekly_digest_generation_success_percent',
    label: 'Weekly digest generation success',
    target: 99.5,
    comparator: '>=',
    defaultOwner: 'Engineering + SRE',
  },
  {
    key: 'critical_event_ingestion_latency_p95_minutes',
    label: 'Critical event ingestion latency p95 (minutes)',
    target: 5,
    comparator: '<=',
    defaultOwner: 'Engineering + SRE',
  },
]

function cutoffIso(referenceDate?: string, days = 120): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const d = new Date(base.toISOString())
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function percentage(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return Math.round((part / whole) * 10000) / 100
}

function meetsTarget(value: number | null, target: number, comparator: Comparator): boolean {
  if (value === null) return false
  return comparator === '>=' ? value >= target : value <= target
}

function percentile95(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1))
  return Math.round(sorted[index] * 100) / 100
}

function minutesBetween(startIso: string, endIso: string): number | null {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null
  return Math.max(0, (end.getTime() - start.getTime()) / 60000)
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsed = await parseAutomationBody(request, payloadSchema)
    if (!parsed.ok) return parsed.response

    const admin = createAdminClient() as any

    const [snapshotResult, eventsResult, weeklyDigestUsersResult, webhookEventsResult] = await Promise.all([
      admin
        .from('emi_kpi_snapshots')
        .select('metric_name,metric_value,metric_status,week_end,generated_at')
        .gte('week_end', cutoffIso(parsed.body.referenceDate))
        .order('week_end', { ascending: false })
        .order('generated_at', { ascending: false })
        .limit(100),
      admin
        .from('user_events')
        .select('user_id,event_name,created_at')
        .in('event_name', ['briefing_viewed', 'emi_daily_loop_loaded'])
        .gte('created_at', cutoffIso(parsed.body.referenceDate, 14))
        .order('created_at', { ascending: false })
        .limit(200000),
      admin
        .from('users')
        .select('id,briefing_frequency,weekly_digest_sent_at')
        .eq('briefing_frequency', 'weekly')
        .limit(100000),
      admin
        .from('onboarding_video_webhook_events')
        .select('received_at,processed_at,event_status')
        .gte('received_at', cutoffIso(parsed.body.referenceDate, 30))
        .order('received_at', { ascending: false })
        .limit(5000),
    ])

    const latestByMetric = new Map<string, SnapshotRow>()
    const snapshots = Array.isArray(snapshotResult.data) ? snapshotResult.data as SnapshotRow[] : []
    for (const row of snapshots) {
      if (!latestByMetric.has(row.metric_name)) {
        latestByMetric.set(row.metric_name, row)
      }
    }

    const userEvents = Array.isArray(eventsResult.data) ? eventsResult.data as UserEventRow[] : []
    const briefingViewers = new Set(userEvents.filter((row) => row.event_name === 'briefing_viewed').map((row) => row.user_id))
    const dailyLoopLoaders = new Set(userEvents.filter((row) => row.event_name === 'emi_daily_loop_loaded').map((row) => row.user_id))

    const weeklyUsers = Array.isArray(weeklyDigestUsersResult.data) ? weeklyDigestUsersResult.data as WeeklyDigestUserRow[] : []
    const weeklyDigestFreshCutoff = new Date(parsed.body.referenceDate ?? new Date().toISOString())
    weeklyDigestFreshCutoff.setUTCDate(weeklyDigestFreshCutoff.getUTCDate() - 8)
    const weeklyDigestFreshIso = weeklyDigestFreshCutoff.toISOString()
    const weeklyDigestFreshCount = weeklyUsers.filter((row) => row.weekly_digest_sent_at && row.weekly_digest_sent_at >= weeklyDigestFreshIso).length

    const webhookEvents = Array.isArray(webhookEventsResult.data) ? webhookEventsResult.data as WebhookEventRow[] : []
    const webhookLatencies = webhookEvents
      .filter((row) => row.event_status === 'processed' && row.processed_at)
      .map((row) => minutesBetween(row.received_at, row.processed_at ?? row.received_at))
      .filter((value): value is number => value !== null)

    const derivedValues: Record<string, { value: number | null; source: string }> = {
      assessment_flow_availability_percent: {
        value: latestByMetric.get('assessment_completion_percent')?.metric_status === 'ok'
          ? Number(latestByMetric.get('assessment_completion_percent')?.metric_value ?? null)
          : null,
        source: 'emi_kpi_snapshots.assessment_completion_percent',
      },
      daily_loop_load_success_percent: {
        value: percentage(dailyLoopLoaders.size, briefingViewers.size),
        source: 'user_events(briefing_viewed,emi_daily_loop_loaded)',
      },
      weekly_digest_generation_success_percent: {
        value: percentage(weeklyDigestFreshCount, weeklyUsers.length),
        source: 'users.weekly_digest_sent_at',
      },
      critical_event_ingestion_latency_p95_minutes: {
        value: percentile95(webhookLatencies),
        source: 'onboarding_video_webhook_events(received_at,processed_at)',
      },
    }

    const sloRows = SLO_DEFINITIONS.map((definition) => {
      const overrideValue = parsed.body.sloOverrides?.[definition.key]
      const resolvedValue = typeof overrideValue === 'number' && Number.isFinite(overrideValue)
        ? overrideValue
        : derivedValues[definition.key]?.value ?? null
      const owner = parsed.body.ownerMap?.[definition.key] ?? definition.defaultOwner
      const pass = meetsTarget(resolvedValue, definition.target, definition.comparator)

      return {
        slo_key: definition.key,
        slo_label: definition.label,
        current: resolvedValue,
        target: definition.target,
        comparator: definition.comparator,
        owner,
        pass,
        status: pass ? 'Within SLO' : 'Breach',
        source: typeof overrideValue === 'number' && Number.isFinite(overrideValue)
          ? 'override'
          : derivedValues[definition.key]?.source ?? 'unavailable',
      }
    })

    const breachedRows = sloRows.filter((row) => !row.pass)
    const ownerAlerts = Array.from(breachedRows.reduce((map, row) => {
      const existing = map.get(row.owner) ?? []
      existing.push(`${row.slo_label}`)
      map.set(row.owner, existing)
      return map
    }, new Map<string, string[]>()).entries()).map(([owner, items]) => ({ owner, items }))

    if (ownerAlerts.length > 0) {
      await admin.from('automation_alerts').insert(
        ownerAlerts.map((alert) => ({
          user_id: auth.userId,
          source_table: 'scheduled_job_observability_runs',
          alert_code: 'emi_slo_owner_attention',
          severity: 'high',
          message: `EMI SLO breach for ${alert.owner}: ${alert.items.join(', ')}`,
          details: {
            sprint_key: SPRINT_KEY,
            owner: alert.owner,
            slo_items: alert.items,
          },
          status: 'open',
        })),
      )
    }

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: parsed.body.referenceDate ?? null,
      slo_rows: sloRows,
      breach_count: breachedRows.length,
      total_count: sloRows.length,
      owner_alerts: ownerAlerts,
    }

    const { data: exportRun } = await admin
      .from('emi_sprint_export_runs')
      .insert({
        user_id: auth.userId,
        sprint_key: SPRINT_KEY,
        export_payload: payload,
      })
      .select('id')
      .single()

    const status = breachedRows.length === 0 ? 'ok' : 'late'

    const { data: obsRun } = await admin
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          sprint_key: SPRINT_KEY,
          breach_count: breachedRows.length,
          total_count: sloRows.length,
          owner_alert_count: ownerAlerts.length,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      sprintKey: SPRINT_KEY,
      exportRunId: exportRun?.id ?? null,
      runId: obsRun?.id ?? null,
      status,
      payload,
    })
  } catch (error) {
    console.error('[reporting.emi-slo-monitoring-alerts] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}