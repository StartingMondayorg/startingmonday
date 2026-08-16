import { describe, expect, it } from 'vitest'
import {
  buildMatchDecision,
  normalizeCompanyName,
  normalizePersonName,
} from '@/lib/enrichment/linkedin-export-matching'

describe('linkedin export matching', () => {
  it('normalizes person names consistently', () => {
    expect(normalizePersonName('Dr. Jane A. Doe Jr.')).toBe('jane a doe')
    expect(normalizePersonName(' JANE DOE ')).toBe('jane doe')
  })

  it('normalizes company legal suffixes', () => {
    expect(normalizeCompanyName('The Acme Holdings, Inc.')).toBe('acme')
    expect(normalizeCompanyName('Acme LLC')).toBe('acme')
  })

  it('classifies profile url matches as high', () => {
    const result = buildMatchDecision(
      {
        fullName: 'Jane Doe',
        company: 'Acme Inc',
        profileUrl: 'https://www.linkedin.com/in/jane-doe/',
      },
      {
        fullName: 'Jane Doe',
        company: 'Acme',
        profileUrl: 'linkedin.com/in/jane-doe',
      },
    )

    expect(result.method).toBe('profile_url_exact')
    expect(result.tier).toBe('strong_overlap')
  })

  it('classifies a name-only match as possible overlap', () => {
    const result = buildMatchDecision(
      { fullName: 'Alice Johnson', company: 'Redwood Capital' },
      { fullName: 'Alice Johnson', company: 'Blue Harbor Logistics' },
    )

    expect(result.tier).toBe('possible_overlap')
  })
})
