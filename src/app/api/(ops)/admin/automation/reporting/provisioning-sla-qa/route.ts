/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { summarizeProvisioningSla } from '@/lib/partner-provisioning'

function classifyErrorReasons(rejectedReasons: Array<{ code?: string }>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const reason of rejectedReasons) {
    const key = reason.code ?? 'unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = Number(request.nextUrl.searchParams.get('lookback_days') ?? 14)
  const sinceIso = new Date(Date.now() - Math.max(7, Math.min(lookbackDays, 60)) * 24 * 60 * 60 * 1000).toISOString()

  const historyRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(300)

  const runs = ((historyRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-004')

  const durations = runs.map((row) => Number(row.trend_payload?.duration_estimate_minutes ?? 0)).filter((value) => Number.isFinite(value))
  const allRejectedReasons = runs.flatMap((row) => Array.isArray(row.trend_payload?.rejected_reasons) ? row.trend_payload.rejected_reasons : [])
  const errorClasses = classifyErrorReasons(allRejectedReasons)
  const sla = summarizeProvisioningSla({ durationsMinutes: durations, errorClasses })

  const repeatedFailurePatterns = Object.entries(errorClasses)
    .filter(([, count]) => count >= 3)
    .map(([code, count]) => ({ code, count }))

  const alertNeeded = sla.sla_breach_count > 0 || repeatedFailurePatterns.length > 0
  if (alertNeeded) {
    await sb.from('automation_alerts').insert({
      user_id: auth.userId,
      source_table: 'trend_report_runs',
      alert_code: 'provisioning_sla_or_retry_breach',
      severity: 'high',
      message: `Provisioning SLA breaches=${sla.sla_breach_count}; repeated_failure_patterns=${repeatedFailurePatterns.length}`,
      status: 'open',
    })
  }

  const retryPolicyRecommendation = {
    default_max_attempts: repeatedFailurePatterns.length > 0 ? 5 : 3,
    default_backoff_minutes: repeatedFailurePatterns.length > 0 ? 15 : 10,
    reason: repeatedFailurePatterns.length > 0 ? 'elevated failure repetition detected' : 'baseline profile',
  }

  const qaSummary = {
    top_remediation_causes: Object.entries(errorClasses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error_class, count]) => ({ error_class, count })),
    weekly_readout_ready: true,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: {
      ticket: 'PB-Q2-006',
      generated_at: new Date().toISOString(),
      lookback_days: lookbackDays,
      sla,
      repeated_failure_patterns: repeatedFailurePatterns,
      retry_policy_recommendation: retryPolicyRecommendation,
      qa_summary: qaSummary,
    },
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-006',
    lookback_days: lookbackDays,
    sla,
    repeated_failure_patterns: repeatedFailurePatterns,
    retry_policy: retryPolicyRecommendation,
    qa_summary: qaSummary,
  })
}
