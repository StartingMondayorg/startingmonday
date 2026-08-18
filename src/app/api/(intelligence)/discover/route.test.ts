import { describe, expect, it } from 'vitest'
import { shouldExcludeSuggestedPerson } from './route'

describe('discover role exclusion in suggested people', () => {
  it('excludes current role-holder when targeting CIO acronym', () => {
    expect(
      shouldExcludeSuggestedPerson('Chief Information Officer, Salesforce', 'CIO'),
    ).toBe(true)
  })

  it('keeps adjacent stakeholders when targeting CIO', () => {
    expect(
      shouldExcludeSuggestedPerson('President & Chief Operating Officer', 'CIO'),
    ).toBe(false)
  })

  it('supports full title target matching', () => {
    expect(
      shouldExcludeSuggestedPerson('SVP, Office of the CTO', 'Chief Technology Officer'),
    ).toBe(true)
  })
})
