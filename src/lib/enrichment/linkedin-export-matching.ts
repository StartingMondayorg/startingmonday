export type MatchMethod =
  | 'profile_url_exact'
  | 'email_exact'
  | 'name_exact_company_fuzzy'
  | 'name_company_fuzzy'

export type MatchTier = 'strong_overlap' | 'possible_overlap' | 'rejected'

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
}

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

function pickMethod(connection: LinkedInExportConnection, candidate: RelationshipCandidate, namesMatch: boolean): MatchMethod {
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

  if (namesMatch) {
    return 'name_exact_company_fuzzy'
  }

  return 'name_company_fuzzy'
}

function namesMatch(connection: LinkedInExportConnection, candidate: RelationshipCandidate): boolean {
  const left = normalizePersonName(connection.fullName)
  const right = normalizePersonName(candidate.fullName)
  if (!left || !right) return false
  if (left === right) return true

  const leftTokens = tokenize(left)
  const rightTokens = tokenize(right)
  return leftTokens.length >= 2
    && rightTokens.length >= 2
    && leftTokens[0] === rightTokens[0]
    && leftTokens[leftTokens.length - 1] === rightTokens[rightTokens.length - 1]
}

function companiesMatch(connection: LinkedInExportConnection, candidate: RelationshipCandidate): boolean {
  const left = normalizeCompanyName(connection.company)
  const right = normalizeCompanyName(candidate.company)
  return Boolean(left && right && left === right)
}

function classifyMatchTier(method: MatchMethod, hasNameMatch: boolean, hasCompanyMatch: boolean): MatchTier {
  if (method === 'profile_url_exact' || method === 'email_exact') {
    return 'strong_overlap'
  }

  if (hasNameMatch && hasCompanyMatch) return 'strong_overlap'
  if (hasNameMatch || hasCompanyMatch) return 'possible_overlap'
  return 'rejected'
}

export function buildMatchDecision(connection: LinkedInExportConnection, candidate: RelationshipCandidate): MatchDecision {
  const hasNameMatch = namesMatch(connection, candidate)
  const hasCompanyMatch = companiesMatch(connection, candidate)
  const method = pickMethod(connection, candidate, hasNameMatch)
  const tier = classifyMatchTier(method, hasNameMatch, hasCompanyMatch)

  return {
    method,
    tier,
  }
}
