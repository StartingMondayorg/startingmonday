// WS11-01/02/03: watchlist-scoped signal orchestration over existing adapters.
//
// Runs the existing worker/signals adapters against watchlist entries
// (instead of the per-user `companies` table), writes results into the
// existing canonical company_events layer, and records per-source coverage
// accounting. This deliberately reuses fetch-sec-filings.js and
// fetch-pr-wire.js rather than duplicating adapter logic.
//
// Scope of this first cut: SEC filings and PR wire only (both are
// single-company-scoped calls with a signature this orchestrator can drive
// directly). WARN notices, ATS boards, proxy/activist/insider, and regional
// press are WS11-04/05/06 fast-follows — WARN in particular is a
// state-scoped feed (fetchWarnNoticesForState), not a per-company call, and
// needs its own aggregation step rather than fitting this per-entry loop.
//
// fetchPrWire currently swallows its own errors and returns [] either way,
// so an empty result from it is classified "thin" rather than "failed" —
// it cannot yet be told apart from a genuine fetch failure. fetchSecFilings
// exposes { fetchError }, so its coverage classification is precise.

import crypto from 'crypto'
import { fetchSecFilings } from '../signals/fetch-sec-filings.js'
import { fetchPrWire } from '../signals/fetch-pr-wire.js'
import { upsertCompanyEvent } from '../signals/event-store.js'
import { resolveCanonicalCompanyForWatchlist } from '../lib/watchlist-canonical.js'
import { isAdapterEnabled, recordAdapterSuccess, recordAdapterFailure } from '../lib/adapter-health.js'
import { logger } from '../lib/logger.js'

const SEC_FILINGS_SOURCE = 'sec_filings'
const PR_WIRE_SOURCE = 'pr_wire'

async function recordCoverage(supabase, { watchlistEntryId, source, runId, coverage, errorClass = null, itemsFound = 0 }) {
  await supabase.from('source_coverage').insert({
    watchlist_entry_id: watchlistEntryId,
    source,
    run_id: runId,
    coverage,
    error_class: errorClass,
    items_found: itemsFound,
  })
}

async function runSecFilingsForEntry(supabase, entry, runId) {
  const enabled = await isAdapterEnabled(supabase, SEC_FILINGS_SOURCE)
  if (!enabled) {
    await recordCoverage(supabase, { watchlistEntryId: entry.id, source: SEC_FILINGS_SOURCE, runId, coverage: 'failed', errorClass: 'adapter_disabled' })
    return { written: 0 }
  }

  const { articles, fetchError } = await fetchSecFilings(entry.company_name)

  if (fetchError) {
    await recordAdapterFailure(supabase, SEC_FILINGS_SOURCE, fetchError)
    await recordCoverage(supabase, { watchlistEntryId: entry.id, source: SEC_FILINGS_SOURCE, runId, coverage: 'failed', errorClass: fetchError })
    return { written: 0 }
  }

  await recordAdapterSuccess(supabase, SEC_FILINGS_SOURCE)
  await recordCoverage(supabase, {
    watchlistEntryId: entry.id,
    source: SEC_FILINGS_SOURCE,
    runId,
    coverage: articles.length > 0 ? 'full' : 'thin',
    itemsFound: articles.length,
  })

  if (articles.length === 0) return { written: 0 }

  const canonicalCompanyId = await resolveCanonicalCompanyForWatchlist(supabase, {
    name: entry.company_name,
    domain: entry.domain,
    cik: entry.sec_cik_padded,
  })
  if (!canonicalCompanyId) return { written: 0 }

  let written = 0
  for (const article of articles) {
    const eventDate = article.pubDate ? new Date(article.pubDate).toISOString().slice(0, 10) : null
    if (!eventDate) continue
    const result = await upsertCompanyEvent(supabase, {
      canonicalCompanyId,
      eventType: article.filingItems?.includes('5.02') ? 'exec_hire' : 'filing_trend',
      eventDate,
      summary: article.title ?? article.description ?? 'SEC filing',
      sourceUrl: article.link ?? null,
      sourceKind: 'sec_filing',
      filingForm: article.filingForm ?? null,
      filingItems: article.filingItems ?? [],
    })
    if (result.eventId) written += 1
  }
  return { written }
}

async function runPrWireForEntry(supabase, entry, runId) {
  const enabled = await isAdapterEnabled(supabase, PR_WIRE_SOURCE)
  if (!enabled) {
    await recordCoverage(supabase, { watchlistEntryId: entry.id, source: PR_WIRE_SOURCE, runId, coverage: 'failed', errorClass: 'adapter_disabled' })
    return { written: 0 }
  }

  let articles
  try {
    articles = await fetchPrWire(entry.company_name)
  } catch (err) {
    // fetchPrWire is documented as never throwing, but guard anyway.
    await recordAdapterFailure(supabase, PR_WIRE_SOURCE, err.message)
    await recordCoverage(supabase, { watchlistEntryId: entry.id, source: PR_WIRE_SOURCE, runId, coverage: 'failed', errorClass: err.message })
    return { written: 0 }
  }

  await recordAdapterSuccess(supabase, PR_WIRE_SOURCE)
  await recordCoverage(supabase, {
    watchlistEntryId: entry.id,
    source: PR_WIRE_SOURCE,
    runId,
    coverage: articles.length > 0 ? 'full' : 'thin',
    itemsFound: articles.length,
  })

  if (articles.length === 0) return { written: 0 }

  const canonicalCompanyId = await resolveCanonicalCompanyForWatchlist(supabase, {
    name: entry.company_name,
    domain: entry.domain,
    cik: entry.sec_cik_padded,
  })
  if (!canonicalCompanyId) return { written: 0 }

  let written = 0
  for (const article of articles) {
    const eventDate = article.pubDate ? new Date(article.pubDate).toISOString().slice(0, 10) : null
    if (!eventDate) continue
    const result = await upsertCompanyEvent(supabase, {
      canonicalCompanyId,
      eventType: 'new_product',
      eventDate,
      summary: article.title ?? article.description ?? 'PR wire item',
      sourceUrl: article.link ?? null,
      sourceKind: 'pr_wire',
    })
    if (result.eventId) written += 1
  }
  return { written }
}

// Runs one watchlist scan cycle across all active entries in the given
// watchlist. Returns per-entry outcome so the caller can render a coverage
// summary (WS11-03 acceptance: >= 96% full per edition).
export async function runWatchlistScan(supabase, watchlistId) {
  const runId = crypto.randomUUID()

  const { data: entries, error } = await supabase
    .from('watchlist_entries')
    .select('id, company_name, domain, sec_cik_padded')
    .eq('watchlist_id', watchlistId)
    .eq('active', true)

  if (error) {
    logger.error('watchlist-scan-job: failed to load entries', { watchlistId, error: error.message })
    return { runId, entriesProcessed: 0, entriesFailed: 0 }
  }

  let entriesProcessed = 0
  let entriesFailed = 0

  for (const entry of entries ?? []) {
    try {
      const secResult = await runSecFilingsForEntry(supabase, entry, runId)
      const prResult = await runPrWireForEntry(supabase, entry, runId)
      logger.info('watchlist-scan-job: entry scanned', {
        entry: entry.company_name,
        secWritten: secResult.written,
        prWireWritten: prResult.written,
      })
      entriesProcessed += 1
    } catch (err) {
      logger.error('watchlist-scan-job: entry failed', { entry: entry.company_name, error: err.message })
      entriesFailed += 1
    }
  }

  return { runId, entriesProcessed, entriesFailed }
}
