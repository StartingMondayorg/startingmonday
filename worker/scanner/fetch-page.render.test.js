import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchPage, renderMode } from './fetch-page.js'

// A SPA host so the plain-fetch step always escalates to browserless.io.
const SPA_URL = 'https://jobs.lever.co/acme'

function res(status, body) {
  return { status, ok: status >= 200 && status < 300, text: async () => body }
}

// Dispatches by endpoint. calls[] records which browserless endpoints were hit.
function stubFetch({ functionRes, contentRes }) {
  const calls = []
  vi.stubGlobal('fetch', async (url) => {
    const u = String(url)
    if (u.includes('/function')) {
      calls.push('function')
      return functionRes
    }
    if (u.includes('/chromium/content')) {
      calls.push('content')
      return contentRes
    }
    calls.push('plain')
    return res(200, '<html><body><div id="root"></div></body></html>')
  })
  return calls
}

beforeEach(() => {
  process.env.BROWSERLESS_API_KEY = 'test-key'
  delete process.env.BROWSERLESS_RENDER_MODE
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.BROWSERLESS_RENDER_MODE
})

describe('fetchPage render contract (SMK-489 item 1)', () => {
  it('defaults to innertext mode', () => {
    expect(renderMode()).toBe('innertext')
    process.env.BROWSERLESS_RENDER_MODE = 'content'
    expect(renderMode()).toBe('content')
  })

  it('returns browser-computed text from the /function endpoint', async () => {
    const calls = stubFetch({
      functionRes: res(200, 'Open Roles\nVP of Engineering\nChief Technology Officer'),
    })

    const result = await fetchPage(SPA_URL)

    expect(calls).toEqual(['plain', 'function'])
    expect(result.kind).toBe('text')
    expect(result.via).toBe('render')
    expect(result.content).toContain('VP of Engineering\nChief Technology Officer')
    expect(typeof result.renderMs).toBe('number')
  })

  it('falls back to /chromium/content only when /function is unavailable', async () => {
    const calls = stubFetch({
      functionRes: res(404, 'not found'),
      contentRes: res(200, '<html><body><div>VP of Engineering</div></body></html>'),
    })

    const result = await fetchPage(SPA_URL)

    expect(calls).toEqual(['plain', 'function', 'content'])
    expect(result.kind).toBe('html')
    expect(result.via).toBe('render')
  })

  it('does not double-spend on a page-level render failure', async () => {
    const calls = stubFetch({ functionRes: res(500, 'render crashed') })

    await expect(fetchPage(SPA_URL)).rejects.toThrow(/browserless\.io function 500/)
    expect(calls).toEqual(['plain', 'function'])
  })

  it('honours the content rollback mode without touching /function', async () => {
    process.env.BROWSERLESS_RENDER_MODE = 'content'
    const calls = stubFetch({
      contentRes: res(200, '<html><body><div>VP of Engineering</div></body></html>'),
    })

    const result = await fetchPage(SPA_URL)

    expect(calls).toEqual(['plain', 'content'])
    expect(result.kind).toBe('html')
    expect(result.via).toBe('render')
  })
})
