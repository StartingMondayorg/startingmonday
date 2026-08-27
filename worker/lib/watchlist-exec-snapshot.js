// WS11-05 Names layer infra: watchlist-scoped executive snapshot diffing.
// Mirrors diff-exec-snapshot.js's snapshot-diff model exactly, but keyed by
// watchlist_entry_id instead of (company_id, user_id), since watchlist
// entries are not rows in the per-user companies table.
//
// Deliberately has no populating adapter wired in yet. fetch-pdl-execs.js
// (People Data Labs) is a commercial data broker and is not one of the
// sources KEX-02 approved for the person-level exception (EDGAR 8-K 5.02,
// company newsroom/leadership pages, wire services, public regional press).
// Callers must supply currentExecs from an approved source; do not wire PDL
// into this path without a separate WS1-08 rights decision first.

function normalizeName(name) {
  return (name ?? '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
}

// Compares current exec list against the most recent prior snapshot for
// this watchlist entry. Saves the current snapshot and returns
// { departures, hires }.
export async function diffWatchlistExecSnapshot(supabase, watchlistEntryId, currentExecs, snapshotDate) {
  const { data: prior } = await supabase
    .from('watchlist_exec_snapshots')
    .select('executives')
    .eq('watchlist_entry_id', watchlistEntryId)
    .lt('snapshot_date', snapshotDate)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase
    .from('watchlist_exec_snapshots')
    .upsert(
      { watchlist_entry_id: watchlistEntryId, snapshot_date: snapshotDate, executives: currentExecs },
      { onConflict: 'watchlist_entry_id,snapshot_date' }
    )

  if (!prior) return { departures: [], hires: [] }

  const prevExecs = prior.executives ?? []
  const prevNames = new Set(prevExecs.map((e) => normalizeName(e.name)))
  const currNames = new Set(currentExecs.map((e) => normalizeName(e.name)))

  return {
    departures: prevExecs.filter((e) => !currNames.has(normalizeName(e.name))),
    hires: currentExecs.filter((e) => !prevNames.has(normalizeName(e.name))),
  }
}
