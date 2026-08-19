import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  init: vi.fn(),
  markReady: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: { init: state.init },
}))

vi.mock('@/lib/posthog-client-readiness', () => ({
  markPosthogClientReady: state.markReady,
}))

vi.mock('@sentry/nextjs', () => ({
  captureRouterTransitionStart: vi.fn(),
}))

describe('client instrumentation', () => {
  beforeEach(() => {
    vi.resetModules()
    state.init.mockReset()
    state.markReady.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('initializes PostHog before application components execute', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test')
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://posthog.example.test')

    await import('./instrumentation-client')

    expect(state.init).toHaveBeenCalledOnce()
    expect(state.init).toHaveBeenCalledWith('phc_test', {
      api_host: 'https://posthog.example.test',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: state.markReady,
    })
  })

  it('does not initialize PostHog without a public project key', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

    await import('./instrumentation-client')

    expect(state.init).not.toHaveBeenCalled()
  })
})