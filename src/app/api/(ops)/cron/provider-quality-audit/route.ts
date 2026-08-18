import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/slack'

export const runtime = 'nodejs'

const ALERT_KEY = 'provider-quality-audit'

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function hoursSince(value: string | null): number | null {
  if (!value) return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return null
  return (Date.now() - t) / 3_600_000
}

function staleMessage(input: {
  latestUpdatedAt: string | null
  ageHours: number | null
  activeEnrichedCount: number
  maxAgeHours: number
  staleReasons: string[]
}): string {
  return [
    '*Provider quality audit alert*',
    '- Status: stale',
    `- Active enriched contacts: ${input.activeEnrichedCount}`,
    `- Latest enriched contact update: ${input.latestUpdatedAt ?? 'none'}`,
    `- Update age hours: ${input.ageHours === null ? 'n/a' : input.ageHours.toFixed(2)}`,
    `- Max allowed age hours: ${input.maxAgeHours}`,
    '',
    '*Reasons*',
    ...input.staleReasons.map((reason) => `- ${reason}`),
  ].join('\n')
}

function recoveryMessage(input: {
  latestUpdatedAt: string | null
  ageHours: number | null
  activeEnrichedCount: number
}): string {
  return [
    '*Provider quality audit recovered*',
    '- Status: fresh',
    `- Active enriched contacts: ${input.activeEnrichedCount}`,
    `- Latest enriched contact update: ${input.latestUpdatedAt ?? 'none'}`,
    `- Update age hours: ${input.ageHours === null ? 'n/a' : input.ageHours.toFixed(2)}`,
  ].join('\n')
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const healthMode = request.nextUrl.searchParams.get('mode') === 'health'
    || request.nextUrl.searchParams.get('health') === '1'
    || request.nextUrl.searchParams.get('dry_run') === '1'

  const maxAgeHours = readNumberEnv('PROVIDER_QUALITY_MAX_AGE_HOURS', 168)
  const staleAlertCooldownHours = readNumberEnv('PROVIDER_QUALITY_ALERT_COOLDOWN_HOURS', 24)

  const admin = createAdminClient() as any

  const selectSources = ['anthropic', 'fallback']

  let countResult = await admin
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .in('enrichment_source', selectSources)
    .eq('status', 'active')

  let latestResult = await admin
    .from('contacts')
    .select('updated_at')
    .in('enrichment_source', selectSources)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)

  const statusMissing = /column .*status/i.test(countResult.error?.message ?? '')
    || /column .*status/i.test(latestResult.error?.message ?? '')

  if (statusMissing) {
    countResult = await admin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .in('enrichment_source', selectSources)

    latestResult = await admin
      .from('contacts')
      .select('updated_at')
      .in('enrichment_source', selectSources)
      .order('updated_at', { ascending: false })
      .limit(1)
  }

  const firstError = countResult.error ?? latestResult.error
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const activeEnrichedCount = countResult.count ?? 0
  const latestUpdatedAt = ((latestResult.data ?? [])[0] as { updated_at?: string } | undefined)?.updated_at ?? null
  const ageHours = hoursSince(latestUpdatedAt)

  const staleReasons: string[] = []
  if (activeEnrichedCount === 0) staleReasons.push('No active enriched contacts found for anthropic/fallback sources')
  if (!latestUpdatedAt) staleReasons.push('No updated_at timestamp found for enriched contacts')
  if (ageHours !== null && ageHours > maxAgeHours) {
    staleReasons.push(`Latest enriched contact update is ${ageHours.toFixed(2)} hours old`)
  }

  const isStale = staleReasons.length > 0

  const { data: priorState } = await admin
    .from('monitoring_alert_state')
    .select('alert_key, last_status, last_stale_alert_at, last_recovery_alert_at')
    .eq('alert_key', ALERT_KEY)
    .maybeSingle()

  const previousStatus = priorState?.last_status ?? 'unknown'
  const staleAlertAgeHours = hoursSince(priorState?.last_stale_alert_at ?? null)
  const shouldAlertStale = !healthMode
    && isStale
    && (previousStatus !== 'stale' || staleAlertAgeHours === null || staleAlertAgeHours >= staleAlertCooldownHours)
  const shouldAlertRecovery = !healthMode && !isStale && previousStatus === 'stale'

  let slack = { ok: true, error: null as string | null }

  if (shouldAlertStale) {
    const result = await sendSlackMessage({
      text: staleMessage({
        latestUpdatedAt,
        ageHours,
        activeEnrichedCount,
        maxAgeHours,
        staleReasons,
      }),
    })
    slack = result.ok ? { ok: true, error: null } : { ok: false, error: result.error }
  } else if (shouldAlertRecovery) {
    const result = await sendSlackMessage({
      text: recoveryMessage({
        latestUpdatedAt,
        ageHours,
        activeEnrichedCount,
      }),
    })
    slack = result.ok ? { ok: true, error: null } : { ok: false, error: result.error }
  }

  const nowIso = new Date().toISOString()
  const details = {
    latestUpdatedAt,
    ageHours,
    activeEnrichedCount,
    staleReasons,
    thresholds: {
      maxAgeHours,
      staleAlertCooldownHours,
    },
    mode: healthMode ? 'health' : 'live',
  }

  await admin
    .from('monitoring_alert_state')
    .upsert({
      alert_key: ALERT_KEY,
      last_status: isStale ? 'stale' : 'fresh',
      last_checked_at: nowIso,
      last_stale_alert_at: shouldAlertStale && slack.ok ? nowIso : priorState?.last_stale_alert_at ?? null,
      last_recovery_alert_at: shouldAlertRecovery && slack.ok ? nowIso : priorState?.last_recovery_alert_at ?? null,
      last_details: details,
      updated_at: nowIso,
    }, { onConflict: 'alert_key' })

  return NextResponse.json({
    ok: true,
    status: isStale ? 'stale' : 'fresh',
    shouldAlertStale,
    shouldAlertRecovery,
    slack,
    details,
  })
}
