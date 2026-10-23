import { describe, it, expect, vi, afterEach } from 'vitest'
import dns from 'node:dns'
import { EventEmitter } from 'node:events'
import http from 'node:http'
import { PassThrough, Readable } from 'node:stream'
import zlib from 'node:zlib'
import {
  collectBody,
  isAllowedUrlSyntax,
  isBlockedAddress,
  pinnedLookup,
  pinnedRequest,
  resolveSafeUrl,
  ResponseTooLargeError,
  safeFetch,
  TooManyRedirectsError,
  UnsafeUrlError,
} from './safe-fetch.js'

const PUBLIC_V4 = '93.184.215.14'

// A DNS stub: hostname -> list of addresses. Unknown names fail like ENOTFOUND.
function fakeLookup(table) {
  return vi.fn(async (hostname, options) => {
    expect(options).toMatchObject({ all: true })
    const addresses = table[hostname]
    if (!addresses) {
      const err = new Error(`getaddrinfo ENOTFOUND ${hostname}`)
      err.code = 'ENOTFOUND'
      throw err
    }
    return addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
  })
}

// A transport stub: href -> { status, headers, body }. Records each hop.
function fakeTransport(routes) {
  const calls = []
  const transport = vi.fn(async (request) => {
    calls.push({ href: request.url.href, method: request.method, addresses: request.addresses, headers: request.headers })
    const route = routes[request.url.href]
    if (!route) throw new Error(`unexpected request to ${request.url.href}`)
    return {
      status: route.status ?? 200,
      statusText: '',
      headers: new Headers(route.headers ?? {}),
      body: route.body === undefined ? null : Buffer.from(route.body),
    }
  })
  return { transport, calls }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isBlockedAddress', () => {
  it.each([
    '0.0.0.0', '0.1.2.3', '10.0.0.1', '100.64.0.1', '100.127.255.255', '127.0.0.1', '127.255.0.9',
    '169.254.169.254', '169.254.1.1', '172.16.0.1', '172.31.255.255', '192.0.0.8', '192.0.2.1',
    '192.168.1.1', '198.18.0.1', '198.19.255.255', '224.0.0.1', '239.255.255.250', '240.0.0.1',
    '255.255.255.255',
  ])('blocks private/reserved IPv4 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  it.each(['8.8.8.8', '1.1.1.1', PUBLIC_V4, '100.63.255.255', '100.128.0.0', '172.15.255.255', '172.32.0.0', '198.20.0.0', '223.255.255.255'])(
    'allows public IPv4 %s',
    (ip) => {
      expect(isBlockedAddress(ip)).toBe(false)
    },
  )

  it.each([
    '::', '::1', 'fc00::1', 'fd12:3456:789a::1', 'fe80::1', 'fe80::1%eth0', 'febf::1', 'fec0::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:169.254.169.254', '::127.0.0.1',
    '64:ff9b::10.0.0.1', '64:ff9b::a9fe:a9fe', '64:ff9b:1::1', '2002:7f00:1::1', '2002:c0a8:101::1',
    '2001:db8::1', '2001::1', '100::1',
  ])('blocks private/reserved IPv6 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  it.each(['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8', '64:ff9b::8.8.8.8', '2002:808:808::1'])(
    'allows public IPv6 %s',
    (ip) => {
      expect(isBlockedAddress(ip)).toBe(false)
    },
  )

  it('blocks anything that is not an IP address', () => {
    expect(isBlockedAddress('localhost')).toBe(true)
    expect(isBlockedAddress('')).toBe(true)
    expect(isBlockedAddress(undefined)).toBe(true)
  })
})

describe('numeric IPv4 spellings', () => {
  it.each([
    ['http://2130706433/', '127.0.0.1'],
    ['http://0x7f000001/', '127.0.0.1'],
    ['http://0x7f.1/', '127.0.0.1'],
    ['http://0177.0.0.1/', '127.0.0.1'],
    ['http://127.1/', '127.0.0.1'],
    ['http://017700000001/', '127.0.0.1'],
    ['http://2852039166/', '169.254.169.254'],
    ['http://0xa9.0xfe.0xa9.0xfe/', '169.254.169.254'],
    ['http://0/', '0.0.0.0'],
  ])('URL parser canonicalizes %s to %s and it is refused', async (raw, canonical) => {
    expect(new URL(raw).hostname).toBe(canonical)
    expect(isAllowedUrlSyntax(raw)).toBe(false)
    const lookup = fakeLookup({})
    await expect(resolveSafeUrl(raw, { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(lookup).not.toHaveBeenCalled()
  })

  it('refuses bracketed IPv6 literals', async () => {
    for (const raw of ['http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://[fd00::1]:8080/', 'http://[fe80::1]/']) {
      expect(isAllowedUrlSyntax(raw)).toBe(false)
      await expect(resolveSafeUrl(raw, { lookup: fakeLookup({}) })).rejects.toBeInstanceOf(UnsafeUrlError)
    }
  })
})

describe('resolveSafeUrl', () => {
  it('rejects non-http(s) schemes and junk', async () => {
    for (const raw of ['file:///etc/passwd', 'gopher://example.com/', 'ftp://example.com/', 'data:text/plain,hi', 'not a url']) {
      expect(isAllowedUrlSyntax(raw)).toBe(false)
      await expect(resolveSafeUrl(raw, { lookup: fakeLookup({}) })).rejects.toBeInstanceOf(UnsafeUrlError)
    }
  })

  it('rejects localhost names without resolving them in the sync pre-check', () => {
    expect(isAllowedUrlSyntax('http://localhost:3000/')).toBe(false)
    expect(isAllowedUrlSyntax('http://api.localhost/')).toBe(false)
    expect(isAllowedUrlSyntax('https://example.com/careers')).toBe(true)
  })

  it('rejects a hostname that resolves to a private address', async () => {
    const lookup = fakeLookup({ 'evil.example': ['10.1.2.3'] })
    await expect(resolveSafeUrl('https://evil.example/jobs', { lookup })).rejects.toThrow(/blocked address 10\.1\.2\.3/)
  })

  it('rejects when ANY resolved address is private, v4 or v6', async () => {
    const lookup = fakeLookup({
      'mixed.example': [PUBLIC_V4, '127.0.0.1'],
      'mixed6.example': ['2606:4700:4700::1111', 'fd00::5'],
      'mapped.example': ['::ffff:169.254.169.254'],
    })
    await expect(resolveSafeUrl('https://mixed.example/', { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(resolveSafeUrl('https://mixed6.example/', { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(resolveSafeUrl('https://mapped.example/', { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
  })

  it('returns every vetted address for a public hostname', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4, '2606:2800:21f:cb07:6820:80da:af6b:8b2c'] })
    const { url, addresses } = await resolveSafeUrl('https://example.com/careers', { lookup })
    expect(url.href).toBe('https://example.com/careers')
    expect(addresses).toEqual([
      { address: PUBLIC_V4, family: 4 },
      { address: '2606:2800:21f:cb07:6820:80da:af6b:8b2c', family: 6 },
    ])
  })

  it('propagates DNS failures as non-SSRF errors', async () => {
    const err = await resolveSafeUrl('https://nowhere.example/', { lookup: fakeLookup({}) }).catch((e) => e)
    expect(err).not.toBeInstanceOf(UnsafeUrlError)
    expect(err.code).toBe('ENOTFOUND')
  })

  it('uses dns.promises.lookup with all: true by default', async () => {
    const spy = vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '192.168.0.10', family: 4 }])
    await expect(resolveSafeUrl('https://rebind.example/')).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(spy).toHaveBeenCalledWith('rebind.example', expect.objectContaining({ all: true }))
  })
})

describe('pinnedLookup', () => {
  const vetted = [{ address: PUBLIC_V4, family: 4 }, { address: '2606:4700:4700::1111', family: 6 }]

  it('answers only with the vetted addresses (all: true form)', () => {
    const cb = vi.fn()
    pinnedLookup(vetted)('example.com', { all: true }, cb)
    expect(cb).toHaveBeenCalledWith(null, vetted)
  })

  it('answers with the first vetted address of the requested family', () => {
    const cb = vi.fn()
    pinnedLookup(vetted)('example.com', { family: 6 }, cb)
    expect(cb).toHaveBeenCalledWith(null, '2606:4700:4700::1111', 6)
    const cb2 = vi.fn()
    pinnedLookup(vetted)('example.com', cb2)
    expect(cb2).toHaveBeenCalledWith(null, PUBLIC_V4, 4)
  })

  it('fails rather than falling back to a fresh DNS answer', () => {
    const cb = vi.fn()
    pinnedLookup([{ address: PUBLIC_V4, family: 4 }])('example.com', { family: 6 }, cb)
    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})

describe('safeFetch', () => {
  it('fetches an allowed public URL and returns a standard Response', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport, calls } = fakeTransport({
      'https://example.com/careers': { status: 200, headers: { 'content-type': 'text/html' }, body: '<h1>Jobs</h1>' },
    })
    const res = await safeFetch('https://example.com/careers', { lookup, transport, headers: { 'User-Agent': 'UA' } })
    expect(res).toBeInstanceOf(Response)
    expect(res.ok).toBe(true)
    expect(res.status).toBe(200)
    expect(res.url).toBe('https://example.com/careers')
    expect(res.redirected).toBe(false)
    expect(await res.text()).toBe('<h1>Jobs</h1>')
    expect(calls).toHaveLength(1)
    expect(calls[0].addresses).toEqual([{ address: PUBLIC_V4, family: 4 }])
    expect(calls[0].headers['user-agent']).toBe('UA')
  })

  it('never calls the transport when the host resolves to a private address', async () => {
    const lookup = fakeLookup({ 'internal.example': ['169.254.169.254'] })
    const { transport } = fakeTransport({})
    await expect(safeFetch('http://internal.example/latest/meta-data/', { lookup, transport })).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(transport).not.toHaveBeenCalled()
  })

  it('follows a relative redirect and re-validates the target', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport, calls } = fakeTransport({
      'https://example.com/jobs': { status: 301, headers: { location: '/careers?x=1' } },
      'https://example.com/careers?x=1': { status: 200, body: 'ok' },
    })
    const res = await safeFetch('https://example.com/jobs', { lookup, transport })
    expect(await res.text()).toBe('ok')
    expect(res.url).toBe('https://example.com/careers?x=1')
    expect(res.redirected).toBe(true)
    expect(calls.map((c) => c.href)).toEqual(['https://example.com/jobs', 'https://example.com/careers?x=1'])
    expect(lookup).toHaveBeenCalledTimes(2)
  })

  it('refuses a redirect to a private IP literal', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport, calls } = fakeTransport({
      'https://example.com/jobs': { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } },
    })
    await expect(safeFetch('https://example.com/jobs', { lookup, transport })).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(calls).toHaveLength(1)
  })

  it('refuses a redirect to a hostname that resolves privately', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4], 'sneaky.example': ['fd00::1'] })
    const { transport, calls } = fakeTransport({
      'https://example.com/jobs': { status: 307, headers: { location: 'https://sneaky.example/admin' } },
    })
    await expect(safeFetch('https://example.com/jobs', { lookup, transport })).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(calls).toHaveLength(1)
  })

  it('refuses a redirect to a non-http scheme', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport } = fakeTransport({
      'https://example.com/jobs': { status: 302, headers: { location: 'file:///etc/passwd' } },
    })
    await expect(safeFetch('https://example.com/jobs', { lookup, transport })).rejects.toBeInstanceOf(UnsafeUrlError)
  })

  it('stops after maxRedirects hops', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const routes = {}
    for (let i = 0; i <= 10; i += 1) {
      routes[`https://example.com/r${i}`] = { status: 302, headers: { location: `/r${i + 1}` } }
    }
    const { transport, calls } = fakeTransport(routes)
    await expect(safeFetch('https://example.com/r0', { lookup, transport })).rejects.toBeInstanceOf(TooManyRedirectsError)
    expect(calls).toHaveLength(6) // the original request plus 5 redirects

    const second = fakeTransport(routes)
    await expect(safeFetch('https://example.com/r0', { lookup, transport: second.transport, maxRedirects: 2 }))
      .rejects.toBeInstanceOf(TooManyRedirectsError)
    expect(second.calls).toHaveLength(3)
  })

  it('allows exactly maxRedirects hops', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const routes = { 'https://example.com/r5': { status: 200, body: 'done' } }
    for (let i = 0; i < 5; i += 1) routes[`https://example.com/r${i}`] = { status: 302, headers: { location: `/r${i + 1}` } }
    const { transport } = fakeTransport(routes)
    const res = await safeFetch('https://example.com/r0', { lookup, transport })
    expect(await res.text()).toBe('done')
  })

  it('switches POST to GET on 303 and strips credentials across origins', async () => {
    const lookup = fakeLookup({ 'a.example': [PUBLIC_V4], 'b.example': ['8.8.8.8'] })
    const { transport, calls } = fakeTransport({
      'https://a.example/form': { status: 303, headers: { location: 'https://b.example/done' } },
      'https://b.example/done': { status: 200, body: 'ok' },
    })
    await safeFetch('https://a.example/form', {
      lookup,
      transport,
      method: 'POST',
      body: 'x=1',
      headers: { Authorization: 'Bearer t', Cookie: 'c=1', 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    expect(calls[0].method).toBe('POST')
    expect(calls[1].method).toBe('GET')
    expect(calls[1].headers.authorization).toBeUndefined()
    expect(calls[1].headers.cookie).toBeUndefined()
    expect(calls[1].headers['content-type']).toBeUndefined()
  })

  it('returns a 3xx without Location as-is', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport } = fakeTransport({ 'https://example.com/': { status: 304 } })
    const res = await safeFetch('https://example.com/', { lookup, transport })
    expect(res.status).toBe(304)
  })

  it('honours an aborted caller signal before resolving or connecting', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport } = fakeTransport({ 'https://example.com/': { status: 200, body: 'x' } })
    const controller = new AbortController()
    controller.abort(new Error('caller aborted'))
    await expect(safeFetch('https://example.com/', { lookup, transport, signal: controller.signal })).rejects.toThrow('caller aborted')
    expect(lookup).not.toHaveBeenCalled()
    expect(transport).not.toHaveBeenCalled()
  })

  it('bounds a stalled DNS lookup by timeoutMs', async () => {
    const lookup = vi.fn(() => new Promise(() => {}))
    const { transport } = fakeTransport({})
    const err = await safeFetch('https://stalled.example/', { lookup, transport, timeoutMs: 20 }).catch((e) => e)
    expect(err.name).toBe('TimeoutError')
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(transport).not.toHaveBeenCalled()
  })

  it('stops waiting on DNS when the caller aborts mid-lookup', async () => {
    const lookup = vi.fn(() => new Promise(() => {}))
    const controller = new AbortController()
    const pending = safeFetch('https://stalled.example/', { lookup, transport: fakeTransport({}).transport, signal: controller.signal })
    setTimeout(() => controller.abort(new Error('caller gave up')), 5)
    await expect(pending).rejects.toThrow('caller gave up')
  })
})

describe('resolveSafeUrl cancellation', () => {
  it('does not start DNS for an already-aborted signal', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const controller = new AbortController()
    controller.abort(new Error('already aborted'))
    await expect(resolveSafeUrl('https://example.com/', { lookup, signal: controller.signal })).rejects.toThrow('already aborted')
    expect(lookup).not.toHaveBeenCalled()
  })
})

describe('pinnedRequest transport', () => {
  // A response whose body never ends, standing in for a server that streams
  // an endless redirect body.
  function streamingResponse(statusCode, rawHeaders) {
    const res = new PassThrough()
    res.statusCode = statusCode
    res.statusMessage = ''
    res.rawHeaders = rawHeaders
    res.write('x'.repeat(4096))
    return res
  }

  function stubHttpRequest(pick) {
    const seen = []
    vi.spyOn(http, 'request').mockImplementation((url, options, callback) => {
      seen.push({ href: String(url), options })
      const req = new EventEmitter()
      req.end = () => setImmediate(() => callback(pick(String(url), seen.length)))
      return req
    })
    return seen
  }

  it('destroys a streaming redirect body before following the redirect', async () => {
    const first = streamingResponse(302, ['Location', '/next'])
    const second = new PassThrough()
    second.statusCode = 200
    second.rawHeaders = ['Content-Type', 'text/plain']
    second.end('ok')
    const destroyedBeforeSecondRequest = []
    const seen = stubHttpRequest((href) => {
      if (href.endsWith('/next')) {
        destroyedBeforeSecondRequest.push(first.destroyed)
        return second
      }
      return first
    })

    const res = await safeFetch('http://example.com/start', { lookup: fakeLookup({ 'example.com': [PUBLIC_V4] }) })

    expect(await res.text()).toBe('ok')
    expect(first.destroyed).toBe(true)
    expect(destroyedBeforeSecondRequest).toEqual([true])
    expect(seen).toHaveLength(2)
    expect(seen[0].options.agent).toBe(false)
    const pinned = vi.fn()
    seen[0].options.lookup('example.com', { all: true }, pinned)
    expect(pinned).toHaveBeenCalledWith(null, [{ address: PUBLIC_V4, family: 4 }])
  })

  it('destroys the body of a HEAD or 204 response without reading it', async () => {
    const res = streamingResponse(204, [])
    stubHttpRequest(() => res)
    const result = await pinnedRequest({
      url: new URL('http://example.com/'),
      method: 'GET',
      headers: {},
      body: undefined,
      addresses: [{ address: PUBLIC_V4, family: 4 }],
      signal: new AbortController().signal,
      maxBytes: 1024,
    })
    expect(result.status).toBe(204)
    expect(result.body).toBeNull()
    expect(res.destroyed).toBe(true)
  })

  it('refuses a declared Content-Length over the cap', async () => {
    const res = streamingResponse(200, ['Content-Length', String(10 * 1024 * 1024)])
    stubHttpRequest(() => res)
    await expect(pinnedRequest({
      url: new URL('http://example.com/'),
      method: 'GET',
      headers: {},
      body: undefined,
      addresses: [{ address: PUBLIC_V4, family: 4 }],
      signal: new AbortController().signal,
      maxBytes: 1024,
    })).rejects.toBeInstanceOf(ResponseTooLargeError)
    expect(res.destroyed).toBe(true)
  })
})

describe('collectBody', () => {
  it('decodes gzip and brotli bodies', async () => {
    const text = 'hello '.repeat(100)
    const gz = await collectBody(Readable.from([zlib.gzipSync(text)]), 'gzip', 1024 * 1024)
    expect(gz.toString()).toBe(text)
    const br = await collectBody(Readable.from([zlib.brotliCompressSync(text)]), 'br', 1024 * 1024)
    expect(br.toString()).toBe(text)
  })

  it('caps the decoded size, so a small compressed bomb is refused', async () => {
    const bomb = zlib.gzipSync(Buffer.alloc(2 * 1024 * 1024))
    expect(bomb.length).toBeLessThan(64 * 1024)
    await expect(collectBody(Readable.from([bomb]), 'gzip', 1024 * 1024)).rejects.toBeInstanceOf(ResponseTooLargeError)
    await expect(collectBody(Readable.from([Buffer.alloc(2048)]), undefined, 1024)).rejects.toBeInstanceOf(ResponseTooLargeError)
  })
})
