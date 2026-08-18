import { describe, expect, it, vi } from 'vitest'
import {
  clampLimit,
  computeRetryDelayMs,
  mapMilestoneToFlow,
  normalizeMaxRetries,
} from '@/lib/onboarding/onboarding-video-queue.utils'

describe('onboarding-video-queue utils', () => {
  it('clampLimit bounds values to range', () => {
    expect(clampLimit(undefined, 10, 25)).toBe(10)
    expect(clampLimit(100, 10, 25)).toBe(25)
    expect(clampLimit(0, 10, 25)).toBe(1)
  })

  it('normalizeMaxRetries constrains retries to allowed bounds', () => {
    expect(normalizeMaxRetries(undefined)).toBe(3)
    expect(normalizeMaxRetries(99)).toBe(10)
    expect(normalizeMaxRetries(-5)).toBe(0)
  })

  it('computeRetryDelayMs uses exponential backoff and jitter cap', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(computeRetryDelayMs(0)).toBe(120000)
    expect(computeRetryDelayMs(1)).toBe(240000)
    expect(computeRetryDelayMs(20)).toBeLessThanOrEqual(7200000)
    vi.restoreAllMocks()
  })

  it('mapMilestoneToFlow maps milestones by event and step/channel context', () => {
    expect(mapMilestoneToFlow('onboarding_started', {})).toBe('onboarding_first_day')
    expect(mapMilestoneToFlow('onboarding_first_value_ready', { channel: 'coaches' })).toBe('coach_channel_playbook')
    expect(mapMilestoneToFlow('onboarding_step_completed', { step: 'follow_up_1' })).toBe('follow_up_rhythm')
    expect(mapMilestoneToFlow('onboarding_step_completed', { step: 'brief-review' })).toBe('briefing_workflow')
    expect(mapMilestoneToFlow('onboarding_step_completed', { step: 'outreach-launch' })).toBe('outreach_launch')
  })
})
