import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { buildOutreachTemplateDraft } from '@/lib/outreach/template-draft'

export type CsvRow = Record<string, string>
export type OutreachChannel = 'executives' | 'search_firms' | 'coaches' | 'outplacement_firms'
export type EmailConfidence = 'high' | 'medium' | 'low'

type CsvSummary = {
  rowCount: number
  rows: CsvRow[]
}

export type ClientRow = {
  fullName: string
  roleBucket: string
  company: string
  email: string
  emailConfidence: EmailConfidence
  status: string
  followUpSent: boolean
  hasLiveOutreach: boolean
  emailOpening: string
  emailBodyCore: string
  defaultSubject: string
  defaultBody: string
  outreachChannel: OutreachChannel
  fitTier: 'strong' | 'medium'
  personaFocus: string
  campaignTag?: 'coach_day1_60'
}

async function findSuffixCompatibleFile(baseDir: string, requestedName: string): Promise<string | null> {
  const firstUnderscore = requestedName.indexOf('_')
  if (firstUnderscore < 0) return null

  const suffix = requestedName.slice(firstUnderscore + 1)
  try {
    const entries = await readdir(baseDir, { withFileTypes: true })
    const match = entries.find((entry) => entry.isFile() && entry.name.endsWith(suffix))
    return match?.name ?? null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function readCsvFromDirectory(baseDir: string, fileName: string): Promise<CsvSummary | null> {
  const directPath = path.join(baseDir, fileName)
  try {
    return parseCsv(await readFile(/* turbopackIgnore: true */ directPath, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const fallbackName = await findSuffixCompatibleFile(baseDir, fileName)
  if (!fallbackName) return null

  return parseCsv(await readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ baseDir, fallbackName), 'utf8'))
}

function normalizeKeyToken(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompanyDedupeKey(value: string | undefined): string {
  return normalizeKeyToken(value)
    .replace(/\b(inc|incorporated|corp|corporation|co|company|group|holdings|plc|llc|ltd|limited|partners|partner|firm)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function statusPriority(status: string): number {
  if (status === 'meeting_scheduled') return 5
  if (status === 'in_conversation') return 4
  if (status === 'reached_out') return 3
  if (status === 'prospect') return 2
  if (status === 'closed') return 1
  return 0
}

function rowPriority(row: ClientRow): number {
  let score = 0
  score += row.fitTier === 'strong' ? 200 : 100
  score += emailConfidenceRank(row.emailConfidence) * 10
  score += statusPriority(normalizeStatus(row.status))
  if (row.campaignTag === 'coach_day1_60') score += 1
  return score
}

function preferRow(existing: ClientRow, candidate: ClientRow): ClientRow {
  const existingPriority = rowPriority(existing)
  const candidatePriority = rowPriority(candidate)
  if (candidatePriority > existingPriority) return candidate
  if (candidatePriority < existingPriority) return existing
  return existing
}

/**
 * Dedupe across two scopes:
 * 1) email-level dedupe (exact canonical email)
 * 2) person/company dedupe within the same outreach channel
 */
export function dedupeOutreachRows(rows: ClientRow[]): ClientRow[] {
  const byEmail = new Map<string, ClientRow>()

  for (const row of rows) {
    const emailKey = (row.email ?? '').trim().toLowerCase()
    if (!emailKey) continue

    const existing = byEmail.get(emailKey)
    if (!existing) {
      byEmail.set(emailKey, row)
      continue
    }

    byEmail.set(emailKey, preferRow(existing, row))
  }

  const byPersonCompany = new Map<string, ClientRow>()
  for (const row of byEmail.values()) {
    const normalizedName = normalizeKeyToken(row.fullName)
    const normalizedCompany = normalizeCompanyDedupeKey(row.company)
    const personCompanyKey = normalizedName && normalizedCompany
      ? `${row.outreachChannel}::${normalizedName}::${normalizedCompany}`
      : `${row.outreachChannel}::${row.email}`

    const existing = byPersonCompany.get(personCompanyKey)
    if (!existing) {
      byPersonCompany.set(personCompanyKey, row)
      continue
    }

    byPersonCompany.set(personCompanyKey, preferRow(existing, row))
  }

  return Array.from(byPersonCompany.values())
}

export type ContactStatusRow = {
  email: string | null
  outreach_status: string | null
}

type ExecutiveRoleArchetype =
  | 'cfo'
  | 'coo'
  | 'cio'
  | 'cto'
  | 'chro'
  | 'cro'
  | 'ciso'
  | 'cdo'
  | 'c_suite_other'

export async function readOutreachCsv(fileName: string): Promise<CsvSummary> {
  const sourceDir = path.join(process.cwd(), 'docs', 'outreach')
  const packagedDir = path.join(process.cwd(), '.next', 'server', 'outreach-data')

  const sourceResult = await readCsvFromDirectory(sourceDir, fileName)
  if (sourceResult) return sourceResult

  const packagedResult = await readCsvFromDirectory(packagedDir, fileName)
  if (packagedResult) return packagedResult

  console.warn(`[outreach] CSV unavailable: ${fileName}`)
  return { rowCount: 0, rows: [] }
}

export function prioritizeCuratedRows(base: CsvSummary, curated: CsvSummary, limit = 100): CsvSummary {
  const seenEmails = new Set<string>()
  const prioritized: CsvRow[] = []

  for (const row of [...curated.rows, ...base.rows]) {
    const email = (row.email_guess ?? row.email ?? '').trim().toLowerCase()
    if (!email || seenEmails.has(email)) continue
    seenEmails.add(email)
    prioritized.push(row)
    if (prioritized.length >= limit) break
  }

  return {
    rowCount: prioritized.length,
    rows: prioritized,
  }
}

function parseCsv(content: string): CsvSummary {
  if (!content.trim()) {
    return { rowCount: 0, rows: [] }
  }

  const records: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (ch === ',' && !inQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i++
      row.push(current)
      current = ''
      if (row.some(cell => cell.length > 0)) {
        records.push(row)
      }
      row = []
      continue
    }

    current += ch
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current)
    if (row.some(cell => cell.length > 0)) {
      records.push(row)
    }
  }

  if (records.length === 0) {
    return { rowCount: 0, rows: [] }
  }

  const [headers, ...lines] = records
  const rows = lines.map((cols) => {
    const mapped: CsvRow = {}
    for (let i = 0; i < headers.length; i++) {
      mapped[headers[i]] = cols[i] ?? ''
    }
    return mapped
  })

  return { rowCount: rows.length, rows }
}

export function normalizeStatus(raw: string | undefined): string {
  const status = (raw ?? '').trim().toLowerCase()
  if (status === 'new') return 'prospect'
  if (status === 'first_sent' || status === 'followup_1_sent' || status === 'followup_2_sent') return 'reached_out'
  if (status === 'replied') return 'in_conversation'
  if (status === 'meeting_booked') return 'meeting_scheduled'
  if (status === 'not_a_fit') return 'closed'
  if (['prospect', 'reached_out', 'in_conversation', 'meeting_scheduled', 'closed'].includes(status)) return status
  return 'prospect'
}

function buildDefaultBody(row: CsvRow): string {
  const opening = row.email_opening?.trim() || `I noticed your role at ${row.company} and wanted to send a short, specific note.`
  const core = row.email_body_core?.trim() || 'I work on executive positioning and outreach for senior operators navigating high-stakes transitions.'

  return [
    opening,
    '',
    core,
    '',
    'If useful, I can send a concise follow-up with one specific angle tailored to your priorities.',
    '',
    'Best,',
    'Rich Rothschild',
    'startingmonday.app',
  ].join('\n')
}

function firstNameOf(fullName: string | undefined): string {
  const value = (fullName ?? '').trim()
  if (!value) return 'there'
  const first = value.split(/\s+/)[0]?.trim()
  return first || 'there'
}

function detectExecutiveRoleArchetype(row: CsvRow): ExecutiveRoleArchetype | null {
  const role = canonicalizeLabel(row.role_bucket)
  const title = canonicalizeLabel(row.title)
  const combined = `${role} ${title}`.trim()

  if (!combined) return null

  if (combined.includes('cfo') || combined.includes('chief financial officer')) return 'cfo'
  if (combined.includes('coo') || combined.includes('chief operating officer')) return 'coo'
  if (combined.includes('cio') || combined.includes('chief information officer')) return 'cio'
  if (combined.includes('cto') || combined.includes('chief technology officer')) return 'cto'
  if (combined.includes('chro') || combined.includes('chief human resources officer') || combined.includes('chief people officer')) return 'chro'
  if (combined.includes('cro') || combined.includes('chief revenue officer')) return 'cro'
  if (combined.includes('ciso') || combined.includes('chief information security officer')) return 'ciso'
  if (combined.includes('cdo') || combined.includes('chief data officer') || combined.includes('chief analytics officer')) return 'cdo'

  const cSuiteSignals = ['chief', 'ceo', 'president']
  if (cSuiteSignals.some(signal => combined.includes(signal))) return 'c_suite_other'
  return null
}

function executiveRoleLabel(archetype: ExecutiveRoleArchetype): string {
  if (archetype === 'cfo') return 'CFO'
  if (archetype === 'coo') return 'COO'
  if (archetype === 'cio') return 'CIO'
  if (archetype === 'cto') return 'CTO'
  if (archetype === 'chro') return 'CHRO'
  if (archetype === 'cro') return 'CRO'
  if (archetype === 'ciso') return 'CISO'
  if (archetype === 'cdo') return 'CDO'
  return 'C-suite'
}

function companyToken(company: string | undefined): string {
  const value = (company ?? '').trim()
  return value || 'your organization'
}

function firstNonEmpty(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = (row[key] ?? '').trim()
    if (value) return value
  }
  return ''
}

export function mapTriggerInputs(row: CsvRow): {
  newsTrigger?: string
  postTrigger?: string
  profileTrigger?: string
} {
  const newsTrigger = firstNonEmpty(row, [
    'trigger_news',
    'news_trigger',
    'recent_news',
    'news_event',
    'company_news',
    'news_summary',
  ])

  const postTrigger = firstNonEmpty(row, [
    'trigger_post',
    'post_trigger',
    'recent_post',
    'linkedin_post',
    'social_post',
    'post_summary',
  ])

  const profileTrigger = firstNonEmpty(row, [
    'trigger_profile',
    'profile_trigger',
    'profile_signal',
    'personalization_line',
    'profile_note',
    'contact_note',
    'notes',
  ])

  return {
    ...(newsTrigger ? { newsTrigger } : {}),
    ...(postTrigger ? { postTrigger } : {}),
    ...(profileTrigger ? { profileTrigger } : {}),
  }
}

function sourceTemplateDraft(row: CsvRow): { subject: string; body: string } | null {
  const subject = (row.default_subject ?? row.subject ?? row.email_subject ?? '').trim()
  const body = (row.default_body ?? row.email_body ?? row.email_text ?? row.email_body_core ?? '').trim()

  if (!subject && !body) return null

  return {
    subject: subject || buildDefaultSubject(row),
    body: body || buildDefaultBody(row),
  }
}

export function buildStandardizedDraft(
  row: CsvRow,
  channel: OutreachChannel,
  options?: { forceTemplate?: boolean },
): { subject: string; body: string } {
  void options

  const firstName = firstNameOf(row.full_name)
  const company = companyToken(row.company)
  const archetype = detectExecutiveRoleArchetype(row)
  const roleLabel = archetype ? executiveRoleLabel(archetype) : (row.role_bucket || 'Executive')
  const triggers = mapTriggerInputs(row)

  const draft = buildOutreachTemplateDraft({
    channel,
    fullName: row.full_name,
    firstName,
    company,
    roleLabel,
    focus: row.persona_focus || row.role_bucket || row.title || roleLabel,
    step: row.step,
    state: row.state,
    newsTrigger: triggers.newsTrigger,
    postTrigger: triggers.postTrigger,
    profileTrigger: triggers.profileTrigger,
  })

  return {
    subject: draft.subject,
    body: draft.body,
  }
}

function buildDefaultSubject(row: CsvRow): string {
  const role = row.role_bucket?.toUpperCase() || 'Executive'
  return `A specific ${role} angle for ${row.company}`
}

export function normalizeFitTier(raw: string | undefined): 'strong' | 'medium' {
  const fit = (raw ?? '').trim().toLowerCase()
  return fit === 'medium' ? 'medium' : 'strong'
}

function canonicalizeLabel(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeCompanyKey(value: string | undefined): string {
  return canonicalizeLabel(value)
    .replace(/\b(inc|incorporated|corp|corporation|co|company|group|holdings|plc|llc|ltd|limited|communications)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseCompanySizeBand(value: string | undefined): 'target' | 'other' | 'unknown' {
  const normalized = canonicalizeLabel(value)
  if (!normalized) return 'unknown'

  if (normalized.includes('1001 10000')) return 'target'
  if (normalized.includes('10001')) return 'other'
  if (normalized.includes('enterprise') || normalized.includes('startup') || normalized.includes('small')) return 'other'

  const numeric = Number(normalized.replace(/[^0-9]/g, ''))
  if (Number.isFinite(numeric) && numeric > 0) {
    if (numeric > 1000 && numeric < 10000) return 'target'
    return 'other'
  }

  return 'unknown'
}

function roleTokens(value: string): Set<string> {
  const normalized = canonicalizeLabel(value)
  const roles = new Set<string>()

  if (!normalized) return roles

  const add = (...items: string[]) => items.forEach(item => roles.add(item))

  if (normalized.includes('cfo') || normalized.includes('chief financial officer')) add('cfo', 'chief financial officer')
  if (normalized.includes('coo') || normalized.includes('chief operating officer')) add('coo', 'chief operating officer')
  if (normalized.includes('cio') || normalized.includes('chief information officer')) add('cio', 'chief information officer')
  if (normalized.includes('chro') || normalized.includes('chief human resources officer') || normalized.includes('chief people officer')) add('chro', 'chief people officer')
  if (normalized.includes('cro') || normalized.includes('chief revenue officer')) add('cro', 'chief revenue officer')
  if (normalized.includes('cto') || normalized.includes('chief technology officer')) add('cto', 'chief technology officer')
  if (normalized.includes('ciso') || normalized.includes('chief information security officer')) add('ciso', 'chief information security officer')
  if (normalized.includes('cdo') || normalized.includes('chief data officer')) add('cdo', 'chief data officer')
  if (normalized.includes('chief analytics officer')) add('chief analytics officer')
  if (normalized.includes('vp it') || normalized.includes('vp information technology')) add('vp it', 'vp information technology')
  if (normalized.includes('vp sales')) add('vp sales')
  if (normalized.includes('vp revenue')) add('vp revenue')
  if (normalized.includes('vp technology')) add('vp technology')
  if (normalized.includes('vp engineering')) add('vp engineering')

  if (roles.size === 0) {
    roles.add(normalized)
  }

  return roles
}

export function buildExecutiveFitLookup(rows: CsvRow[]): Map<string, Map<string, 'strong' | 'medium'>> {
  const lookup = new Map<string, Map<string, 'strong' | 'medium'>>()

  for (const row of rows) {
    const companyKey = normalizeCompanyKey(row.target_account ?? row.company)
    const title = row.target_title ?? row.title ?? row.role_bucket
    const fitTier = normalizeFitTier(row.fit_tier)
    const roleSet = roleTokens(title ?? '')

    if (!companyKey || roleSet.size === 0) continue

    const companyRoles = lookup.get(companyKey) ?? new Map<string, 'strong' | 'medium'>()
    for (const role of roleSet) {
      const existing = companyRoles.get(role)
      if (existing === 'strong') continue
      companyRoles.set(role, fitTier)
    }
    lookup.set(companyKey, companyRoles)
  }

  return lookup
}

export function buildExecutiveCompanySizeLookup(rows: CsvRow[]): Map<string, 'target' | 'other'> {
  const lookup = new Map<string, 'target' | 'other'>()

  for (const row of rows) {
    const companyKey = normalizeCompanyKey(row.target_account ?? row.company)
    const sizeBand = parseCompanySizeBand(row.company_size_band ?? row.company_size)
    if (!companyKey || sizeBand === 'unknown') continue

    const existing = lookup.get(companyKey)
    if (existing === 'target') continue
    lookup.set(companyKey, sizeBand)
  }

  return lookup
}

export function executivePersonaFit(
  row: CsvRow,
  fitLookup: Map<string, Map<string, 'strong' | 'medium'>>,
  companySizeLookup: Map<string, 'target' | 'other'>,
): 'strong' | 'medium' | null {
  const companyKey = normalizeCompanyKey(row.company)
  const companySizeFromRow = parseCompanySizeBand(row.company_size_band ?? row.company_size)
  const companySize = companySizeFromRow === 'unknown' ? (companySizeLookup.get(companyKey) ?? 'unknown') : companySizeFromRow

  if (companySize !== 'target') return null

  const explicitFit = (row.fit_tier ?? '').trim().toLowerCase()
  if (explicitFit === 'strong' || explicitFit === 'medium') return explicitFit

  const roleCandidates = roleTokens(`${row.role_bucket ?? ''} ${row.title ?? ''}`)

  if (companyKey && roleCandidates.size > 0) {
    const companyRoles = fitLookup.get(companyKey)
    if (companyRoles) {
      for (const role of roleCandidates) {
        const matched = companyRoles.get(role)
        if (matched) return matched
      }
    }
  }

  const role = canonicalizeLabel(row.role_bucket)
  const title = canonicalizeLabel(row.title)
  const combined = `${role} ${title}`.trim()

  const strongSignals = [
    'cfo',
    'coo',
    'cio',
    'chro',
    'chief people officer',
    'cro',
    'chief revenue officer',
    'vp it',
    'vp information technology',
    'vp sales',
    'vp revenue',
  ]

  const mediumSignals = [
    'cto',
    'vp technology',
    'vp engineering',
    'ciso',
    'chief information security officer',
    'cdo',
    'chief data officer',
    'chief analytics officer',
  ]

  let score = 0

  if (strongSignals.some(signal => combined.includes(signal))) score += 70
  if (mediumSignals.some(signal => combined.includes(signal))) score += 45

  const sourceType = canonicalizeLabel(row.source_type)
  if (sourceType.includes('leadership') || sourceType.includes('investor') || sourceType.includes('company')) {
    score += 10
  }

  const confidence = (row.confidence ?? row.email_confidence ?? '').trim().toLowerCase()
  if (confidence === 'high') score += 10
  if (confidence === 'medium') score += 5

  if (score >= 70) return 'strong'
  if (score >= 45) return 'medium'
  return null
}

function normalizeEmailConfidence(raw: string | undefined): EmailConfidence | null {
  const confidence = (raw ?? '').trim().toLowerCase()
  if (confidence === 'high' || confidence === 'medium' || confidence === 'low') return confidence
  return null
}

export function inferEmailConfidence(row: CsvRow): EmailConfidence {
  const explicit = normalizeEmailConfidence(row.email_confidence)
  if (explicit) return explicit

  const email = (row.email_guess ?? row.email ?? '').trim().toLowerCase()
  const company = (row.company ?? '').trim().toLowerCase()
  const sourceType = (row.source_type ?? '').trim().toLowerCase()

  const domain = email.includes('@') ? email.split('@')[1] : ''
  const domainRoot = domain.split('.')[0] ?? ''
  const freeEmailDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'])
  if (!domain || freeEmailDomains.has(domain)) return 'low'

  const stopWords = new Set(['inc', 'llc', 'ltd', 'group', 'partners', 'partner', 'search', 'executive', 'leadership', 'advisors'])
  const companyTokens = company
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 4 && !stopWords.has(token))

  const domainMatchesCompany = companyTokens.some(token => domainRoot.includes(token) || token.includes(domainRoot))

  if (sourceType.includes('verified')) return 'high'
  if (sourceType.includes('curated') && domainMatchesCompany) return 'high'
  if (sourceType.includes('inferred') && domainMatchesCompany) return 'medium'
  if (domainMatchesCompany) return 'high'
  if (sourceType.includes('inferred')) return 'low'
  return 'medium'
}

export function emailConfidenceRank(confidence: EmailConfidence): number {
  if (confidence === 'high') return 3
  if (confidence === 'medium') return 2
  return 1
}

export function mergeFirstTouch(master: CsvSummary, firstTouch: CsvSummary): CsvSummary {
  const byName = new Map<string, CsvRow>()
  for (const row of firstTouch.rows) {
    byName.set((row.full_name ?? '').trim().toLowerCase(), row)
  }

  const merged = master.rows.map((row) => {
    const touch = byName.get((row.full_name ?? '').trim().toLowerCase())
    return {
      ...row,
      // Keep matching metadata from first-touch rows, but do not carry forward
      // legacy subject/body copy as defaults.
      ...(touch ? touch : {}),
      default_subject: buildDefaultSubject(row),
      default_body: buildDefaultBody(row),
    }
  })

  return { rowCount: merged.length, rows: merged }
}

function rowCompletenessScore(row: CsvRow): number {
  const fields = [
    row.email_guess,
    row.email,
    row.role_bucket,
    row.title,
    row.default_subject,
    row.default_body,
    row.subject,
    row.email_text,
    row.email_opening,
    row.email_body_core,
    row.personalization_line,
    row.persona_focus,
  ]
  return fields.reduce((sum, value) => sum + ((value ?? '').trim().length > 0 ? 1 : 0), 0)
}

function normalizeExecutiveRow(row: CsvRow): CsvRow {
  return {
    ...row,
    default_subject: (row.default_subject ?? '').trim() || (row.subject ?? '').trim(),
    default_body: (row.default_body ?? '').trim() || (row.email_text ?? '').trim(),
    email_opening: (row.email_opening ?? '').trim() || (row.personalization_line ?? '').trim(),
    email_body_core: (row.email_body_core ?? '').trim() || (row.email_text ?? '').trim(),
  }
}

export function combineExecutiveSources(sources: CsvSummary[]): CsvSummary {
  const byKey = new Map<string, CsvRow>()

  for (const source of sources) {
    for (const rawRow of source.rows) {
      const row = normalizeExecutiveRow(rawRow)
      const email = (row.email_guess ?? row.email ?? '').trim().toLowerCase()
      const fallbackKey = `${(row.full_name ?? '').trim().toLowerCase()}|${(row.company ?? '').trim().toLowerCase()}`
      const key = email || fallbackKey
      if (!key) continue

      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, row)
        continue
      }

      if (rowCompletenessScore(row) > rowCompletenessScore(existing)) {
        byKey.set(key, row)
      }
    }
  }

  const rows = Array.from(byKey.values())
  return { rowCount: rows.length, rows }
}

export function statusByEmail(rows: ContactStatusRow[]): Map<string, string> {
  const byEmail = new Map<string, string>()
  for (const row of rows) {
    const email = (row.email ?? '').trim().toLowerCase()
    if (!email) continue
    byEmail.set(email, normalizeStatus(row.outreach_status ?? 'prospect'))
  }
  return byEmail
}

export function followUpSentByEmail(rows: ContactStatusRow[]): Set<string> {
  const sent = new Set<string>()
  for (const row of rows) {
    const email = (row.email ?? '').trim().toLowerCase()
    const status = (row.outreach_status ?? '').trim().toLowerCase()
    if (!email) continue
    if (status === 'followup_1_sent' || status === 'followup_2_sent') {
      sent.add(email)
    }
  }
  return sent
}