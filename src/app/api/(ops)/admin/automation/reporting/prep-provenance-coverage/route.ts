 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { sendSlackMessage } from '@/lib/slack'

const COVERAGE_ALERT_THRESHOLD = 95

function toPct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function weekStartIso(referenceDate: Date): string {
  const day = referenceDate.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const monday = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() - diffToMonday))
  return monday.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const lookbackDaysRaw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '7', 10)
  const lookbackDays = Number.isFinite(lookbackDaysRaw) && lookbackDaysRaw > 0 ? Math.min(lookbackDaysRaw, 90) : 7
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: prepRows, error } = await sb
    .from('briefs')
    .select('id,created_at,claim_provenance')
    .eq('user_id', userId)
    .eq('type', 'prep')
    .gte('created_at', sinceIso)

  if (error) {
    return NextResponse.json({ error: 'Failed to compute provenance coverage' }, { status: 500 })
  }

  const rows = (prepRows ?? []) as Array<{ id: string; created_at: string; claim_provenance: unknown }>
  const totalPreps = rows.length
  const withProvenance = rows.filter((row) => Array.isArray(row.claim_provenance) && row.claim_provenance.length > 0)
  const coveragePct = toPct(withProvenance.length, totalPreps)

  const latestMissing = rows
    .filter((row) => !Array.isArray(row.claim_provenance) || row.claim_provenance.length === 0)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 10)

  const belowThreshold = coveragePct < COVERAGE_ALERT_THRESHOLD
  let alertInserted = false
  let reportDistributed = false

  const summaryLine = `Prep provenance coverage (${lookbackDays}d): ${coveragePct}% (${withProvenance.length}/${totalPreps})`
  const report = [
    'Prep provenance weekly coverage report',
    summaryLine,
    `Threshold: ${COVERAGE_ALERT_THRESHOLD}%`,
    `Week start: ${weekStartIso(new Date())}`,
    `Missing sample IDs: ${latestMissing.map((row) => row.id).join(', ') || 'none'}`,
  ].join('\n')

  if (belowThreshold) {
    const existing = await sb
      .from('automation_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('source_table', 'briefs')
      .eq('alert_code', 'prep_provenance_coverage_below_95')
      .eq('status', 'open')
      .maybeSingle()

    if (!existing.data?.id) {
      const insert = await sb.from('automation_alerts').insert({
        user_id: userId,
        source_table: 'briefs',
        alert_code: 'prep_provenance_coverage_below_95',
        severity: 'high',
        message: `${summaryLine}. Coverage below ${COVERAGE_ALERT_THRESHOLD}% threshold.`,
        status: 'open',
      })
      if (!insert.error) alertInserted = true
    }
  }

  const slack = await sendSlackMessage({ text: report })
  reportDistributed = slack.ok

  return NextResponse.json({
    ok: true,
    lookbackDays,
    generatedAt: new Date().toISOString(),
    summary: {
      totalPreps,
      withProvenance: withProvenance.length,
      coveragePct,
      thresholdPct: COVERAGE_ALERT_THRESHOLD,
      belowThreshold,
    },
    latestMissing: latestMissing.map((row) => ({ id: row.id, created_at: row.created_at })),
    alerts: {
      inserted: alertInserted,
    },
    distribution: {
      channel: 'slack',
      sent: reportDistributed,
    },
  })
}
