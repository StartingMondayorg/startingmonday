import { describe, expect, it } from 'vitest'
import { scorePrepBriefConfidence } from '@/lib/prep/prep-confidence'

describe('prep confidence scoring', () => {
  it('returns high/medium confidence for well-structured briefs', () => {
    const brief = [
      '## Bottom Line',
      'Candidate has verified leadership outcomes and strong system evidence.',
      '## The Situation',
      'Recent company signals indicate a mandate reset and governance urgency.',
      '## Win Thesis',
      'The decisive advantage is an execution track record tied to operating metrics.',
      '## Anticipated Pushback',
      'They push: concern on scale transition. You say: led two scale transitions with outcomes.',
      '## Likely Questions',
      'They ask: how would you reduce risk in quarter one?',
    ].join('\n')

    const result = scorePrepBriefConfidence(brief)
    expect(result.score).toBeGreaterThanOrEqual(65)
    expect(['high', 'medium']).toContain(result.band)
  })

  it('returns low confidence and remediation for sparse output', () => {
    const result = scorePrepBriefConfidence('Short generic output')
    expect(result.band).toBe('low')
    expect(result.remediation.length).toBeGreaterThan(0)
  })
})
