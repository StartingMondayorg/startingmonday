// Intelligence Scanner Observability Metrics (Epic E0 + E1)
// Exposes: DLQ stats (depth, age), source_run_metrics (classification rate, event merge rate),
// canonical layer performance (duplicate rate, provenance coverage).
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { coverageGate, rateGate } from '@/lib/intelligence-gate-status'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function GET(request: NextRequest) {
  const staffAuth = await requireStaffAutomationAccess(request)
  if (!staffAuth.ok) return staffAuth.response

  const admin = createAdminClient() as any

  try {
    // DLQ stats: unresolved classification failures
    const { count: dlqDepth } = await admin
      .from('ingest_dlq')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null)

    const { data: dlqOldest } = await admin
      .from('ingest_dlq')
      .select('created_at')
      .is('resolved_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const dlqOldestAgeHours = dlqOldest?.created_at
      ? (Date.now() - new Date(dlqOldest.created_at).getTime()) / 3600000
      : 0

    // Source run metrics: last 24h aggregate (classification health + event merge stats)
    const { data: sourceMetrics } = await admin
      .from('source_run_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
      .order('created_at', { ascending: false })

    const classifyTotals = (sourceMetrics ?? []).reduce(
      (acc: any, row: any) => ({
        calls: acc.calls + (row.classify_calls ?? 0),
        failures: acc.failures + (row.classify_failures ?? 0),
        signals: acc.signals + (row.signals_written ?? 0),
        eventsCreated: acc.eventsCreated + (row.events_created ?? 0),
        eventsMerged: acc.eventsMerged + (row.events_merged ?? 0),
      }),
      { calls: 0, failures: 0, signals: 0, eventsCreated: 0, eventsMerged: 0 }
    )

    const classificationGate = rateGate({
      numerator: classifyTotals.failures,
      denominator: classifyTotals.calls,
      maximumExclusive: 3,
    })
    const eventMergeGate = rateGate({
      numerator: classifyTotals.eventsMerged,
      denominator: classifyTotals.eventsCreated + classifyTotals.eventsMerged,
      maximumExclusive: 5,
    })

    // Provenance audit: % of events with all required fields
    const { count: provenanceCheck } = await admin
      .from('company_events')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
      .not('raw_fetch_ref', 'is', null)
      .not('content_hash', 'is', null)
      .not('model_version', 'is', null)

    const { count: provenanceTotal } = await admin
      .from('company_events')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())

    const provenanceGate = coverageGate({
      covered: provenanceCheck ?? 0,
      total: provenanceTotal ?? 0,
      targetPercent: 100,
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      phase0: {
        dlq: {
          depth: dlqDepth ?? 0,
          oldestAgeHours: Math.round(dlqOldestAgeHours * 10) / 10,
          depthThreshold: 50,
          ageThresholdHours: 24,
          status: (dlqDepth ?? 0) <= 50 && dlqOldestAgeHours <= 24 ? 'healthy' : 'alert',
        },
        classification: {
          calls: classifyTotals.calls,
          failures: classifyTotals.failures,
          failureRatePercent: classificationGate.ratePercent === null
            ? null
            : Math.round(classificationGate.ratePercent * 100) / 100,
          gateTarget: 3,
          status: classificationGate.status,
        },
      },
      phase1: {
        eventMerge: {
          created: classifyTotals.eventsCreated,
          merged: classifyTotals.eventsMerged,
          mergeRatePercent: eventMergeGate.ratePercent === null
            ? null
            : Math.round(eventMergeGate.ratePercent * 100) / 100,
          duplicateRatePercent: eventMergeGate.ratePercent === null
            ? null
            : Math.round(eventMergeGate.ratePercent * 100) / 100,
          gateTarget: 5,
          status: eventMergeGate.status,
        },
        provenance: {
          coveredEvents: provenanceCheck ?? 0,
          totalEvents: provenanceTotal ?? 0,
          coveragePercent: provenanceGate.coveragePercent === null
            ? null
            : Math.round(provenanceGate.coveragePercent * 100) / 100,
          gateTarget: 100,
          status: provenanceGate.status,
        },
      },
      sourceMetrics24h: (sourceMetrics ?? []).slice(0, 20),
    })
  } catch (err) {
    console.error('intelligence-metrics: error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
