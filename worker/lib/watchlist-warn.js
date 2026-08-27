// WS11-04: WARN notice matching for watchlist entries.
// fetchWarnNoticesForState is state-scoped, not per-company, so it is fetched
// once per unique state across active watchlist entries and matched to
// entries by normalized employer name — never re-fetched per entry.

import { normalizeCompanyName } from './canonical-company.js'

// Groups active watchlist entries by state, so the caller fetches each
// state's WARN feed exactly once regardless of how many entries share it.
export function groupEntriesByState(entries) {
  const byState = new Map()
  for (const entry of entries) {
    if (!entry.state) continue
    const state = entry.state.toUpperCase()
    if (!byState.has(state)) byState.set(state, [])
    byState.get(state).push(entry)
  }
  return byState
}

// Matches a state's WARN notices to one watchlist entry by normalized
// employer name. Returns the subset of notices for that entry.
export function matchNoticesToEntry(notices, entry) {
  const entryNameNormalized = normalizeCompanyName(entry.company_name)
  if (!entryNameNormalized) return []
  return notices.filter((notice) => {
    const noticeNameNormalized = normalizeCompanyName(notice.employer_name)
    return noticeNameNormalized === entryNameNormalized
      || noticeNameNormalized.includes(entryNameNormalized)
      || entryNameNormalized.includes(noticeNameNormalized)
  })
}
