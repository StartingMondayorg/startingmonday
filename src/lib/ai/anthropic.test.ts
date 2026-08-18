import { afterEach, describe, expect, it } from 'vitest'
import { getModelForTier, MODELS } from '@/lib/ai/anthropic'

describe('getModelForTier', () => {
  const originalFlag = process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED
    } else {
      process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED = originalFlag
    }
  })

  it('routes executive tier to Opus by default', () => {
    delete process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED
    expect(getModelForTier('executive')).toBe(MODELS.opus)
  })

  it('routes campaign tier to Opus by default', () => {
    delete process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED
    expect(getModelForTier('campaign')).toBe(MODELS.opus)
  })

  it('routes non-executive tiers to Sonnet', () => {
    expect(getModelForTier('active')).toBe(MODELS.sonnet)
    expect(getModelForTier('free')).toBe(MODELS.sonnet)
  })

  it('disables Opus routing when ANTHROPIC_OPUS_EXECUTIVE_ENABLED=0', () => {
    process.env.ANTHROPIC_OPUS_EXECUTIVE_ENABLED = '0'
    expect(getModelForTier('executive')).toBe(MODELS.sonnet)
    expect(getModelForTier('campaign')).toBe(MODELS.sonnet)
  })
})
