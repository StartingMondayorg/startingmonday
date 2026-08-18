export type IntelligenceSignalRow = {
  signal_type?: string | null
  signal_summary?: string | null
  signal_date?: string | null
  companies?: { name?: string | null } | null
}

export type IntelligencePulse = {
  signalsLast30Days: number
  topSignalTypes: Array<{ type: string; label: string; count: number }>
  topCompanies: Array<{ companyName: string; signalCount: number; latestSignalType: string | null; latestSignalDate: string | null }>
}

function labelForSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function isWithinLastDays(isoDate: string | null | undefined, days: number): boolean {
  if (!isoDate) return false
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return false
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return date.getTime() >= cutoff
}

export function buildAlwaysOnIntelligencePulse(rows: IntelligenceSignalRow[]): IntelligencePulse {
  const inWindow = rows.filter((row) => isWithinLastDays(row.signal_date, 30))

  const typeCounts = new Map<string, number>()
  const companyCounts = new Map<string, { count: number; latestSignalType: string | null; latestSignalDate: string | null }>()

  for (const row of inWindow) {
    const type = (row.signal_type ?? '').trim().toLowerCase()
    if (type) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)

    const companyName = (row.companies?.name ?? '').trim()
    if (!companyName) continue

    const existing = companyCounts.get(companyName)
    if (!existing) {
      companyCounts.set(companyName, {
        count: 1,
        latestSignalType: type || null,
        latestSignalDate: row.signal_date ?? null,
      })
      continue
    }

    existing.count += 1
    const existingDate = existing.latestSignalDate ? new Date(existing.latestSignalDate).getTime() : -1
    const currentDate = row.signal_date ? new Date(row.signal_date).getTime() : -1
    if (currentDate > existingDate) {
      existing.latestSignalDate = row.signal_date ?? null
      existing.latestSignalType = type || null
    }
  }

  const topSignalTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => ({ type, label: labelForSignalType(type), count }))

  const topCompanies = Array.from(companyCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([companyName, info]) => ({
      companyName,
      signalCount: info.count,
      latestSignalType: info.latestSignalType,
      latestSignalDate: info.latestSignalDate,
    }))

  return {
    signalsLast30Days: inWindow.length,
    topSignalTypes,
    topCompanies,
  }
}