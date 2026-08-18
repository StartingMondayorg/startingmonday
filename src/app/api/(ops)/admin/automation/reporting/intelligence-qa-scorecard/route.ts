/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { rankSignals } from '@/lib/intelligence-quality'

type SignalRow = {
  id: string
  user_id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  source_url: string | null
  source_kind: string | null
  confidence: number | null
  focus_tags: string[] | null
  profile_channel: string | null
  profile_persona: string | null
  relevance_score: number | null
}

type ProfileRow = {
  user_id: string
  role_type: string | null
  search_persona: string | null
}

function weekStartIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const day = base.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday))
  return start.toISOString().slice(0, 10)
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({})) as { referenceDate?: string }
  const weekStart = weekStartIso(body.referenceDate)
  const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`)
  const weekEnd = new Date(weekStartDate.getTime() + 7 * 86400000).toISOString()

  const admin = createAdminClient() as any

  const [{ data: rawSignals }, { data: rawProfiles }] = await Promise.all([
    admin
      .from('company_signals')
      .select('id, user_id, signal_type, signal_summary, signal_date, source_url, source_kind, confidence, focus_tags, profile_channel, profile_persona, relevance_score')
      .gte('created_at', `${weekStart}T00:00:00.000Z`)
      .lt('created_at', weekEnd)
      .limit(50000),
    admin
      .from('user_profiles')
      .select('user_id, role_type, search_persona')
      .limit(50000),
  ])

  const signals = (rawSignals ?? []) as SignalRow[]
  const profiles = (rawProfiles ?? []) as ProfileRow[]

  const profileByUserId = new Map<string, ProfileRow>()
  for (const profile of profiles) profileByUserId.set(profile.user_id, profile)

  let sourcePresent = 0
  let confidencePresent = 0
  let staleCount = 0
  let falsePositiveProxyCount = 0

  const bySourceKind = new Map<string, number>()
  const byChannel = new Map<string, number>()

  const ranked = rankSignals(
    signals.map((signal) => ({
      ...signal,
      source_kind: signal.source_kind ?? 'unknown',
      profile_channel: signal.profile_channel,
      profile_persona: signal.profile_persona,
      confidence: signal.confidence,
      focus_tags: signal.focus_tags,
      source_url: signal.source_url,
    })),
    { roleType: null, searchPersona: null },
    { includeSuppressed: true },
  )

  let suppressedCount = 0
  let confidenceSum = 0
  let relevanceSum = 0

  for (const row of ranked) {
    const signal = row.signal
    if (signal.source_kind) sourcePresent += 1
    if (typeof signal.confidence === 'number') confidencePresent += 1

    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(`${signal.signal_date}T12:00:00Z`).getTime()) / 86400000))
    if (ageDays > 120) staleCount += 1

    if ((signal.signal_type === 'award' || signal.signal_type === 'new_product') && row.confidence < 60) {
      falsePositiveProxyCount += 1
    }

    if (row.suppressed) suppressedCount += 1

    confidenceSum += row.confidence
    relevanceSum += row.relevance

    const source = signal.source_kind ?? 'unknown'
    bySourceKind.set(source, (bySourceKind.get(source) ?? 0) + 1)

    const profile = profileByUserId.get(signal.user_id)
    const channel = signal.profile_channel ?? (profile?.role_type ?? 'executives')
    byChannel.set(channel, (byChannel.get(channel) ?? 0) + 1)
  }

  const sampleSize = signals.length
  const sourceCoverageRate = pct(sourcePresent, sampleSize)
  const confidenceCoverageRate = pct(confidencePresent, sampleSize)
  const avgConfidence = sampleSize ? Number((confidenceSum / sampleSize).toFixed(2)) : 0
  const relevanceAvg = sampleSize ? Number((relevanceSum / sampleSize).toFixed(2)) : 0
  const suppressionRate = pct(suppressedCount, sampleSize)
  const staleRate = pct(staleCount, sampleSize)
  const falsePositiveProxyRate = pct(falsePositiveProxyCount, sampleSize)

  const notes: string[] = []
  if (sourceCoverageRate < 95) notes.push('source coverage below 95%')
  if (confidenceCoverageRate < 95) notes.push('confidence coverage below 95%')
  if (falsePositiveProxyRate > 8) notes.push('false-positive proxy above 8%')
  if (suppressionRate > 35) notes.push('suppression rate above 35%')

  const byChannelJson = Object.fromEntries([...byChannel.entries()].sort((a, b) => b[1] - a[1]))
  const bySourceKindJson = Object.fromEntries([...bySourceKind.entries()].sort((a, b) => b[1] - a[1]))

  const { data, error } = await admin
    .from('intelligence_qa_weekly_scorecards')
    .upsert({
      week_start: weekStart,
      sample_size: sampleSize,
      source_coverage_rate: sourceCoverageRate,
      confidence_coverage_rate: confidenceCoverageRate,
      avg_confidence: avgConfidence,
      relevance_avg: relevanceAvg,
      suppression_rate: suppressionRate,
      stale_rate: staleRate,
      false_positive_proxy_rate: falsePositiveProxyRate,
      by_channel: byChannelJson,
      by_source_kind: bySourceKindJson,
      notes: notes.length > 0 ? notes.join('; ') : null,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'week_start' })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    runId: data?.id,
    weekStart,
    sampleSize,
    sourceCoverageRate,
    confidenceCoverageRate,
    avgConfidence,
    relevanceAvg,
    suppressionRate,
    staleRate,
    falsePositiveProxyRate,
    notes,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
