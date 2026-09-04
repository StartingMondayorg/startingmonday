// SMK-445: shared logic for EMI KPI computation.
//
// The weekly KPI job (weekly-kpi-summaries) sources every user-denominated
// metric from server-side aggregate RPCs (emi_kpi_event_funnel,
// emi_kpi_day7_cohort in migration 184) and applies the rules here:
// - a ratio can never exceed 100 percent,
// - denominators below EMI_KPI_MIN_DENOMINATOR are 'insufficient_data'
//   (computed and snapshotted, but excluded from pass/fail scoring),
// - day-7 return uses fixed weekly cohorts shifted back one week so the
//   whole cohort has at least 7 days of maturity at reporting time.

/** Minimum non-synthetic-user denominator before a ratio is scored (SMK-445 defect 5). */
export const EMI_KPI_MIN_DENOMINATOR = 20

export type EmiMetricStatus = 'ok' | 'no_data' | 'query_error' | 'insufficient_data'

/** UTC Monday-to-Sunday week containing refDate (defaults to now). */
export function weekRange(refDate?: string): { start: string; end: string } {
  const base = refDate ? new Date(refDate) : new Date()
  const day = base.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday))
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

/**
 * The day-7 return cohort scored for a reporting week is the fixed weekly
 * cohort one week earlier: users activating in it have all had a full 7-day
 * return window close by the reporting week's end (defect 3).
 */
export function day7CohortRange(weekStart: string, weekEnd: string): { cohortStart: string; cohortEnd: string } {
  const shift = (dateOnly: string): string => {
    const d = new Date(`${dateOnly}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() - 7)
    return d.toISOString().slice(0, 10)
  }
  return { cohortStart: shift(weekStart), cohortEnd: shift(weekEnd) }
}

/**
 * Percentage rounded to 2dp. Returns null when the denominator is not
 * positive. The numerator is clamped to the denominator so no metric can
 * exceed 100 percent even if an upstream source misbehaves (defect 2).
 */
export function ratioPercent(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null
  const clamped = Math.min(Math.max(numerator, 0), denominator)
  return Math.round((clamped / denominator) * 10000) / 100
}

/**
 * Status for a ratio metric from its denominator: no users measured is
 * no_data, a denominator under the floor is insufficient_data, else ok.
 */
export function denominatorStatus(denominator: number, floor: number = EMI_KPI_MIN_DENOMINATOR): EmiMetricStatus {
  if (!Number.isFinite(denominator) || denominator <= 0) return 'no_data'
  if (denominator < floor) return 'insufficient_data'
  return 'ok'
}

/** A snapshot row counts as measured when its instrumentation produced a value. */
export function isMeasuredStatus(status: string, value: number | null): boolean {
  return (status === 'ok' || status === 'insufficient_data') && value !== null
}
