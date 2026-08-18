import { afterEach, describe, expect, it } from 'vitest'
import { getSessionId, getWeekStartISO } from './EmiMarketingTelemetry'

type SessionStorageMock = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function createSessionStorage(): SessionStorageMock {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

const originalWindow = (globalThis as { window?: unknown }).window

describe('EmiMarketingTelemetry helpers', () => {
  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      ;(globalThis as { window?: unknown }).window = originalWindow
    }
  })

  it('computes Monday as week start for a Sunday date', () => {
    const sunday = new Date('2026-05-24T13:00:00.000Z')
    expect(getWeekStartISO(sunday)).toBe('2026-05-18')
  })

  it('returns server-session when window is unavailable', () => {
    delete (globalThis as { window?: unknown }).window
    expect(getSessionId()).toBe('server-session')
  })

  it('reuses an existing browser session id from sessionStorage', () => {
    const sessionStorage = createSessionStorage()
    sessionStorage.setItem('emi_session_id', 'existing-session')
    ;(globalThis as { window?: { sessionStorage: SessionStorageMock } }).window = { sessionStorage }

    expect(getSessionId()).toBe('existing-session')
  })
})
