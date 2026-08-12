import { isSameEvent } from '../../worker/signals/event-dedup-core.js'

function roundedPercent(numerator, denominator) {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 10_000) / 100
}

export function countEscapedDuplicateEvents(events, cutoffIso) {
  const ordered = [...events].sort((left, right) => {
    const createdOrder = String(left.created_at).localeCompare(String(right.created_at))
    return createdOrder !== 0 ? createdOrder : String(left.id).localeCompare(String(right.id))
  })
  const priorByKey = new Map()
  let auditedEvents = 0
  let escapedDuplicates = 0

  for (const event of ordered) {
    const key = `${event.canonical_company_id}::${event.event_type}`
    const prior = priorByKey.get(key) ?? []
    if (String(event.created_at) >= cutoffIso) {
      auditedEvents += 1
      if (prior.some((candidate) => isSameEvent(candidate, event))) {
        escapedDuplicates += 1
      }
    }
    prior.push(event)
    priorByKey.set(key, prior)
  }

  return { auditedEvents, escapedDuplicates }
}

export function summarizeObservabilityMetrics(
  sourceMetrics,
  provenanceCovered,
  provenanceTotal,
  duplicateAudit = { auditedEvents: 0, escapedDuplicates: 0 },
) {
  const totals = sourceMetrics.reduce(
    (acc, row) => ({
      classificationCalls: acc.classificationCalls + (row.classify_calls ?? 0),
      classificationFailures: acc.classificationFailures + (row.classify_failures ?? 0),
      eventsCreated: acc.eventsCreated + (row.events_created ?? 0),
      eventsMerged: acc.eventsMerged + (row.events_merged ?? 0),
    }),
    {
      classificationCalls: 0,
      classificationFailures: 0,
      eventsCreated: 0,
      eventsMerged: 0,
    },
  )

  const classificationFailureRatePercent = roundedPercent(
    totals.classificationFailures,
    totals.classificationCalls,
  )
  const mergeRatePercent = roundedPercent(
    totals.eventsMerged,
    totals.eventsCreated + totals.eventsMerged,
  )
  const duplicateRatePercent = roundedPercent(
    duplicateAudit.escapedDuplicates,
    duplicateAudit.auditedEvents,
  )
  const provenanceCoveragePercent = roundedPercent(provenanceCovered, provenanceTotal)

  return {
    ...totals,
    provenanceCovered,
    provenanceTotal,
    duplicateAuditedEvents: duplicateAudit.auditedEvents,
    escapedDuplicateEvents: duplicateAudit.escapedDuplicates,
    classificationFailureRatePercent,
    mergeRatePercent,
    duplicateRatePercent,
    provenanceCoveragePercent,
    gates: {
      classificationFailure: {
        currentPercent: classificationFailureRatePercent,
        targetPercent: 3,
        comparison: 'less_than',
        status: classificationFailureRatePercent === null
          ? 'no_data'
          : classificationFailureRatePercent < 3 ? 'pass' : 'fail',
      },
      duplicateRate: {
        currentPercent: duplicateRatePercent,
        targetPercent: 5,
        comparison: 'less_than',
        status: duplicateRatePercent === null
          ? 'no_data'
          : duplicateRatePercent < 5 ? 'pass' : 'fail',
      },
      provenanceCoverage: {
        currentPercent: provenanceCoveragePercent,
        targetPercent: 100,
        comparison: 'at_least',
        status: provenanceCoveragePercent === null
          ? 'no_data'
          : provenanceCoveragePercent >= 100 ? 'pass' : 'fail',
      },
    },
  }
}