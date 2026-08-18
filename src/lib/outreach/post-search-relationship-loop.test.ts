import { describe, expect, it } from 'vitest'
import { buildRelationshipMaintenancePlan } from '@/lib/outreach/post-search-relationship-loop'

describe('buildRelationshipMaintenancePlan', () => {
  it('returns zero targets when there are no active contacts', () => {
    const plan = buildRelationshipMaintenancePlan({ activeContacts: 0 })
    expect(plan.map((item) => item.targetCount)).toEqual([0, 0, 0])
  })

  it('applies minimum targets at low contact volume', () => {
    const plan = buildRelationshipMaintenancePlan({ activeContacts: 10 })
    expect(plan.map((item) => item.targetCount)).toEqual([3, 2, 1])
  })

  it('scales targets up at higher contact volume', () => {
    const plan = buildRelationshipMaintenancePlan({ activeContacts: 60 })
    expect(plan.map((item) => item.targetCount)).toEqual([8, 5, 3])
  })
})