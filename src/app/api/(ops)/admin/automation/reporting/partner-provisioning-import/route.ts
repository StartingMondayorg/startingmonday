/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { estimateImportDurationMinutes, validateProvisioningRows, type ProvisioningImportRow } from '@/lib/partner-provisioning'

const payloadSchema = z.object({
  rows: z.array(z.object({
    partner_id: z.string(),
    partner_name: z.string().optional(),
    cohort_key: z.string(),
    user_email: z.string(),
    seat_id: z.string().optional(),
  })).default([]),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(1).max(10).default(3),
    backoffMinutes: z.number().int().min(1).max(120).default(10),
  }).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, payloadSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const rows = parsed.body.rows as ProvisioningImportRow[]
  const retryPolicy = parsed.body.retryPolicy ?? { maxAttempts: 3, backoffMinutes: 10 }
  const validation = validateProvisioningRows(rows)

  const attemptedRows = rows.length
  const acceptedRows = validation.valid.length
  const rejectedRows = validation.invalid.length
  const errorRatePct = attemptedRows > 0 ? Number(((rejectedRows / attemptedRows) * 100).toFixed(2)) : 0

  const groupedByCohort = new Map<string, ProvisioningImportRow[]>()
  for (const row of validation.valid) {
    const key = `${row.partner_id}::${row.cohort_key}`
    const group = groupedByCohort.get(key)
    if (group) {
      group.push(row)
    } else {
      groupedByCohort.set(key, [row])
    }
  }

  const durationEstimateMinutes = estimateImportDurationMinutes(acceptedRows)
  const under15MinuteTarget = acceptedRows <= 100 ? durationEstimateMinutes <= 15 : true

  const runPayload = {
    ticket: 'PB-Q2-004',
    generated_at: new Date().toISOString(),
    attempted_rows: attemptedRows,
    accepted_rows: acceptedRows,
    rejected_rows: rejectedRows,
    error_rate_pct: errorRatePct,
    duration_estimate_minutes: durationEstimateMinutes,
    under_15_min_target_for_100_seats: under15MinuteTarget,
    retry_policy: retryPolicy,
    cohorts: Array.from(groupedByCohort.entries()).map(([key, batch]) => {
      const [partnerId, cohortKey] = key.split('::')
      return {
        partner_id: partnerId,
        cohort_key: cohortKey,
        batch_size: batch.length,
        retry_metadata: {
          max_attempts: retryPolicy.maxAttempts,
          backoff_minutes: retryPolicy.backoffMinutes,
        },
      }
    }),
    rejected_reasons: validation.invalid,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: runPayload,
  })

  await sb.from('scheduled_job_observability_runs').insert({
    user_id: auth.userId,
    job_name: 'partner-provisioning-import-pipeline',
    status: errorRatePct < 2 ? 'ok' : 'degraded',
    details: runPayload,
  })

  if (errorRatePct >= 2) {
    await sb.from('automation_alerts').insert({
      user_id: auth.userId,
      source_table: 'trend_report_runs',
      alert_code: 'provisioning_import_error_rate_high',
      severity: 'medium',
      message: `Provisioning import error rate ${errorRatePct}% exceeds 2% target.`,
      status: 'open',
    })
  }

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-004',
    summary: {
      attempted_rows: attemptedRows,
      accepted_rows: acceptedRows,
      rejected_rows: rejectedRows,
      error_rate_pct: errorRatePct,
      duration_estimate_minutes: durationEstimateMinutes,
      under_15_min_target_for_100_seats: under15MinuteTarget,
      target_error_rate_pct: 2,
      target_met: errorRatePct < 2,
    },
    validations: {
      invalid_rows: validation.invalid,
      explicit_error_reasons: true,
    },
    run_log: runPayload,
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const historyRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .order('created_at', { ascending: false })
    .limit(50)

  const history = ((historyRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-004')
    .map((row) => ({
      run_id: row.id,
      created_at: row.created_at,
      attempted_rows: Number(row.trend_payload?.attempted_rows ?? 0),
      accepted_rows: Number(row.trend_payload?.accepted_rows ?? 0),
      rejected_rows: Number(row.trend_payload?.rejected_rows ?? 0),
      error_rate_pct: Number(row.trend_payload?.error_rate_pct ?? 0),
      duration_estimate_minutes: Number(row.trend_payload?.duration_estimate_minutes ?? 0),
    }))

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-004',
    history,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
