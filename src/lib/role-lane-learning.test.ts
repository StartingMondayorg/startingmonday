import { describe, expect, it } from 'vitest'
import {
  getManagerToolsBridge,
  getPublicRoleLaneTutorials,
  getRecruiterMessagePacks,
  getRecruiterToolkit,
  getRoleLaneTutorials,
} from '@/lib/role-lane-learning'

describe('getRoleLaneTutorials', () => {
  it('returns technical leadership tutorials for technical lane', () => {
    const tutorials = getRoleLaneTutorials('technical_leadership')

    expect(tutorials.length).toBeGreaterThanOrEqual(3)
    expect(tutorials.some((item) => item.format === 'chat_prompt')).toBe(true)
  })

  it('returns delivery leadership tutorials for delivery lane', () => {
    const tutorials = getRoleLaneTutorials('delivery_leadership')

    expect(tutorials.some((item) => item.title.toLowerCase().includes('program'))).toBe(true)
  })

  it('falls back to leadership tutorials', () => {
    const tutorials = getRoleLaneTutorials(null)

    expect(tutorials.length).toBeGreaterThanOrEqual(3)
    expect(tutorials.some((item) => item.href === '/dashboard/chat')).toBe(true)
  })
})

describe('getManagerToolsBridge', () => {
  it('includes manager coaching keyword for manager roles', () => {
    const bridge = getManagerToolsBridge('manager')

    expect(bridge.href).toBe('/managertools')
    expect(bridge.keywords).toContain('manager coaching cadence')
  })

  it('includes execution rhythm keyword for delivery roles', () => {
    const bridge = getManagerToolsBridge('tpm')

    expect(bridge.keywords).toContain('execution operating rhythm')
  })
})

describe('getRecruiterToolkit', () => {
  it('returns role-aware assets for technical leadership lane', () => {
    const toolkit = getRecruiterToolkit('technical_leadership', 'principal')

    expect(toolkit.lane.toLowerCase()).toContain('technical leadership')
    expect(toolkit.assets.length).toBeGreaterThanOrEqual(3)
    expect(toolkit.assets.some((asset) => asset.href === '/dashboard/contacts')).toBe(true)
  })

  it('adds executive pre-day cadence for vp and executive titles', () => {
    const toolkit = getRecruiterToolkit('leadership', 'vp')

    expect(toolkit.cadence[0].toLowerCase()).toContain('pre-day 0')
  })
})

describe('getPublicRoleLaneTutorials', () => {
  it('maps chat prompts to public signup CTA links', () => {
    const assets = getPublicRoleLaneTutorials('leadership')
    const chatPrompt = assets.find((asset) => asset.format === 'chat_prompt')

    expect(chatPrompt).toBeDefined()
    expect(chatPrompt?.href).toContain('/signup?utm_source=role-lane')
    expect(chatPrompt?.ctaLabel).toBe('Start guided chat prompt')
  })

  it('keeps article and video destination links while adding CTA labels', () => {
    const assets = getPublicRoleLaneTutorials('technical_leadership')
    const article = assets.find((asset) => asset.format === 'article')
    const video = assets.find((asset) => asset.format === 'video')

    expect(article?.href).toContain('/blog/')
    expect(article?.ctaLabel).toBe('Read guide')
    expect(video?.href).toContain('/blog/')
    expect(video?.ctaLabel).toBe('Open guide')
  })
})

describe('getRecruiterMessagePacks', () => {
  it('returns recruiter and hiring manager message packs', () => {
    const packs = getRecruiterMessagePacks('leadership', 'director')

    expect(packs).toHaveLength(2)
    expect(packs.map((pack) => pack.audience)).toEqual(['recruiter', 'hiring_manager'])
  })

  it('uses technical lane language when technical leadership is selected', () => {
    const packs = getRecruiterMessagePacks('technical_leadership', 'principal')

    expect(packs[0].subject.toLowerCase()).toContain('technical leadership')
    expect(packs[0].proofPoints.some((point) => point.toLowerCase().includes('architecture'))).toBe(true)
  })
})
