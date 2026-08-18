import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { sendSlackMessage } from '@/lib/slack'

const SOURCE_TABLE = 'user_events'
const ALERT_CODE = 'pmf_missing_events_24h'

const CRITICAL_EVENTS = [
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_first_value_ready',
  PMF_EVENTS.prep.prep_brief_generated,
  PMF_EVENTS.prep.prep_brief_refined,
  PMF_EVENTS.prep.prep_brief_reviewed,
  PMF_EVENTS.prep.prep_low_confidence_seen,
  PMF_EVENTS.prep.prep_export_word,
  PMF_EVENTS.prep.prep_export_pdf,
] as const

function buildAlertMessage(missingEvents: string[], windowHours: number) {
  return `PMF monitor: missing critical events in last ${windowHours}h: ${missingEvents.join(', ')}`
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const windowHours = Number.parseInt(request.nextUrl.searchParams.get('windowHours') ?? '24', 10)
  const effectiveWindowHours = Number.isFinite(windowHours) && windowHours > 0 ? Math.min(windowHours, 168) : 24
  const sinceIso = new Date(Date.now() - effectiveWindowHours * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await sb
    .from('user_events')
    .select('event_name')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .in('event_name', [...CRITICAL_EVENTS])

  if (error) {
    return NextResponse.json({ error: 'Failed to read PMF events' }, { status: 500 })
  }

  const counts = Object.fromEntries(CRITICAL_EVENTS.map((eventName) => [eventName, 0])) as Record<string, number>
  for (const row of rows ?? []) {
    const eventName = String((row as { event_name?: string }).event_name ?? '')
    if (eventName in counts) counts[eventName] += 1
  }

  const missingEvents = Object.entries(counts)
    .filter(([, count]) => count === 0)
    .map(([eventName]) => eventName)

  let alertInserted = false
  let slackNotified = false

  if (missingEvents.length > 0) {
    const { data: existingOpen } = await sb
      .from('automation_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('source_table', SOURCE_TABLE)
      .eq('alert_code', ALERT_CODE)
      .eq('status', 'open')
      .maybeSingle()

    if (!existingOpen?.id) {
      const message = buildAlertMessage(missingEvents, effectiveWindowHours)
      const { error: insertError } = await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: SOURCE_TABLE,
        alert_code: ALERT_CODE,
        severity: 'high',
        message,
        status: 'open',
      })

      if (!insertError) {
        alertInserted = true
        const slack = await sendSlackMessage({ text: message })
        slackNotified = slack.ok
      }
    }
  }

  return NextResponse.json({
    ok: true,
    windowHours: effectiveWindowHours,
    criticalEvents: CRITICAL_EVENTS,
    counts,
    missingEvents,
    alerts: {
      inserted: alertInserted,
      slackNotified,
    },
  })
}
