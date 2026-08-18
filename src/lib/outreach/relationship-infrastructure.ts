export type ContactType = 'recruiter' | 'hiring_manager' | 'peer' | 'coach' | 'board'

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring Manager',
  peer: 'Peer',
  coach: 'Coach',
  board: 'Board',
}

export type RelationshipNetworkSummary = {
  totalContacts: number
  contactsByType: Record<ContactType, number>
  coveredTypes: number
  coverageScore: number
  coverageGapLabel: string
}

function emptyCounts(): Record<ContactType, number> {
  return {
    recruiter: 0,
    hiring_manager: 0,
    peer: 0,
    coach: 0,
    board: 0,
  }
}

export function inferContactType(input: { contactType?: string | null; channel?: string | null; title?: string | null }): ContactType | null {
  const explicit = (input.contactType ?? '').trim().toLowerCase()
  if (explicit === 'recruiter' || explicit === 'hiring_manager' || explicit === 'peer' || explicit === 'coach' || explicit === 'board') {
    return explicit
  }

  const channel = (input.channel ?? '').trim().toLowerCase()
  const title = (input.title ?? '').trim().toLowerCase()

  if (channel === 'recruiter') return 'recruiter'
  if (/(recruiter|talent acquisition|headhunter)/.test(title)) return 'recruiter'
  if (/(hiring manager|talent|people partner|hr|human resources|director of people)/.test(title)) return 'hiring_manager'
  if (/(board|board director|trustee)/.test(title)) return 'board'
  if (/(coach|advisor|mentor)/.test(title)) return 'coach'
  if (/(peer|svp|vp|vice president|chief|cto|cio|cfo|coo|cmo|cro)/.test(title)) return 'peer'

  return null
}

export function summarizeRelationshipNetwork(contacts: Array<{ contact_type?: string | null; channel?: string | null; title?: string | null }>): RelationshipNetworkSummary {
  const contactsByType = emptyCounts()
  for (const contact of contacts) {
    const inferred = inferContactType({
      contactType: contact.contact_type,
      channel: contact.channel,
      title: contact.title,
    })
    if (inferred) contactsByType[inferred] += 1
  }

  const totalContacts = contacts.length
  const coveredTypes = Object.values(contactsByType).filter((count) => count > 0).length
  const coverageScore = totalContacts === 0 ? 0 : Math.min(100, Math.round((coveredTypes / Object.keys(contactsByType).length) * 100))

  const gapOrder: ContactType[] = ['recruiter', 'hiring_manager', 'peer', 'coach', 'board']
  const coverageGapLabel = gapOrder.find((type) => contactsByType[type] === 0)
    ? `Missing ${CONTACT_TYPE_LABELS[gapOrder.find((type) => contactsByType[type] === 0)!]}`
    : 'Coverage is balanced across key relationship types'

  return {
    totalContacts,
    contactsByType,
    coveredTypes,
    coverageScore,
    coverageGapLabel,
  }
}