import { dedupePatternAlerts, isDashboardSignalSuppressed } from '@/lib/intelligence/dashboard-signal-guard'

export const DASHBOARD_COMPANY_SIGNAL_LIMIT = 5
export const DASHBOARD_PATTERN_ALERT_LIMIT = 3

type CompanyRef = { id: string; name: string }

type SignalInput = {
  id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  company_id: string
  companies: CompanyRef | CompanyRef[] | null
  confidence?: number | null
  source_kind?: string | null
}

type SignalOutput<T extends SignalInput> = Omit<T, 'companies'> & { companies: CompanyRef | null }

type SignalContractWindow = {
  companySince?: string
  patternSince?: string
}

function normalizeCompanyRef(companies: CompanyRef | CompanyRef[] | null): CompanyRef | null {
  if (Array.isArray(companies)) return companies[0] ?? null
  return companies ?? null
}

export function applyDashboardSignalContract<T extends SignalInput>(
  rows: T[],
  window: SignalContractWindow = {},
): {
  companySignals: Array<SignalOutput<T>>
  patternAlerts: Array<SignalOutput<T>>
  mergedSignals: Array<SignalOutput<T>>
} {
  const normalized = rows.map((row) => ({ ...row, companies: normalizeCompanyRef(row.companies) })) as Array<SignalOutput<T>>

  const filtered = normalized.filter((row) => !isDashboardSignalSuppressed({
    id: row.id,
    signal_type: row.signal_type,
    signal_summary: row.signal_summary,
    signal_date: row.signal_date,
    company_id: row.company_id,
    companies: row.companies,
    confidence: row.confidence,
    source_kind: row.source_kind,
  }))

  const patternCandidates = filtered.filter((row) => row.signal_type === 'pattern_alert')
  const companyCandidates = filtered.filter((row) => row.signal_type !== 'pattern_alert')

  const windowedPatternCandidates = window.patternSince
    ? patternCandidates.filter((row) => row.signal_date >= window.patternSince!)
    : patternCandidates
  const windowedCompanyCandidates = window.companySince
    ? companyCandidates.filter((row) => row.signal_date >= window.companySince!)
    : companyCandidates

  const patternAlerts = dedupePatternAlerts(windowedPatternCandidates)
  const patternCompanyIds = new Set(patternAlerts.map((row) => row.company_id))
  const companySignals = windowedCompanyCandidates.filter((row) => !patternCompanyIds.has(row.company_id))

  return {
    companySignals,
    patternAlerts,
    mergedSignals: [...companySignals, ...patternAlerts],
  }
}
