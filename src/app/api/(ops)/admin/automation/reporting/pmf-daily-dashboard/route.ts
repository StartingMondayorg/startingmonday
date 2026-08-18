 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { sendSlackMessage } from '@/lib/slack'

const STALE_THRESHOLD_HOURS = 26
const VALID_CONFIDENCE_BANDS = new Set(['low', 'medium', 'high', 'unknown'])

type Panel = {
  id: 'prep_usefulness' | 'confidence_distribution' | 'trust_tickets_rate' | 'first_value_within_24h'
  label: string
  value: number | null
  unit: 'percent' | 'count'
  source: string
  notes: string
}

function toPct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function hoursSince(iso: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Number(((Date.now() - then) / 3600000).toFixed(2))
}

function formatReviewNotes(referenceDateIso: string): string {
  return [
    `Weekly PMF Review (${referenceDateIso.slice(0, 10)})`,
    '- What changed in prep usefulness this week?',
    '- Which confidence band moved and why?',
    '- Any trust-ticket spikes that need product action?',
    '- Is first-value within 24h improving for new users?',
    '- Owners and next actions (Product/Data/Engineering):',
  ].join('\n')
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const nowIso = new Date().toISOString()
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    prepRatings,
    confidenceEvents,
    feedbackRows,
    onboardingStartedRows,
    firstValueRows,
  ] = await Promise.all([
    sb
      .from('briefs')
      .select('id,user_rating,created_at')
      .eq('user_id', userId)
      .eq('type', 'prep')
      .gte('created_at', sinceIso),
    sb
      .from('user_events')
      .select('event_name,created_at,properties')
      .eq('user_id', userId)
      .in('event_name', [PMF_EVENTS.prep.prep_brief_generated, PMF_EVENTS.prep.prep_brief_refined])
      .gte('created_at', sinceIso),
    sb
      .from('feedback_items')
      .select('id,title,body,created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceIso),
    sb
      .from('user_events')
      .select('user_id,created_at')
      .eq('user_id', userId)
      .eq('event_name', 'onboarding_started')
      .gte('created_at', sinceIso),
    sb
      .from('user_events')
      .select('user_id,created_at,properties')
      .eq('user_id', userId)
      .eq('event_name', 'onboarding_first_value_ready')
      .gte('created_at', sinceIso),
  ])

  const prepRows = (prepRatings.data ?? []) as Array<{ user_rating: number | null; created_at: string }>
  const confidenceRows = (confidenceEvents.data ?? []) as Array<{ created_at: string; properties: Record<string, unknown> | null }>
  const feedbackItems = (feedbackRows.data ?? []) as Array<{ title: string | null; body: string | null; created_at: string }>
  const startedRows = (onboardingStartedRows.data ?? []) as Array<{ user_id: string; created_at: string }>
  const firstValueEventRows = (firstValueRows.data ?? []) as Array<{ user_id: string; created_at: string; properties: Record<string, unknown> | null }>

  const ratedCount = prepRows.filter((row) => row.user_rating === 1 || row.user_rating === -1).length
  const usefulCount = prepRows.filter((row) => row.user_rating === 1).length
  const prepUsefulness = toPct(usefulCount, ratedCount)

  const confidenceDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    unknown: 0,
  }
  let malformedConfidenceEvents = 0

  for (const row of confidenceRows) {
    const rawBand = String(row.properties?.confidence_band ?? '').trim().toLowerCase()
    if (!VALID_CONFIDENCE_BANDS.has(rawBand)) {
      malformedConfidenceEvents += 1
      confidenceDistribution.unknown += 1
      continue
    }
    confidenceDistribution[rawBand as keyof typeof confidenceDistribution] += 1
  }

  const totalConfidenceEvents = confidenceRows.length
  const confidencePanels = {
    low_pct: toPct(confidenceDistribution.low, totalConfidenceEvents),
    medium_pct: toPct(confidenceDistribution.medium, totalConfidenceEvents),
    high_pct: toPct(confidenceDistribution.high, totalConfidenceEvents),
    unknown_pct: toPct(confidenceDistribution.unknown, totalConfidenceEvents),
  }

  const trustRegex = /(trust|confidence|provenance|accuracy|hallucination)/i
  const trustTicketCount = feedbackItems.filter((item) => trustRegex.test(`${item.title ?? ''} ${item.body ?? ''}`)).length
  const trustTicketRate = toPct(trustTicketCount, feedbackItems.length)

  const startedUsers = new Set(startedRows.map((row) => row.user_id))
  const firstValueWithin24h = firstValueEventRows.filter((row) => {
    const elapsedSeconds = Number(row.properties?.elapsed_seconds ?? NaN)
    if (Number.isFinite(elapsedSeconds)) return elapsedSeconds <= 86400
    return true
  })
  const firstValueRate = toPct(firstValueWithin24h.length, startedUsers.size)

  const latestTimestamps = {
    prepRatings: prepRows.reduce<string | null>((latest, row) => (!latest || row.created_at > latest ? row.created_at : latest), null),
    confidenceEvents: confidenceRows.reduce<string | null>((latest, row) => (!latest || row.created_at > latest ? row.created_at : latest), null),
    feedbackItems: feedbackItems.reduce<string | null>((latest, row) => (!latest || row.created_at > latest ? row.created_at : latest), null),
    onboarding: firstValueEventRows.reduce<string | null>((latest, row) => (!latest || row.created_at > latest ? row.created_at : latest), null),
  }

  const staleSignals = Object.entries(latestTimestamps)
    .map(([source, iso]) => ({ source, hours: hoursSince(iso) }))
    .filter((entry) => entry.hours !== null && entry.hours > STALE_THRESHOLD_HOURS)

  const panels: Panel[] = [
    {
      id: 'prep_usefulness',
      label: 'Prep usefulness',
      value: prepUsefulness,
      unit: 'percent',
      source: 'briefs.user_rating',
      notes: `Rated briefs=${ratedCount}`,
    },
    {
      id: 'confidence_distribution',
      label: 'Confidence distribution',
      value: confidencePanels.high_pct,
      unit: 'percent',
      source: 'user_events (pmf_prep_brief_generated/refined)',
      notes: `high=${confidencePanels.high_pct}% medium=${confidencePanels.medium_pct}% low=${confidencePanels.low_pct}% unknown=${confidencePanels.unknown_pct}%`,
    },
    {
      id: 'trust_tickets_rate',
      label: 'Trust tickets rate',
      value: trustTicketRate,
      unit: 'percent',
      source: 'feedback_items',
      notes: `trust_tickets=${trustTicketCount};total_feedback=${feedbackItems.length}`,
    },
    {
      id: 'first_value_within_24h',
      label: 'First-value event within 24h',
      value: firstValueRate,
      unit: 'percent',
      source: 'user_events (onboarding_started/onboarding_first_value_ready)',
      notes: `started_users=${startedUsers.size};first_value_events=${firstValueWithin24h.length}`,
    },
  ]

  const panelIds = new Set(panels.map((panel) => panel.id))
  const expectedPanels: Panel['id'][] = ['prep_usefulness', 'confidence_distribution', 'trust_tickets_rate', 'first_value_within_24h']
  const missingPanels = expectedPanels.filter((id) => !panelIds.has(id))

  const qa = {
    staleData: staleSignals,
    malformedData: {
      malformedConfidenceEvents,
    },
    missingPanels,
    status: staleSignals.length === 0 && malformedConfidenceEvents === 0 && missingPanels.length === 0 ? 'ok' : 'alert',
  } as const

  let alertInserted = false
  let slackNotified = false
  if (qa.status === 'alert') {
    const alertMessage = [
      'PMF dashboard QA alert',
      `missing_panels=${missingPanels.join(',') || 'none'}`,
      `stale_sources=${staleSignals.map((signal) => signal.source).join(',') || 'none'}`,
      `malformed_confidence_events=${malformedConfidenceEvents}`,
    ].join(' | ')

    const existing = await sb
      .from('automation_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('source_table', 'user_events')
      .eq('alert_code', 'pmf_dashboard_qa_alert')
      .eq('status', 'open')
      .maybeSingle()

    if (!existing.data?.id) {
      const inserted = await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'user_events',
        alert_code: 'pmf_dashboard_qa_alert',
        severity: 'high',
        message: alertMessage,
        status: 'open',
      })
      if (!inserted.error) {
        alertInserted = true
        const slack = await sendSlackMessage({ text: alertMessage })
        slackNotified = slack.ok
      }
    }
  }

  return NextResponse.json({
    ok: true,
    generatedAt: nowIso,
    refreshCadence: 'daily',
    dashboard: {
      link: '/api/admin/automation/reporting/pmf-daily-dashboard',
      sharedWith: ['product', 'data', 'engineering'],
      panels,
      confidenceBreakdown: confidencePanels,
      qa,
    },
    weeklyReview: {
      sharedDashboardLink: '/api/admin/automation/reporting/pmf-daily-dashboard',
      notesTemplate: formatReviewNotes(nowIso),
    },
    alerts: {
      inserted: alertInserted,
      slackNotified,
    },
  })
}
