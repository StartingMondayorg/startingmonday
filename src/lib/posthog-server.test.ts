import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const capture = vi.fn()
const PostHog = vi.fn(function MockPostHog() {
  return { capture }
})

vi.mock('posthog-node', () => ({ PostHog }))

const originalNodeEnv = process.env.NODE_ENV
const originalPostHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const originalPostHogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

async function captureServerEvent() {
  vi.resetModules()
  return (await import('./posthog-server')).captureServerEvent
}

describe('captureServerEvent', () => {
  beforeEach(() => {
    capture.mockReset()
    PostHog.mockClear()
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST
  })

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalNodeEnv)
    if (originalPostHogKey === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY
    else process.env.NEXT_PUBLIC_POSTHOG_KEY = originalPostHogKey
    if (originalPostHogHost === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_HOST
    else process.env.NEXT_PUBLIC_POSTHOG_HOST = originalPostHogHost
    vi.unstubAllEnvs()
  })

  it('does not initialize PostHog outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'

    const captureEvent = await captureServerEvent()
    captureEvent('user-1', 'event-name')

    expect(PostHog).not.toHaveBeenCalled()
    expect(capture).not.toHaveBeenCalled()
  })

  it('does not initialize PostHog without a production key', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const captureEvent = await captureServerEvent()
    captureEvent('user-1', 'event-name')

    expect(PostHog).not.toHaveBeenCalled()
  })

  it('captures production events with the configured host and properties', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'
    process.env.NEXT_PUBLIC_POSTHOG_HOST = '  https://analytics.example.com  '

    const captureEvent = await captureServerEvent()
    captureEvent('user-1', 'event-name', { source: 'test' })

    expect(PostHog).toHaveBeenCalledWith('test-key', {
      host: 'https://analytics.example.com',
      flushAt: 1,
      flushInterval: 0,
    })
    expect(capture).toHaveBeenCalledWith({
      distinctId: 'user-1',
      event: 'event-name',
      properties: { source: 'test' },
    })
  })

  it('does not throw when the analytics provider fails', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'
    capture.mockImplementationOnce(() => {
      throw new Error('provider unavailable')
    })

    const captureEvent = await captureServerEvent()

    expect(() => captureEvent('user-1', 'event-name')).not.toThrow()
  })
})