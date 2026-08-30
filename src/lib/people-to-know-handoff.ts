export const PEOPLE_TO_KNOW_TRUST_COPY = [
  'We verify who matters from public sources. Their contact details stay theirs',
  String.fromCharCode(0x2014),
  'reach out through LinkedIn or your own tools.',
].join(' ')

export const APOLLO_PEOPLE_URL = 'https://app.apollo.io/#/people'

export type PeopleToKnowHandoff = {
  companyName: string
  roleTitle: string
  whyThem: string
}

type HandoffEnvironment = Partial<Record<'LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED', string>>

export function peopleToKnowHandoffEnabled(
  env: HandoffEnvironment = process.env as HandoffEnvironment,
): boolean {
  return ['1', 'true'].includes(env.LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED?.trim().toLowerCase() ?? '')
}

export function buildLinkedInPeopleSearchUrl(input: {
  companyName: string
  roleTitle: string
  verifiedName?: string | null
}): string | null {
  const companyName = input.companyName.trim()
  const roleTitle = input.roleTitle.trim()
  const verifiedName = input.verifiedName?.trim()
  const keywords = verifiedName
    ? [verifiedName, companyName].filter(Boolean).join(' ')
    : [roleTitle, companyName].filter(Boolean).join(' ')

  if (!keywords || (!verifiedName && !roleTitle)) return null

  const url = new URL('https://www.linkedin.com/search/results/people/')
  url.searchParams.set('keywords', keywords)
  return url.toString()
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text && text.length <= maxLength ? text : null
}

export function parsePeopleToKnowHandoffs(value: unknown): PeopleToKnowHandoff[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const section = value as Record<string, unknown>
  if (section.kind !== 'people_to_know' || !Array.isArray(section.entries)) return []

  const sectionCompany = boundedText(section.company_name, 240)
  return section.entries.slice(0, 3).flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return []
    const entry = candidate as Record<string, unknown>
    const companyName = boundedText(entry.company_name, 240) ?? sectionCompany
    const roleTitle = boundedText(entry.role_title, 240)
    const whyThem = boundedText(entry.why_them, 240)
    return companyName && roleTitle && whyThem ? [{ companyName, roleTitle, whyThem }] : []
  })
}