import { describe, it, expect, vi, afterEach } from 'vitest'
import dns from 'node:dns'
import { Readable } from 'node:stream'
import zlib from 'node:zlib'
import {
  collectBody,
  isAllowedUrlSyntax,
  isBlockedAddress,
  pinnedLookup,
  resolveSafeUrl,
  ResponseTooLargeError,
  safeFetch,
  TooManyRedirectsError,
  UnsafeUrlError,
  type SafeLookup,
  type SafeTransport,
  type TransportRequest,
} from './safe-fetch'

const PUBLIC_V4 = '93.184.215.14'

// A DNS stub: hostname -> addresses. Unknown names fail like ENOTFOUND.
function fakeLookup(table: Record<string, string[]>) {
  return vi.fn<SafeLookup>(async (hostname, options) => {
    expect(options).toMatchObject({ all: true })
    const addresses = table[hostname]
    if (!addresses) {
      throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), { code: 'ENOTFOUND' })
    }
    return addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
  })
}

type Route = { status?: number; headers?: Record<string, string>; body?: string }

// A transport stub: href -> response. Records each hop.
function fakeTransport(routes: Record<string, Route>) {
  const calls: Array<Pick<TransportRequest, 'method' | 'addresses' | 'headers'> & { href: string }> = []
  const transport = vi.fn<SafeTransport>(async (request) => {
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
    '0.0.0.0', '10.0.0.1', '100.64.0.1', '127.0.0.1', '169.254.169.254', '169.254.1.1', '172.16.0.1',
    '172.31.255.255', '192.0.0.8', '192.168.1.1', '198.18.0.1', '224.0.0.1', '240.0.0.1', '255.255.255.255',
  ])('blocks private/reserved IPv4 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  it.each(['8.8.8.8', PUBLIC_V4, '100.63.255.255', '100.128.0.0', '172.32.0.0', '198.20.0.0'])('allows public IPv4 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false)
  })

  it.each([
    '::', '::1', 'fc00::1', 'fd12:3456:789a::1', 'fe80::1', 'fe80::1%eth0', 'ff02::1', '::ffff:127.0.0.1',
    '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:169.254.169.254', '64:ff9b::10.0.0.1', '64:ff9b::a9fe:a9fe',
    '2002:c0a8:101::1', '2001:db8::1',
  ])('blocks private/reserved IPv6 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true)
  })

  it.each(['2606:4700:4700::1111', '::ffff:8.8.8.8', '64:ff9b::8.8.8.8'])('allows public IPv6 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false)
  })

  it('blocks anything that is not an IP address', () => {
    expect(isBlockedAddress('localhost')).toBe(true)
    expect(isBlockedAddress(undefined)).toBe(true)
  })
})

describe('URL checks', () => {
  it.each([
    ['http://2130706433/', '127.0.0.1'],
    ['http://0x7f000001/', '127.0.0.1'],
    ['http://0x7f.1/', '127.0.0.1'],
    ['http://0177.0.0.1/', '127.0.0.1'],
    ['http://2852039166/', '169.254.169.254'],
  ])('canonicalizes %s to %s and refuses it without DNS', async (raw, canonical) => {
    expect(new URL(raw).hostname).toBe(canonical)
    expect(isAllowedUrlSyntax(raw)).toBe(false)
    const lookup = fakeLookup({})
    await expect(resolveSafeUrl(raw, { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(lookup).not.toHaveBeenCalled()
  })

  it('refuses IPv6 literals, localhost and non-http schemes', async () => {
    for (const raw of ['http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://localhost/', 'file:///etc/passwd', 'gopher://x/']) {
      expect(isAllowedUrlSyntax(raw)).toBe(false)
    }
    await expect(resolveSafeUrl('http://[fd00::1]/', { lookup: fakeLookup({}) })).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(resolveSafeUrl('ftp://example.com/', { lookup: fakeLookup({}) })).rejects.toBeInstanceOf(UnsafeUrlError)
  })

  it('rejects a hostname when ANY resolved address is private', async () => {
    const lookup = fakeLookup({ 'evil.example': [PUBLIC_V4, '10.1.2.3'], 'v6.example': ['fd00::5'] })
    await expect(resolveSafeUrl('https://evil.example/', { lookup })).rejects.toThrow(/blocked address 10\.1\.2\.3/)
    await expect(resolveSafeUrl('https://v6.example/', { lookup })).rejects.toBeInstanceOf(UnsafeUrlError)
  })

  it('uses dns.promises.lookup with all: true by default', async () => {
    const spy = vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '192.168.0.10', family: 4 }] as never)
    await expect(resolveSafeUrl('https://rebind.example/')).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(spy).toHaveBeenCalledWith('rebind.example', expect.objectContaining({ all: true }))
  })

  it('returns vetted addresses for a public hostname', async () => {
    const { addresses } = await resolveSafeUrl('https://example.com/', { lookup: fakeLookup({ 'example.com': [PUBLIC_V4] }) })
    expect(addresses).toEqual([{ address: PUBLIC_V4, family: 4 }])
  })
})

describe('pinnedLookup', () => {
  it('answers only with the vetted addresses', () => {
    const vetted = [{ address: PUBLIC_V4, family: 4 }]
    const all = vi.fn()
    pinnedLookup(vetted)('example.com', { all: true }, all)
    expect(all).toHaveBeenCalledWith(null, vetted)
    const one = vi.fn()
    pinnedLookup(vetted)('example.com', {}, one)
    expect(one).toHaveBeenCalledWith(null, PUBLIC_V4, 4)
    const none = vi.fn()
    pinnedLookup(vetted)('example.com', { family: 6 }, none)
    expect(none.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})

describe('safeFetch', () => {
  it('fetches an allowed public URL', async () => {
    const { transport, calls } = fakeTransport({ 'https://example.com/job': { body: '<h1>VP</h1>' } })
    const res = await safeFetch('https://example.com/job', { lookup: fakeLookup({ 'example.com': [PUBLIC_V4] }), transport })
    expect(res).toBeInstanceOf(Response)
    expect(res.status).toBe(200)
    expect(res.url).toBe('https://example.com/job')
    expect(await res.text()).toBe('<h1>VP</h1>')
    expect(calls[0].addresses).toEqual([{ address: PUBLIC_V4, family: 4 }])
  })

  it('never connects when DNS resolves to a private address', async () => {
    const { transport } = fakeTransport({})
    await expect(
      safeFetch('https://internal.example/', { lookup: fakeLookup({ 'internal.example': ['127.0.0.1'] }), transport }),
    ).rejects.toBeInstanceOf(UnsafeUrlError)
    expect(transport).not.toHaveBeenCalled()
  })

  it('follows a relative redirect after re-validating it', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4] })
    const { transport, calls } = fakeTransport({
      'https://example.com/a': { status: 302, headers: { location: '/b' } },
      'https://example.com/b': { body: 'ok' },
    })
    const res = await safeFetch('https://example.com/a', { lookup, transport })
    expect(await res.text()).toBe('ok')
    expect(res.redirected).toBe(true)
    expect(calls.map((c) => c.href)).toEqual(['https://example.com/a', 'https://example.com/b'])
    expect(lookup).toHaveBeenCalledTimes(2)
  })

  it('refuses a redirect to a private address', async () => {
    const lookup = fakeLookup({ 'example.com': [PUBLIC_V4], 'sneaky.example': ['::ffff:10.0.0.1'] })
    for (const location of ['http://169.254.169.254/latest/meta-data/', 'https://sneaky.example/', 'http://[::1]/', 'file:///etc/passwd']) {
      const { transport, calls } = fakeTransport({ 'https://example.com/a': { status: 301, headers: { location } } })
      await expect(safeFetch('https://example.com/a', { lookup, transport })).rejects.toBeInstanceOf(UnsafeUrlError)
      expect(calls).toHaveLength(1)
    }
  })

  it('stops after five redirects', async () => {
    const routes: Record<string, Route> = {}
    for (let i = 0; i <= 10; i += 1) routes[`https://example.com/r${i}`] = { status: 302, headers: { location: `/r${i + 1}` } }
    const { transport, calls } = fakeTransport(routes)
    await expect(
      safeFetch('https://example.com/r0', { lookup: fakeLookup({ 'example.com': [PUBLIC_V4] }), transport }),
    ).rejects.toBeInstanceOf(TooManyRedirectsError)
    expect(calls).toHaveLength(6)
  })
})

describe('collectBody', () => {
  it('decodes gzip and caps the decoded size', async () => {
    const text = 'hello '.repeat(100)
    expect((await collectBody(Readable.from([zlib.gzipSync(text)]), 'gzip', 1024 * 1024)).toString()).toBe(text)
    const bomb = zlib.gzipSync(Buffer.alloc(2 * 1024 * 1024))
    await expect(collectBody(Readable.from([bomb]), 'gzip', 1024 * 1024)).rejects.toBeInstanceOf(ResponseTooLargeError)
  })
})
