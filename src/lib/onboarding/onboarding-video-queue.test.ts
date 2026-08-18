import { describe, expect, it } from 'vitest'
import { mapOnboardingVideoProviderEventToStatus } from '@/lib/onboarding/onboarding-video-queue'

describe('mapOnboardingVideoProviderEventToStatus', () => {
  it('maps known provider events to onboarding run statuses', () => {
    expect(mapOnboardingVideoProviderEventToStatus('video.completed')).toBe('completed')
    expect(mapOnboardingVideoProviderEventToStatus('video.failed')).toBe('failed')
    expect(mapOnboardingVideoProviderEventToStatus('video.canceled')).toBe('canceled')
    expect(mapOnboardingVideoProviderEventToStatus('video.processing')).toBe('processing')
  })

  it('returns null for unknown events', () => {
    expect(mapOnboardingVideoProviderEventToStatus('video.unknown')).toBeNull()
    expect(mapOnboardingVideoProviderEventToStatus('')).toBeNull()
  })
})
