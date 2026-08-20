import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/slack'

export const runtime = 'nodejs'

type SlackStatus = {
  ok: boolean
  error: string | null
}

type FreshnessStateRow = {
  id: number
  last_status: 'unknown' | 'fresh' | 'stale'
  last_checked_at: string | null
  last_stale_alert_at: string | null
  last_recovery_alert_at: string | null
}

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

function daysSince(value: string | null): number | null {
  const h = hoursSince(value)
  return h === null ? null : h / 24
}

function buildStaleSlackMessage(input: {
  maxFilingDate: string | null
  maxIngestedAt: string | null
  filingAgeDays: number | null
  ingestionAgeHours: number | null
  staleReasons: string[]
  thresholds: { filingDays: number; ingestionHours: number }
  secRows: number
  secCompanies: number
  publicCompanies: number
}): string {
  const lines = [
    '*SEC EDGAR freshness alert*',
    `- Status: stale`,
    `- SEC rows: ${input.secRows}`,
    `- Companies with indexed SEC filings: ${input.secCompanies}`,
    `- Public companies in pipeline: ${input.publicCompanies}`,
    `- Latest filing date: ${input.maxFilingDate ?? 'none'}`,
    `- Latest ingestion write: ${input.maxIngestedAt ?? 'none'}`,
    `- Filing age days: ${input.filingAgeDays === null ? 'n/a' : input.filingAgeDays.toFixed(1)} (threshold ${input.thresholds.filingDays})`,
    `- Ingestion age hours: ${input.ingestionAgeHours === null ? 'n/a' : input.ingestionAgeHours.toFixed(1)} (threshold ${input.thresholds.ingestionHours})`,
    '',
    '*Reasons*',
    ...input.staleReasons.map((reason) => `- ${reason}`),
  ]

  return lines.join('\n')
}

function buildRecoverySlackMessage(input: {
  maxFilingDate: string | null
  maxIngestedAt: string | null
  secRows: number
  secCompanies: number
}): string {
  return [
    '*SEC EDGAR freshness recovered*',
    '- Status: fresh',
    `- SEC rows: ${input.secRows}`,
    `- Companies with indexed SEC filings: ${input.secCompanies}`,
    `- Latest filing date: ${input.maxFilingDate ?? 'none'}`,
    `- Latest ingestion write: ${input.maxIngestedAt ?? 'none'}`,
  ].join('\n')
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const healthMode = request.nextUrl.searchParams.get('mode') === 'health'
    || request.nextUrl.searchParams.get('health') === '1'
    || request.nextUrl.searchParams.get('dry_run') === '1'

  const filingFreshnessDays = readNumberEnv('EDGAR_MAX_FILING_AGE_DAYS', 7)
  const ingestionFreshnessHours = readNumberEnv('EDGAR_MAX_INGESTION_AGE_HOURS', 72)
  const staleAlertCooldownHours = readNumberEnv('EDGAR_STALE_ALERT_COOLDOWN_HOURS', 24)

  const admin = createAdminClient()

  const db = admin as any

  const [
    secCountResult,
    secMaxFilingResult,
    secMaxCreatedResult,
    publicCompaniesResult,
    secCompanyRowsResult,
    lastSuccessRunResult,
  ] = await Promise.all([
    db.from('sec_filings').select('*', { count: 'exact', head: true }),
    db.from('sec_filings').select('filing_date').order('filing_date', { ascending: false }).limit(1),
    db.from('sec_filings').select('created_at').order('created_at', { ascending: false }).limit(1),
    db.from('companies').select('*', { count: 'exact', head: true }).eq('is_public_company', true).not('sec_cik_padded', 'is', null),
    db.from('sec_filings').select('company_id'),
    db.from('sec_ingestion_runs').select('finished_at').eq('source', 'signal-job').eq('status', 'success').order('finished_at', { ascending: false }).limit(1),
  ])

  const firstError = secCountResult.error
    ?? secMaxFilingResult.error
    ?? secMaxCreatedResult.error
    ?? publicCompaniesResult.error
    ?? secCompanyRowsResult.error
    ?? lastSuccessRunResult.error

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const secRows = secCountResult.count ?? 0
  const maxFilingDate = (secMaxFilingResult.data?.[0] as { filing_date?: string } | undefined)?.filing_date ?? null
  const maxIngestedAt = (secMaxCreatedResult.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null
  const publicCompanies = publicCompaniesResult.count ?? 0
  const secCompanies = new Set(
    (secCompanyRowsResult.data ?? [])
      .map((row: { company_id?: string }) => row.company_id)
      .filter(Boolean)
  ).size
  const lastSuccessRunAt = ((lastSuccessRunResult.data ?? [])[0] as { finished_at?: string } | undefined)?.finished_at ?? null

  const filingAgeDays = maxFilingDate ? daysSince(`${maxFilingDate}T00:00:00.000Z`) : null
  const ingestionAgeHours = hoursSince(maxIngestedAt)
  const signalRunAgeHours = hoursSince(lastSuccessRunAt)

  const staleReasons: string[] = []
  if (secRows === 0) staleReasons.push('No rows exist in sec_filings')
  if (!maxFilingDate) staleReasons.push('No max filing date found in sec_filings')
  if (filingAgeDays !== null && filingAgeDays > filingFreshnessDays) {
    staleReasons.push(`Latest SEC filing date is ${filingAgeDays.toFixed(1)} days old`)
  }
  if (!maxIngestedAt) staleReasons.push('No ingestion write timestamp found in sec_filings')
  if (ingestionAgeHours !== null && ingestionAgeHours > ingestionFreshnessHours) {
    staleReasons.push(`Latest SEC ingestion write is ${ingestionAgeHours.toFixed(1)} hours old`)
  }
  if (publicCompanies > 0 && secCompanies === 0) {
    staleReasons.push('Public companies exist but sec_filings has no company coverage')
  }
  if (signalRunAgeHours !== null && signalRunAgeHours > ingestionFreshnessHours) {
    staleReasons.push(`Latest signal-job SEC success run is ${signalRunAgeHours.toFixed(1)} hours old`)
  }

  const isStale = staleReasons.length > 0

  let state: FreshnessStateRow | null = null
  const stateResult = await db
    .from('sec_freshness_audit_state')
    .select('id, last_status, last_checked_at, last_stale_alert_at, last_recovery_alert_at')
    .eq('id', 1)
    .maybeSingle()

  if (!stateResult.error) {
    state = (stateResult.data as FreshnessStateRow | null) ?? null
  }

  const nowIso = new Date().toISOString()
  const previousStatus = state?.last_status ?? 'unknown'
  const staleAlertAgeHours = hoursSince(state?.last_stale_alert_at ?? null)
  const shouldAlertStale = !healthMode
    && isStale
    && (previousStatus !== 'stale' || staleAlertAgeHours === null || staleAlertAgeHours >= staleAlertCooldownHours)
  const shouldAlertRecovery = !healthMode && !isStale && previousStatus === 'stale'

  let slack: SlackStatus = { ok: true, error: null }

  if (shouldAlertStale) {
    const message = buildStaleSlackMessage({
      maxFilingDate,
      maxIngestedAt,
      filingAgeDays,
      ingestionAgeHours,
      staleReasons,
      thresholds: {
        filingDays: filingFreshnessDays,
        ingestionHours: ingestionFreshnessHours,
      },
      secRows,
      secCompanies,
      publicCompanies,
    })
    const slackResult = await sendSlackMessage({ text: message })
    slack = slackResult.ok ? { ok: true, error: null } : { ok: false, error: slackResult.error }
  } else if (shouldAlertRecovery) {
    const message = buildRecoverySlackMessage({
      maxFilingDate,
      maxIngestedAt,
      secRows,
      secCompanies,
    })
    const slackResult = await sendSlackMessage({ text: message })
    slack = slackResult.ok ? { ok: true, error: null } : { ok: false, error: slackResult.error }
  }

  const details = {
    secRows,
    secCompanies,
    publicCompanies,
    maxFilingDate,
    maxIngestedAt,
    filingAgeDays,
    ingestionAgeHours,
    signalRunAgeHours,
    staleReasons,
    thresholds: {
      filingFreshnessDays,
      ingestionFreshnessHours,
      staleAlertCooldownHours,
    },
    mode: healthMode ? 'health' : 'live',
  }

  await db
    .from('sec_freshness_audit_state')
    .upsert({
      id: 1,
      last_status: isStale ? 'stale' : 'fresh',
      last_checked_at: nowIso,
      last_stale_alert_at: shouldAlertStale && slack.ok ? nowIso : state?.last_stale_alert_at ?? null,
      last_recovery_alert_at: shouldAlertRecovery && slack.ok ? nowIso : state?.last_recovery_alert_at ?? null,
      last_details: details,
      updated_at: nowIso,
    }, { onConflict: 'id' })

  await db
    .from('sec_ingestion_runs')
    .insert({
      source: 'freshness-audit',
      status: isStale ? 'stale' : 'fresh',
      started_at: nowIso,
      finished_at: nowIso,
      filings_considered: secRows,
      filings_indexed: secRows,
      sec_articles: 0,
      signals_emitted: 0,
      latest_filing_date: maxFilingDate,
      latest_ingested_at: maxIngestedAt,
      error_message: isStale ? staleReasons.join('; ') : null,
      metadata: {
        ...details,
        slackAlertAttempted: shouldAlertStale || shouldAlertRecovery,
        slackAlertSent: shouldAlertStale || shouldAlertRecovery ? slack.ok : false,
      },
    })

  return NextResponse.json({
    ok: true,
    status: isStale ? 'stale' : 'fresh',
    shouldAlertStale,
    shouldAlertRecovery,
    slack,
    details,
  })
}
