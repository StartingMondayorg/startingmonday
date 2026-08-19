import { describe, expect, it, vi } from 'vitest'
import type { PostHog } from 'posthog-js'
import { captureHeroPageViewWhenReady } from './HeroPageViewTelemetry'

describe('captureHeroPageViewWhenReady', () => {
  it('waits for PostHog readiness and captures the view once', () => {
    let ready: (() => void) | undefined
    const unsubscribe = vi.fn()
    const capture = vi.fn()
    const posthog = {
      capture,
      onFeatureFlags: vi.fn((callback: () => void) => {
        ready = callback
        return unsubscribe
      }),
    } as unknown as Pick<PostHog, 'capture' | 'onFeatureFlags'>
    const hasCaptured = { current: false }

    const cleanup = captureHeroPageViewWhenReady(
      posthog,
      'hero_view',
      { source_page: '/' },
      hasCaptured,
    )

    expect(capture).not.toHaveBeenCalled()
    ready?.()
    ready?.()
    expect(capture).toHaveBeenCalledOnce()
    expect(capture).toHaveBeenCalledWith('hero_view', { source_page: '/' })
    expect(cleanup).toBe(unsubscribe)
  })
})