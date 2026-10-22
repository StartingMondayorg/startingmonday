import {
  readOutreachCsv,
  prioritizeCuratedRows,
  combineExecutiveSources,
  mergeFirstTouch,
  buildExecutiveFitLookup,
  buildExecutiveCompanySizeLookup,
  executivePersonaFit,
  buildStandardizedDraft,
} from '../src/app/(dashboard)/dashboard/admin/outreach/outreach-data'

async function main() {
  const [
    executiveRaw,
    executiveStrict100,
    executiveStrict50,
    executiveStrict31,
    executiveStrict21,
    executiveBatch1,
    executiveBatch1Strict,
    executiveBatch2Strict,
    executiveBatch3Personalized,
    executiveBatch4Personalized,
    apolloSendReady,
    apolloFollowups,
    executiveTargetSlate,
    firstTouch,
    searchFirmRaw,
    coachRaw,
    outplacementRaw,
    searchFirmCurated,
    coachCurated,
    day1CoachTargetList,
  ] = await Promise.all([
    readOutreachCsv('executives_prospecting_midmarket_strong_medium.csv'),
    readOutreachCsv('prospecting_combined_strict_100.csv'),
    readOutreachCsv('prospecting_combined_strict_50_personalized.csv'),
    readOutreachCsv('prospecting_combined_strict_31_personalized.csv'),
    readOutreachCsv('prospecting_combined_strict_21_personalized.csv'),
    readOutreachCsv('prospecting_batch_001.csv'),
    readOutreachCsv('prospecting_batch_001_strict_roles.csv'),
    readOutreachCsv('prospecting_batch_002_strict_roles.csv'),
    readOutreachCsv('prospecting_batch_003_personalized_real_10.csv'),
    readOutreachCsv('prospecting_batch_004_personalized_real_19.csv'),
    readOutreachCsv('apollo_priority_send_ready.csv'),
    readOutreachCsv('apollo_priority_followups.csv'),
    readOutreachCsv('us-senior-executive-target-slate.csv'),
    readOutreachCsv('send_ready_emails_first_10.csv'),
    readOutreachCsv('search_firms_prospecting_100.csv'),
    readOutreachCsv('coaches_prospecting_100.csv'),
    readOutreachCsv('outplacement_firms_prospecting_100.csv'),
    readOutreachCsv('search_firms_prospecting_curated_top25.csv'),
    readOutreachCsv('coaches_prospecting_curated_top25.csv'),
    readOutreachCsv('day1_coach_target_list_60.csv'),
  ])

  const executiveUniverse = combineExecutiveSources([
    executiveRaw,
    executiveStrict100,
    executiveStrict50,
    executiveStrict31,
    executiveStrict21,
    executiveBatch1,
    executiveBatch1Strict,
    executiveBatch2Strict,
    executiveBatch3Personalized,
    executiveBatch4Personalized,
    apolloSendReady,
    apolloFollowups,
  ])

  const executives = mergeFirstTouch(executiveUniverse, firstTouch)
  const executiveFitLookup = buildExecutiveFitLookup(executiveTargetSlate.rows)
  const executiveCompanySizeLookup = buildExecutiveCompanySizeLookup(executiveTargetSlate.rows)
  const prioritizedSearchFirms = prioritizeCuratedRows(searchFirmRaw, searchFirmCurated)
  const prioritizedCoaches = prioritizeCuratedRows(coachRaw, coachCurated)

  const executiveRows = executives.rows.flatMap((row) => {
    const fit = executivePersonaFit(row, executiveFitLookup, executiveCompanySizeLookup)
    if (!fit) return []
    return [{ channel: 'executives', body: buildStandardizedDraft(row, 'executives', { forceTemplate: true }).body }]
  })

  const searchRows = prioritizedSearchFirms.rows.map((row) => ({
    channel: 'search_firms',
    body: buildStandardizedDraft(row, 'search_firms', { forceTemplate: true }).body,
  }))

  const coachRows = prioritizedCoaches.rows.map((row) => ({
    channel: 'coaches',
    body: buildStandardizedDraft(row, 'coaches', { forceTemplate: true }).body,
  }))

  const day1Rows = day1CoachTargetList.rows.map((row) => ({
    channel: 'coaches',
    body: buildStandardizedDraft(
      {
        ...row,
        role_bucket: (row.title ?? '').trim() || 'Executive Coach',
        persona_focus: (row.persona ?? '').trim() || 'Executive transitions',
      },
      'coaches',
      { forceTemplate: true },
    ).body,
  }))

  const outplacementRows = outplacementRaw.rows.map((row) => ({
    channel: 'outplacement_firms',
    body: buildStandardizedDraft(row, 'outplacement_firms', { forceTemplate: true }).body,
  }))

  const all = [...executiveRows, ...searchRows, ...coachRows, ...day1Rows, ...outplacementRows]
  const by = new Map<string, { total: number; withMomentum: number }>()

  for (const item of all) {
    const current = by.get(item.channel) ?? { total: 0, withMomentum: 0 }
    current.total += 1
    if (item.body.includes('Momentum Signal')) current.withMomentum += 1
    by.set(item.channel, current)
  }

  console.log('queue_audit_total', all.length)
  for (const [channel, stats] of by.entries()) {
    console.log(channel, `${stats.withMomentum}/${stats.total}`)
  }

  const missing = all.filter((row) => !row.body.includes('Momentum Signal')).length
  console.log('missing', missing)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
