import { describe, expect, it } from 'vitest'
import {
  countEscapedDuplicateEvents,
  summarizeLatestClassificationRun,
  summarizeObservabilityMetrics,
} from '../../scripts/lib/intelligence-production-evidence-core.mjs'

describe('summarizeLatestClassificationRun', () => {
  it('evaluates the latest completed run without historical failure contamination', () => {
    const result = summarizeLatestClassificationRun([
      {
        job: 'signal-job',
        run_started_at: '2026-08-12T20:00:00Z',
        classify_calls: 100,
        classify_failures: 20,
      },
      {
        job: 'signal-job',
        run_started_at: '2026-08-13T00:31:55Z',
        classify_calls: 1974,
        classify_failures: 1,
      },
      {
        job: 'signal-job',
        run_started_at: '2026-08-13T00:31:55Z',
        classify_calls: 0,
        classify_failures: 0,
      },
    ])

    expect(result).toEqual({
      job: 'signal-job',
      runStartedAt: '2026-08-13T00:31:55Z',
      calls: 1974,
      failures: 1,
      failurePercent: 0.05,
      gate: {
        currentPercent: 0.05,
        targetPercent: 3,
        comparison: 'less_than',
        status: 'pass',
      },
    })
  })

  it('fails closed when no classifier denominator exists', () => {
    expect(summarizeLatestClassificationRun([]).gate.status).toBe('no_data')
  })
})

describe('summarizeObservabilityMetrics', () => {
  it('aggregates production metrics and passes values inside each threshold', () => {
    const result = summarizeObservabilityMetrics([
      { classify_calls: 60, classify_failures: 1, events_created: 80, events_merged: 2 },
      { classify_calls: 40, classify_failures: 0, events_created: 20, events_merged: 1 },
    ], 25, 25, { auditedEvents: 100, escapedDuplicates: 2 })

    expect(result).toMatchObject({
      classificationCalls: 100,
      classificationFailures: 1,
      eventsCreated: 100,
      eventsMerged: 3,
      classificationFailureRatePercent: 1,
      mergeRatePercent: 2.91,
      duplicateRatePercent: 2,
      provenanceCoveragePercent: 100,
    })
    expect(result.gates.classificationFailure.status).toBe('pass')
    expect(result.gates.duplicateRate.status).toBe('pass')
    expect(result.gates.provenanceCoverage.status).toBe('pass')
  })

  it('fails closed at exclusive rate boundaries and on incomplete provenance', () => {
    const result = summarizeObservabilityMetrics([
      { classify_calls: 100, classify_failures: 3, events_created: 95, events_merged: 5 },
    ], 9, 10, { auditedEvents: 20, escapedDuplicates: 1 })

    expect(result.gates.classificationFailure.status).toBe('fail')
    expect(result.gates.duplicateRate.status).toBe('fail')
    expect(result.gates.provenanceCoverage.status).toBe('fail')
  })

  it('counts only recent canonical rows matching an earlier canonical event', () => {
    const cutoff = '2026-08-12T00:00:00.000Z'
    const result = countEscapedDuplicateEvents([
      {
        id: '1', canonical_company_id: 'a', event_type: 'exec_hire',
        event_date: '2026-08-10', summary: 'Acme appoints Jane Smith as CIO',
        created_at: '2026-08-11T00:00:00.000Z',
      },
      {
        id: '2', canonical_company_id: 'a', event_type: 'exec_hire',
        event_date: '2026-08-11', summary: 'Jane Smith appointed CIO at Acme',
        created_at: '2026-08-12T01:00:00.000Z',
      },
      {
        id: '3', canonical_company_id: 'a', event_type: 'exec_hire',
        event_date: '2026-08-11', summary: 'Acme appoints John Doe as CFO',
        created_at: '2026-08-12T02:00:00.000Z',
      },
    ], cutoff)

    expect(result).toEqual({ auditedEvents: 2, escapedDuplicates: 1 })
  })

  it('returns no_data when a denominator is unavailable', () => {
    const result = summarizeObservabilityMetrics([], 0, 0)

    expect(result.gates.classificationFailure.status).toBe('no_data')
    expect(result.gates.duplicateRate.status).toBe('no_data')
    expect(result.gates.provenanceCoverage.status).toBe('no_data')
  })
})