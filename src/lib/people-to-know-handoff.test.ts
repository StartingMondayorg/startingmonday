import { describe, expect, it } from 'vitest'
import {
  APOLLO_PEOPLE_URL,
  buildLinkedInPeopleSearchUrl,
  parsePeopleToKnowHandoffs,
  peopleToKnowHandoffEnabled,
} from './people-to-know-handoff'

describe('people-to-know handoff', () => {
  it('stays disabled by default', () => {
    expect(peopleToKnowHandoffEnabled({})).toBe(false)
    expect(peopleToKnowHandoffEnabled({ LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED: 'false' })).toBe(false)
  })

  it('accepts explicit enabled values', () => {
    expect(peopleToKnowHandoffEnabled({ LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED: '1' })).toBe(true)
    expect(peopleToKnowHandoffEnabled({ LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED: ' TRUE ' })).toBe(true)
  })

  it('builds a title and company search without a verified name', () => {
    const url = new URL(buildLinkedInPeopleSearchUrl({ companyName: 'Acme & Co', roleTitle: 'Chief People Officer' })!)

    expect(url.origin).toBe('https://www.linkedin.com')
    expect(url.pathname).toBe('/search/results/people/')
    expect(url.searchParams.get('keywords')).toBe('Chief People Officer Acme & Co')
  })

  it('uses a verified name and company when supplied', () => {
    const url = new URL(buildLinkedInPeopleSearchUrl({
      companyName: 'Acme',
      roleTitle: 'CFO',
      verifiedName: 'Jamie Rivera',
    })!)

    expect(url.searchParams.get('keywords')).toBe('Jamie Rivera Acme')
  })

  it('fails closed when neither a role nor verified name is available', () => {
    expect(buildLinkedInPeopleSearchUrl({ companyName: 'Acme', roleTitle: ' ' })).toBeNull()
  })

  it('uses a fixed Apollo account destination', () => {
    expect(APOLLO_PEOPLE_URL).toBe('https://app.apollo.io/#/people')
  })

  it('parses at most three title-only handoffs and ignores contact-shaped fields', () => {
    const result = parsePeopleToKnowHandoffs({
      kind: 'people_to_know',
      company_name: 'Acme',
      entries: [
        { role_title: 'CFO', why_them: 'Owns the financial decision.', email: 'hidden@example.com' },
        { role_title: 'CHRO', why_them: 'Shapes the leadership process.', phone: '555-0100' },
        { role_title: 'CEO', why_them: 'Sponsors the mandate.' },
        { role_title: 'COO', why_them: 'Must not render.' },
      ],
    })

    expect(result).toEqual([
      { companyName: 'Acme', roleTitle: 'CFO', whyThem: 'Owns the financial decision.' },
      { companyName: 'Acme', roleTitle: 'CHRO', whyThem: 'Shapes the leadership process.' },
      { companyName: 'Acme', roleTitle: 'CEO', whyThem: 'Sponsors the mandate.' },
    ])
    expect(JSON.stringify(result)).not.toMatch(/hidden@example|555-0100/)
  })

  it('rejects incomplete or unrecognized handoff sections', () => {
    expect(parsePeopleToKnowHandoffs({ kind: 'other', entries: [] })).toEqual([])
    expect(parsePeopleToKnowHandoffs({ kind: 'people_to_know', entries: [{ role_title: 'CFO' }] })).toEqual([])
  })
})