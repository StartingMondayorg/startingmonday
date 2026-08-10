export type MatchMethod =
  | 'profile_url_exact'
  | 'email_exact'
  | 'name_exact_company_fuzzy'
  | 'name_company_fuzzy'

export type MatchTier = 'high' | 'medium' | 'low' | 'rejected'

export type LinkedInExportConnection = {
  fullName: string
  company: string | null
  profileUrl?: string | null
  email?: string | null
}

export type RelationshipCandidate = {
  fullName: string
  company: string | null
  profileUrl?: string | null
  email?: string | null
}

export type MatchDecision = {
  method: MatchMethod
  tier: MatchTier
  nameSimilarity: number
  companySimilarity: number
  overallScore: number
}

export const LINKEDIN_MATCH_THRESHOLDS = {
  high: { name: 0.96, company: 0.92 },
  medium: { name: 0.9, company: 0.8 },
  low: { name: 0.84, company: 0.7 },
} as const

const COMPANY_STOP_WORDS = new Set([
  'inc',
  'incorporated',
  'llc',
  'ltd',
  'limited',
  'corp',
  'corporation',
  'co',
  'company',
  'holdings',
  'group',
])

const NAME_STOP_WORDS = new Set(['mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'ii', 'iii', 'iv'])

function stripDiacritics(input: string): string {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeAlphaNumSpaces(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokenize(input: string): string[] {
  if (!input) return []
  return input.split(' ').filter(Boolean)
}

export function normalizePersonName(input: string): string {
  const raw = normalizeAlphaNumSpaces(input)
  const tokens = tokenize(raw).filter((t) => !NAME_STOP_WORDS.has(t))
  return tokens.join(' ')
}

export function normalizeCompanyName(input: string | null): string {
  if (!input) return ''
  const raw = normalizeAlphaNumSpaces(input)
  const tokens = tokenize(raw).filter((t) => !COMPANY_STOP_WORDS.has(t))
  if (tokens[0] === 'the') {
    tokens.shift()
  }
  return tokens.join(' ')
}

function bigrams(input: string): string[] {
  if (input.length < 2) return input ? [input] : []
  const grams: string[] = []
  for (let i = 0; i < input.length - 1; i += 1) {
    grams.push(input.slice(i, i + 2))
  }
  return grams
}

function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const aBigrams = bigrams(a)
  const bBigrams = bigrams(b)
  const counts = new Map<string, number>()

  for (const gram of aBigrams) {
    counts.set(gram, (counts.get(gram) ?? 0) + 1)
  }

  let overlap = 0
  for (const gram of bBigrams) {
    const count = counts.get(gram) ?? 0
    if (count > 0) {
      overlap += 1
      counts.set(gram, count - 1)
    }
  }

  return (2 * overlap) / (aBigrams.length + bBigrams.length)
}

function tokenJaccard(a: string, b: string): number {
  const aSet = new Set(tokenize(a))
  const bSet = new Set(tokenize(b))
  if (aSet.size === 0 || bSet.size === 0) return 0

  let intersection = 0
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1
  }

  const union = aSet.size + bSet.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function scoreNameSimilarity(a: string, b: string): number {
  const left = normalizePersonName(a)
  const right = normalizePersonName(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const dice = diceCoefficient(left, right)
  const jaccard = tokenJaccard(left, right)
  return Number((dice * 0.65 + jaccard * 0.35).toFixed(4))
}

export function scoreCompanySimilarity(a: string | null, b: string | null): number {
  const left = normalizeCompanyName(a)
  const right = normalizeCompanyName(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const dice = diceCoefficient(left, right)
  const jaccard = tokenJaccard(left, right)
  return Number((dice * 0.6 + jaccard * 0.4).toFixed(4))
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

function pickMethod(connection: LinkedInExportConnection, candidate: RelationshipCandidate, nameScore: number): MatchMethod {
  const exportProfile = normalizeUrl(connection.profileUrl)
  const candidateProfile = normalizeUrl(candidate.profileUrl)
  if (exportProfile && candidateProfile && exportProfile === candidateProfile) {
    return 'profile_url_exact'
  }

  const exportEmail = normalizeEmail(connection.email)
  const candidateEmail = normalizeEmail(candidate.email)
  if (exportEmail && candidateEmail && exportEmail === candidateEmail) {
    return 'email_exact'
  }

  if (nameScore === 1) {
    return 'name_exact_company_fuzzy'
  }

  return 'name_company_fuzzy'
}

export function classifyMatchTier(method: MatchMethod, nameSimilarity: number, companySimilarity: number): MatchTier {
  if (method === 'profile_url_exact' || method === 'email_exact') {
    return 'high'
  }

  if (nameSimilarity >= LINKEDIN_MATCH_THRESHOLDS.high.name && companySimilarity >= LINKEDIN_MATCH_THRESHOLDS.high.company) {
    return 'high'
  }

  if (nameSimilarity >= LINKEDIN_MATCH_THRESHOLDS.medium.name && companySimilarity >= LINKEDIN_MATCH_THRESHOLDS.medium.company) {
    return 'medium'
  }

  if (nameSimilarity >= LINKEDIN_MATCH_THRESHOLDS.low.name && companySimilarity >= LINKEDIN_MATCH_THRESHOLDS.low.company) {
    return 'low'
  }

  return 'rejected'
}

export function buildMatchDecision(connection: LinkedInExportConnection, candidate: RelationshipCandidate): MatchDecision {
  const nameSimilarity = scoreNameSimilarity(connection.fullName, candidate.fullName)
  const companySimilarity = scoreCompanySimilarity(connection.company, candidate.company)
  const method = pickMethod(connection, candidate, nameSimilarity)

  const overallScore = Number((nameSimilarity * 0.72 + companySimilarity * 0.28).toFixed(4))
  const tier = classifyMatchTier(method, nameSimilarity, companySimilarity)

  return {
    method,
    tier,
    nameSimilarity,
    companySimilarity,
    overallScore,
  }
}
