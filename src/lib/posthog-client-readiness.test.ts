import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PostHog client readiness', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('notifies listeners waiting before initialization', async () => {
    const { markPosthogClientReady, onPosthogClientReady } = await import('./posthog-client-readiness')
    const listener = vi.fn()

    onPosthogClientReady(listener)
    expect(listener).not.toHaveBeenCalled()

    markPosthogClientReady()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('immediately notifies listeners registered after initialization', async () => {
    const { markPosthogClientReady, onPosthogClientReady } = await import('./posthog-client-readiness')
    const listener = vi.fn()

    markPosthogClientReady()
    onPosthogClientReady(listener)

    expect(listener).toHaveBeenCalledOnce()
  })
})