import { describe, expect, it } from 'vitest'
import { scoreRelationshipTarget } from '@/lib/outreach/relationship-targeting'

describe('scoreRelationshipTarget', () => {
  it('prioritizes recruiter contacts with active context', () => {
    const result = scoreRelationshipTarget({
      title: 'Senior Technical Recruiter',
      status: 'active',
      channel: 'linkedin',
      isPriority: true,
      leadScore: 85,
      lastRoleDiscussed: 'Senior TPM',
    })

    expect(result.isRecruiter).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.tier).toBe('tier_1')
  })

  it('keeps low-context contacts in lower tiers', () => {
    const result = scoreRelationshipTarget({
      title: 'Engineer',
      status: 'active',
      channel: 'email',
      isPriority: false,
      leadScore: 10,
      lastRoleDiscussed: null,
    })

    expect(result.tier).toBe('tier_3')
  })
})
