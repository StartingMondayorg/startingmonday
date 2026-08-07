export type PharmaRoleFamily =
  | 'clinical_operations'
  | 'commercial_operations'
  | 'strategy_operations'
  | 'program_management'
  | 'business_development'
  | 'regulatory'
  | 'leadership'

export type PharmaSignalInput = {
  title: string
  companyName: string
  description: string
  sourceCategory: string
  roleFamily: PharmaRoleFamily
  recencyDays?: number
}

export type PharmaSignalInputFromSignal = {
  signalType?: string | null
  companyName?: string | null
  description?: string | null
  sourceKind?: string | null
  signalDate?: string | null
}

export type PharmaSignalScore = {
  score: number
  confidenceTier: 'high' | 'medium' | 'low'
  isPharmaRelevant: boolean
  reasons: string[]
}

const pharmaKeywords = [
  'pharma',
  'biotech',
  'life sciences',
  'clinical',
  'oncology',
  'regulatory',
  'fda',
  'ema',
  'cell therapy',
  'gene therapy',
  'manufacturing',
  'commercial operations',
  'clinical operations',
  'drug',
  'trial',
  'medical',
  'healthcare',
]

const roleFamilyWeights: Record<PharmaRoleFamily, number> = {
  clinical_operations: 22,
  commercial_operations: 18,
  strategy_operations: 16,
  program_management: 14,
  business_development: 14,
  regulatory: 20,
  leadership: 10,
}

const sourceBoosts: Record<string, number> = {
  job_posting: 18,
  regulatory_calendar: 24,
  funding: 16,
  partnership: 16,
  company_press_releases: 4,
  sec_filings_8k_10k_10q: 6,
  google_news: 2,
  pr_wire: 3,
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim()
}

function countKeywordMatches(text: string): number {
  const normalized = normalizeText(text)
  return pharmaKeywords.reduce((count, keyword) => {
    return normalized.includes(keyword) ? count + 1 : count
  }, 0)
}

function getRecencyBoost(days?: number): number {
  if (!days || days <= 0) return 0
  if (days <= 7) return 8
  if (days <= 30) return 4
  return 0
}

export function scorePharmaSignal(input: PharmaSignalInput): PharmaSignalScore {
  const text = [input.title, input.companyName, input.description].join(' ')
  const keywordMatches = countKeywordMatches(text)
  const roleWeight = roleFamilyWeights[input.roleFamily] ?? 0
  const sourceBoost = sourceBoosts[input.sourceCategory] ?? 0
  const recencyBoost = getRecencyBoost(input.recencyDays)

  let score = 20 + roleWeight + sourceBoost + recencyBoost + keywordMatches * 6

  const reasons: string[] = []
  if (keywordMatches > 0) reasons.push(`matched ${keywordMatches} pharma keyword(s)`)
  if (roleWeight > 0) reasons.push(`role family weight ${roleWeight}`)
  if (sourceBoost > 0) reasons.push(`source boost ${sourceBoost}`)
  if (recencyBoost > 0) reasons.push(`recent signal boost ${recencyBoost}`)

  const isPharmaRelevant = keywordMatches >= 1 || roleWeight >= 16 || score >= 60
  const confidenceTier: PharmaSignalScore['confidenceTier'] = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'

  if (!isPharmaRelevant && score < 40) {
    score = Math.min(score, 35)
  }

  return {
    score,
    confidenceTier,
    isPharmaRelevant,
    reasons,
  }
}

export function shouldSurfacePharmaSignal(input: PharmaSignalInput): boolean {
  const result = scorePharmaSignal(input)
  return result.isPharmaRelevant && result.confidenceTier !== 'low'
}

export function buildPharmaSignalInputFromSignal(signal: PharmaSignalInputFromSignal): PharmaSignalInput {
  const title = signal.signalType ?? 'signal'
  const companyName = signal.companyName ?? ''
  const description = signal.description ?? ''
  const sourceCategory = signal.sourceKind ?? 'company_press_releases'

  const roleFamily: PharmaRoleFamily = /clinical|trial|regulatory|fda|ema|therapy|medical|oncology|manufacturing/i.test(description)
    ? 'clinical_operations'
    : /commercial|product|launch|partnership|business/i.test(description)
      ? 'commercial_operations'
      : 'leadership'

  return {
    title,
    companyName,
    description,
    sourceCategory,
    roleFamily,
    recencyDays: signal.signalDate ? Math.max(0, Math.floor((Date.now() - new Date(signal.signalDate).getTime()) / 86400000)) : undefined,
  }
}
