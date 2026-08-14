import { withTimeout, parseCsvRows, parseExcelRows, normalizeNotice } from './warn-notice-parsing.js'
import {
  fetchGATableRows,
  fetchOhioCsvRows,
  mapIllinoisRows,
  mapNewJerseyRows,
  parseOhioRowsFromHtml,
  fetchCADataRows,
  mapCaliforniaRows,
  fetchTXDataRows,
  mapTexasRows,
  fetchFLDataRows,
  mapFloridaRows,
  fetchNYDataRows,
  mapNewYorkRows,
  fetchPADataRows,
  mapPennsylvaniaRows,
  fetchMIDataRows,
  mapMichiganRows,
} from './warn-state-feeds.js'

function feedEnvVar(stateCode) {
  return `WARN_FEED_${stateCode}`
}

export async function fetchWarnNoticesForState(stateCode) {
  const upper = String(stateCode ?? '').trim().toUpperCase()
  if (!upper) return []

  const feedUrl = process.env[feedEnvVar(upper)]
  if (!feedUrl) return []

  try {
    if (upper === 'CA') {
      const caRows = await fetchCADataRows(feedUrl)
      return caRows
        .map((row) => normalizeNotice(mapCaliforniaRows([row])[0] || row, upper))
        .filter(Boolean)
    }

    if (upper === 'TX') {
      const txRows = await fetchTXDataRows(feedUrl)
      return mapTexasRows(txRows)
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'FL') {
      const flRows = await fetchFLDataRows(feedUrl)
      return mapFloridaRows(flRows)
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'NY') {
      const nyRows = await fetchNYDataRows(feedUrl)
      return mapNewYorkRows(nyRows)
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'PA') {
      const paRows = await fetchPADataRows(feedUrl)
      return mapPennsylvaniaRows(paRows)
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'MI') {
      const miRows = await fetchMIDataRows(feedUrl)
      return mapMichiganRows(miRows)
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'GA' && feedUrl.includes('gv_datatables_data')) {
      const gaRows = await fetchGATableRows(feedUrl)
      return gaRows
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    if (upper === 'OH') {
      const ohRows = await fetchOhioCsvRows(feedUrl)
      return ohRows
        .map((row) => normalizeNotice(row, upper))
        .filter(Boolean)
    }

    const response = await fetch(feedUrl, { signal: withTimeout() })
    if (!response.ok) return []

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    let rows = []
    if (contentType.includes('application/json') || contentType.includes('+json')) {
      const payload = await response.json()
      rows = Array.isArray(payload) ? payload : (payload?.rows ?? payload?.data ?? [])
    } else if (contentType.includes('spreadsheet') || contentType.includes('excel') || /\.xlsx?(\?|$)/i.test(feedUrl)) {
      const bytes = Buffer.from(await response.arrayBuffer())
      rows = parseExcelRows(bytes)
      if (upper === 'IL') rows = mapIllinoisRows(rows)
      if (upper === 'NJ') rows = mapNewJerseyRows(rows)
    } else {
      const text = await response.text()
      if (upper === 'OH') {
        rows = parseOhioRowsFromHtml(text, feedUrl)
      } else {
        rows = parseCsvRows(text)
      }
    }

    return rows
      .map((row) => normalizeNotice(row, upper))
      .filter(Boolean)
  } catch {
    return []
  }
}
