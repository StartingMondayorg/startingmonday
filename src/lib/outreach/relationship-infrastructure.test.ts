import { describe, expect, it } from 'vitest'
import { inferContactType, summarizeRelationshipNetwork } from '@/lib/outreach/relationship-infrastructure'

describe('inferContactType', () => {
  it('respects explicit contact type first', () => {
    expect(inferContactType({ contactType: 'board', title: 'VP Engineering' })).toBe('board')
  })

  it('infers a recruiter from channel or title', () => {
    expect(inferContactType({ channel: 'recruiter' })).toBe('recruiter')
    expect(inferContactType({ title: 'Executive Recruiter' })).toBe('recruiter')
  })

  it('infers peer, hiring manager, coach, and board patterns', () => {
    expect(inferContactType({ title: 'SVP Product' })).toBe('peer')
    expect(inferContactType({ title: 'Director of People' })).toBe('hiring_manager')
    expect(inferContactType({ title: 'Board Director' })).toBe('board')
    expect(inferContactType({ title: 'Advisor and Coach' })).toBe('coach')
  })
})

describe('summarizeRelationshipNetwork', () => {
  it('produces a coverage score and missing-type label', () => {
    const summary = summarizeRelationshipNetwork([
      { contact_type: 'recruiter', title: 'Executive Recruiter' },
      { contact_type: 'peer', title: 'SVP Product' },
    ])

    expect(summary.totalContacts).toBe(2)
    expect(summary.contactsByType.recruiter).toBe(1)
    expect(summary.contactsByType.peer).toBe(1)
    expect(summary.coveredTypes).toBe(2)
    expect(summary.coverageScore).toBeGreaterThan(0)
    expect(summary.coverageGapLabel).toContain('Missing')
  })
})