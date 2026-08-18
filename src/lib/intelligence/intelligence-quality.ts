export type SignalProfileContext = {
  roleType?: string | null
  searchPersona?: string | null
  roleFamily?: string | null
  roleTitle?: string | null
}

export type RankedSignalInput = {
  id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  source_url?: string | null
  source_kind?: string | null
  confidence?: number | null
  focus_tags?: string[] | null
  profile_channel?: string | null
  profile_persona?: string | null
}

export type RankedSignalResult<T extends RankedSignalInput> = {
  signal: T
  confidence: number
  relevance: number
  freshness: number
  score: number
  suppressed: boolean
  suppressionReason: string | null
}

const CHANNEL_BY_ROLE: Record<string, string> = {
  coach: 'coaches',
  outplacement: 'outplacement',
  search_firm: 'search_firms',
}

const EXEC_ROLE_PREFIXES = ['c', 'vp', 'head', 'chief']

const SIGNAL_PERSONA_WEIGHTS: Record<string, Record<string, number>> = {
  active: {
    funding: 12,
    exec_departure: 16,
    exec_hire: 10,
    acquisition: 14,
    expansion: 12,
    layoffs: 14,
    ipo: 12,
    new_product: 8,
    award: 4,
    board_change: 10,
    transformation_budget: 14,
    filing_trend: 12,
  },
  passive: {
    funding: 10,
    exec_departure: 12,
    exec_hire: 8,
    acquisition: 10,
    expansion: 10,
    layoffs: 8,
    ipo: 10,
    new_product: 6,
    award: 8,
    board_change: 12,
    transformation_budget: 10,
    filing_trend: 10,
  },
  coach: {
    funding: 8,
    exec_departure: 10,
    exec_hire: 10,
    acquisition: 8,
    expansion: 10,
    layoffs: 12,
    ipo: 6,
    new_product: 8,
    award: 8,
    board_change: 8,
    transformation_budget: 8,
    filing_trend: 6,
  },
  outplacement: {
    funding: 8,
    exec_departure: 16,
    exec_hire: 8,
    acquisition: 12,
    expansion: 10,
    layoffs: 16,
    ipo: 8,
    new_product: 6,
    award: 4,
    board_change: 10,
    transformation_budget: 12,
    filing_trend: 10,
  },
  search_firm: {
    funding: 10,
    exec_departure: 14,
    exec_hire: 14,
    acquisition: 12,
    expansion: 12,
    layoffs: 10,
    ipo: 10,
    new_product: 10,
    award: 4,
    board_change: 10,
    transformation_budget: 10,
    filing_trend: 8,
  },
  leadership: {
    funding: 10,
    exec_departure: 14,
    exec_hire: 11,
    acquisition: 12,
    expansion: 13,
    layoffs: 11,
    ipo: 10,
    new_product: 8,
    award: 4,
    board_change: 11,
    transformation_budget: 13,
    filing_trend: 10,
  },
  technical_leadership: {
    funding: 9,
    exec_departure: 9,
    exec_hire: 10,
    acquisition: 10,
    expansion: 12,
    layoffs: 10,
    ipo: 8,
    new_product: 14,
    award: 6,
    board_change: 7,
    transformation_budget: 14,
    filing_trend: 13,
  },
  delivery_leadership: {
    funding: 8,
    exec_departure: 10,
    exec_hire: 9,
    acquisition: 12,
    expansion: 14,
    layoffs: 12,
    ipo: 8,
    new_product: 11,
    award: 5,
    board_change: 8,
    transformation_budget: 15,
    filing_trend: 11,
  },
}

const SOURCE_KIND_BASE_CONFIDENCE: Record<string, number> = {
  sec_filing: 90,
  regulatory: 85,
  earnings_call: 82,
  press_release: 78,
  manual_news: 72,
  ai_inference: 64,
  unknown: 58,
}

function inferChannel(roleType: string | null | undefined, searchPersona: string | null | undefined): string {
  const role = (roleType ?? '').toLowerCase()
  const persona = (searchPersona ?? '').toLowerCase()

  if (CHANNEL_BY_ROLE[role]) return CHANNEL_BY_ROLE[role]
  if (persona.includes('coach')) return 'coaches'
  if (persona.includes('outplacement')) return 'outplacement'
  if (persona.includes('search')) return 'search_firms'
  if (EXEC_ROLE_PREFIXES.some((prefix) => role.startsWith(prefix))) return 'executives'
  return 'executives'
}

function inferPersonaGroup(context: SignalProfileContext): keyof typeof SIGNAL_PERSONA_WEIGHTS {
  const role = (context.roleType ?? '').toLowerCase()
  const roleFamily = (context.roleFamily ?? '').toLowerCase()
  const persona = (context.searchPersona ?? '').toLowerCase()

  if (role === 'coach' || persona.includes('coach')) return 'coach'
  if (role === 'outplacement' || persona.includes('outplacement')) return 'outplacement'
  if (role === 'search_firm' || persona.includes('search')) return 'search_firm'
  if (roleFamily === 'technical_leadership') return 'technical_leadership'
  if (roleFamily === 'delivery_leadership') return 'delivery_leadership'
  if (roleFamily === 'leadership') return 'leadership'
  if (persona.includes('passive') || persona.includes('optionality') || persona.includes('nurture')) return 'passive'
  return 'active'
}

function daysSince(signalDate: string, now = new Date()): number {
  const t = new Date(`${signalDate}T12:00:00Z`).getTime()
  if (Number.isNaN(t)) return 365
  return Math.max(0, Math.floor((now.getTime() - t) / 86400000))
}

function freshnessScore(signalDate: string): number {
  const age = daysSince(signalDate)
  if (age <= 2) return 24
  if (age <= 7) return 18
  if (age <= 14) return 12
  if (age <= 30) return 8
  if (age <= 60) return 3
  return 0
}

export function computeSignalConfidence(input: {
  signalType: string
  sourceKind?: string | null
  hasSourceUrl?: boolean
  evidenceCount?: number
  explicitConfidence?: number | null
  signalDate: string
}): number {
  if (typeof input.explicitConfidence === 'number' && Number.isFinite(input.explicitConfidence)) {
    return Math.max(0, Math.min(100, Math.round(input.explicitConfidence)))
  }

  const sourceKind = (input.sourceKind ?? 'unknown').toLowerCase()
  let confidence = SOURCE_KIND_BASE_CONFIDENCE[sourceKind] ?? SOURCE_KIND_BASE_CONFIDENCE.unknown

  if (input.hasSourceUrl) confidence += 6
  if ((input.evidenceCount ?? 0) >= 2) confidence += 4

  const age = daysSince(input.signalDate)
  if (age > 60) confidence -= 15
  else if (age > 30) confidence -= 8

  if (input.signalType === 'award') confidence -= 6

  return Math.max(0, Math.min(100, Math.round(confidence)))
}

export function computePersonaRelevance(signalType: string, context: SignalProfileContext): number {
  const group = inferPersonaGroup(context)
  const weights = SIGNAL_PERSONA_WEIGHTS[group]
  const base = weights[signalType] ?? 6
  return Math.max(0, Math.min(100, 60 + base * 2))
}

export function shouldSuppressSignal(input: {
  confidence: number
  signalDate: string
  signalType: string
  duplicateKeySeen: boolean
}): { suppressed: boolean; reason: string | null } {
  if (input.duplicateKeySeen) return { suppressed: true, reason: 'duplicate' }

  const age = daysSince(input.signalDate)
  if (age > 120) return { suppressed: true, reason: 'stale' }

  if (input.confidence < 45) return { suppressed: true, reason: 'low_confidence' }

  if (input.signalType === 'award' && input.confidence < 60) {
    return { suppressed: true, reason: 'low_signal_value' }
  }

  return { suppressed: false, reason: null }
}

export function enrichSignalProfileContext(context: SignalProfileContext): {
  profileChannel: string
  profilePersona: string
} {
  const profileChannel = inferChannel(context.roleType, context.searchPersona)
  const profilePersona = (context.searchPersona ?? '').trim() || inferPersonaGroup(context)
  return { profileChannel, profilePersona }
}

export function rankSignals<T extends RankedSignalInput>(
  signals: T[],
  context: SignalProfileContext,
  options?: { includeSuppressed?: boolean },
): RankedSignalResult<T>[] {
  const seen = new Set<string>()
  const ranked: RankedSignalResult<T>[] = []

  for (const signal of signals) {
    const duplicateKey = signal.source_url
      ? `${signal.signal_type}:${signal.source_url}`
      : `${signal.signal_type}:${signal.signal_summary.slice(0, 80).toLowerCase()}`

    const confidence = computeSignalConfidence({
      signalType: signal.signal_type,
      sourceKind: signal.source_kind,
      hasSourceUrl: !!signal.source_url,
      evidenceCount: signal.focus_tags?.length ?? 0,
      explicitConfidence: signal.confidence,
      signalDate: signal.signal_date,
    })

    const relevance = computePersonaRelevance(signal.signal_type, {
      roleType: context.roleType,
      searchPersona: context.searchPersona,
    })

    const freshness = freshnessScore(signal.signal_date)
    const suppression = shouldSuppressSignal({
      confidence,
      signalDate: signal.signal_date,
      signalType: signal.signal_type,
      duplicateKeySeen: seen.has(duplicateKey),
    })

    seen.add(duplicateKey)

    const score = Math.round(confidence * 0.5 + relevance * 0.35 + freshness * 1.5)

    ranked.push({
      signal,
      confidence,
      relevance,
      freshness,
      score,
      suppressed: suppression.suppressed,
      suppressionReason: suppression.reason,
    })
  }

  const filtered = options?.includeSuppressed ? ranked : ranked.filter((r) => !r.suppressed)
  return filtered.sort((a, b) => b.score - a.score)
}
