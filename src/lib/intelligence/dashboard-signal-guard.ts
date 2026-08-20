type DashboardSignal = {
  id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  company_id: string
  companies: { id: string; name: string } | null
  confidence?: number | null
  source_kind?: string | null
}

const FIXTURE_SOURCE_KINDS = new Set(['demo', 'fixture', 'sample', 'seed'])
const FIXTURE_COMPANY_REGEX = /^(acme|slo\s*test\s*co)/i
const SYNTHETIC_SUMMARY_REGEX = /(fixture|seeded|demo)/i
const NON_EXECUTIVE_SIGNAL_REGEX = /(green\s+bay\s+packers|nfl|nhl|mlb|head\s+coach|general\s+manager\s+promotion)/i

export function isDashboardSignalSuppressed(signal: DashboardSignal): boolean {
  if (signal.source_kind && FIXTURE_SOURCE_KINDS.has(signal.source_kind.toLowerCase())) return true
  if (signal.companies?.name && FIXTURE_COMPANY_REGEX.test(signal.companies.name)) return true
  if (SYNTHETIC_SUMMARY_REGEX.test(signal.signal_summary)) return true
  if (NON_EXECUTIVE_SIGNAL_REGEX.test(signal.signal_summary)) return true
  if (typeof signal.confidence === 'number' && signal.confidence < 50) return true
  return false
}

function patternKey(summary: string): string {
  const idx = summary.indexOf(':')
  const head = idx > -1 ? summary.slice(0, idx) : summary
  return head.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function dedupePatternAlerts<T extends DashboardSignal>(alerts: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of alerts) {
    const key = `${item.company_id}:${patternKey(item.signal_summary)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}
