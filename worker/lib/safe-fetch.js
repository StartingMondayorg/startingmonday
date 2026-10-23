// SSRF-safe outbound HTTP for URLs the worker did not choose itself: career
// pages, company websites, role URLs and anything scraped from them (P1-5,
// docs/engineering/code-review-2026-10-22.md).
//
// Every hop is checked the same way:
//   1. only http: and https: are allowed;
//   2. the hostname is resolved with dns.lookup({ all: true }) and the request
//      is refused if ANY resolved address is private, loopback, link-local,
//      CGNAT, multicast or otherwise reserved (v4 and v6, including v4-mapped
//      and NAT64 forms);
//   3. the connection is pinned to the addresses that were vetted, so a DNS
//      answer that changes between the check and the connect (rebinding)
//      cannot steer the socket somewhere else;
//   4. redirects are followed manually, at most `maxRedirects` times, and each
//      Location is resolved against the current URL and re-validated.
// Response bodies are capped at `maxBytes` after decompression.
//
// Numeric IPv4 spellings (http://2130706433/, http://0x7f.1/, http://0177.0.0.1/)
// need no special handling: the WHATWG URL parser canonicalizes them to dotted
// quads before the address check runs.
//
// The Railway worker deploys worker/ on its own, so src/lib/net/safe-fetch.ts
// carries a TypeScript copy of these rules for the web app. Keep them in step.

import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { pipeline } from 'node:stream'
import zlib from 'node:zlib'

export const DEFAULT_TIMEOUT_MS = 10_000
export const DEFAULT_MAX_REDIRECTS = 5
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])
const CROSS_ORIGIN_STRIPPED_HEADERS = ['authorization', 'cookie', 'proxy-authorization']

export class UnsafeUrlError extends Error {
  constructor(message, url) {
    super(message)
    this.name = 'UnsafeUrlError'
    this.code = 'UNSAFE_URL'
    this.url = url
  }
}

export class TooManyRedirectsError extends Error {
  constructor(maxRedirects, url) {
    super(`safe-fetch: more than ${maxRedirects} redirects: ${url}`)
    this.name = 'TooManyRedirectsError'
    this.code = 'TOO_MANY_REDIRECTS'
    this.url = url
  }
}

export class ResponseTooLargeError extends Error {
  constructor(maxBytes, url) {
    super(`safe-fetch: response body exceeds ${maxBytes} bytes${url ? `: ${url}` : ''}`)
    this.name = 'ResponseTooLargeError'
    this.code = 'RESPONSE_TOO_LARGE'
    this.url = url
  }
}

// ── Address classification ──────────────────────────────────────────────────

function parseIPv4(ip) {
  const parts = String(ip).split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = value * 256 + octet
  }
  return value
}

const IPV4_BLOCKS = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // RFC 1918
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, including cloud metadata
  ['172.16.0.0', 12], // RFC 1918
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // RFC 1918
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 3], // multicast 224/4, reserved 240/4, broadcast
].map(([base, bits]) => ({ base: parseIPv4(base), size: 2 ** (32 - bits) }))

export function isBlockedIPv4(ip) {
  const value = parseIPv4(ip)
  if (value === null) return true
  return IPV4_BLOCKS.some(({ base, size }) => Math.floor(value / size) === Math.floor(base / size))
}

// Expands an IPv6 literal into eight 16-bit groups, or null when malformed.
function parseIPv6(ip) {
  let text = String(ip).toLowerCase()
  const zone = text.indexOf('%')
  if (zone !== -1) text = text.slice(0, zone)
  if (!net.isIPv6(text)) return null

  const lastColon = text.lastIndexOf(':')
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const v4 = parseIPv4(tail)
    if (v4 === null) return null
    text = `${text.slice(0, lastColon + 1)}${Math.floor(v4 / 65536).toString(16)}:${(v4 % 65536).toString(16)}`
  }

  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  let groups = head
  if (halves.length === 2) {
    const missing = 8 - head.length - rest.length
    if (missing < 0) return null
    groups = [...head, ...Array(missing).fill('0'), ...rest]
  }
  if (groups.length !== 8) return null
  const values = groups.map((group) => Number.parseInt(group, 16))
  return values.some((value) => Number.isNaN(value) || value < 0 || value > 0xffff) ? null : values
}

function embeddedIPv4(hi, lo) {
  return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
}

export function isBlockedIPv6(ip) {
  const g = parseIPv6(ip)
  if (!g) return true
  const zeros = (from, to) => g.slice(from, to).every((value) => value === 0)

  // ::/96 (unspecified, loopback, IPv4-compatible) and ::ffff:0:0/96 (IPv4-mapped)
  if (zeros(0, 5) && (g[5] === 0 || g[5] === 0xffff)) return isBlockedIPv4(embeddedIPv4(g[6], g[7]))
  // ::ffff:0:0:0/96 (IPv4-translated)
  if (zeros(0, 4) && g[4] === 0xffff && g[5] === 0) return isBlockedIPv4(embeddedIPv4(g[6], g[7]))
  // 64:ff9b::/96 (well-known NAT64 prefix)
  if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return isBlockedIPv4(embeddedIPv4(g[6], g[7]))
  // 64:ff9b:1::/48 (local-use NAT64)
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true
  // 2002::/16 (6to4) embeds an IPv4 address in bits 16-47
  if (g[0] === 0x2002) return isBlockedIPv4(embeddedIPv4(g[1], g[2]))
  // 0000::/8 reserved (anything not handled above)
  if (g[0] <= 0xff) return true
  // 100::/64 discard-only
  if (g[0] === 0x100 && zeros(1, 4)) return true
  // 2001::/32 Teredo (embeds an obfuscated IPv4) and 2001:db8::/32 documentation
  if (g[0] === 0x2001 && (g[1] === 0 || g[1] === 0x0db8)) return true
  if ((g[0] & 0xfe00) === 0xfc00) return true // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true // fec0::/10 site-local (deprecated)
  if ((g[0] & 0xff00) === 0xff00) return true // ff00::/8 multicast
  return false
}

// True when the address must never be contacted. Non-IP input is blocked.
export function isBlockedAddress(address) {
  const family = net.isIP(String(address ?? '').split('%')[0])
  if (family === 4) return isBlockedIPv4(address)
  if (family === 6) return isBlockedIPv6(address)
  return true
}

// ── URL validation ──────────────────────────────────────────────────────────

function hostnameOf(url) {
  const host = url.hostname.toLowerCase()
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
}

function parseUrl(input) {
  try {
    return input instanceof URL ? new URL(input.href) : new URL(String(input))
  } catch {
    throw new UnsafeUrlError(`safe-fetch: invalid URL: ${String(input)}`, String(input))
  }
}

// Synchronous pre-check: scheme, literal IPs and localhost names. It does not
// resolve DNS, so it is a fast filter only; resolveSafeUrl is the real gate.
export function isAllowedUrlSyntax(input) {
  let url
  try {
    url = parseUrl(input)
  } catch {
    return false
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return false
  const host = hostnameOf(url)
  if (!host) return false
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (net.isIP(host)) return !isBlockedAddress(host)
  return true
}

function defaultLookup(hostname, options) {
  return dns.promises.lookup(hostname, options)
}

// Rejects as soon as the signal aborts. The underlying system lookup cannot
// be cancelled, but the caller stops waiting for it.
function untilAborted(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (err) => {
        signal.removeEventListener('abort', onAbort)
        reject(err)
      },
    )
  })
}

// Validates a URL and returns it with the vetted addresses to connect to.
// Throws UnsafeUrlError when the URL is not allowed; DNS failures propagate
// as the resolver's own error (ENOTFOUND etc.). `signal` bounds the DNS wait.
export async function resolveSafeUrl(input, { lookup = defaultLookup, signal } = {}) {
  if (signal?.aborted) throw signal.reason
  const url = parseUrl(input)
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeUrlError(`safe-fetch: protocol ${url.protocol} not allowed: ${url.href}`, url.href)
  }
  const host = hostnameOf(url)
  if (!host) throw new UnsafeUrlError(`safe-fetch: URL has no host: ${url.href}`, url.href)

  const literalFamily = net.isIP(host)
  if (literalFamily) {
    if (isBlockedAddress(host)) {
      throw new UnsafeUrlError(`safe-fetch: blocked address ${host}: ${url.href}`, url.href)
    }
    return { url, addresses: [{ address: host, family: literalFamily }] }
  }

  const records = await untilAborted(Promise.resolve().then(() => lookup(host, { all: true, verbatim: true })), signal)
  const list = Array.isArray(records) ? records : records ? [records] : []
  if (list.length === 0) throw new Error(`safe-fetch: ${host} resolved to no addresses`)
  const blocked = list.find((record) => isBlockedAddress(record?.address))
  if (blocked) {
    throw new UnsafeUrlError(
      `safe-fetch: ${host} resolves to blocked address ${blocked?.address}: ${url.href}`,
      url.href,
    )
  }
  return {
    url,
    addresses: list.map((record) => ({ address: record.address, family: record.family || net.isIP(record.address) })),
  }
}

// ── Transport ───────────────────────────────────────────────────────────────

// A net/tls lookup function that only ever answers with the vetted addresses.
export function pinnedLookup(addresses) {
  return (hostname, options, callback) => {
    const cb = typeof options === 'function' ? options : callback
    const opts = typeof options === 'function' ? {} : options ?? {}
    const wanted = opts.family === 4 || opts.family === 6
      ? addresses.filter((entry) => entry.family === opts.family)
      : addresses
    if (wanted.length === 0) {
      const err = new Error(`safe-fetch: no vetted IPv${opts.family} address for ${hostname}`)
      err.code = 'ENOTFOUND'
      cb(err)
      return
    }
    if (opts.all) cb(null, wanted.map(({ address, family }) => ({ address, family })))
    else cb(null, wanted[0].address, wanted[0].family)
  }
}

function decoderFor(encoding) {
  switch (String(encoding ?? '').trim().toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip()
    case 'deflate':
      return zlib.createInflate()
    case 'br':
      return zlib.createBrotliDecompress()
    default:
      return null
  }
}

// Reads a (possibly compressed) body stream into a Buffer, refusing to hold
// more than maxBytes of decoded data.
export async function collectBody(stream, encoding, maxBytes = DEFAULT_MAX_BYTES, url) {
  const decoder = decoderFor(encoding)
  const source = decoder ?? stream
  if (decoder) pipeline(stream, decoder, () => {})
  const chunks = []
  let total = 0
  for await (const chunk of source) {
    total += chunk.length
    if (total > maxBytes) {
      stream.destroy()
      decoder?.destroy()
      throw new ResponseTooLargeError(maxBytes, url)
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function toHeaders(rawHeaders = []) {
  const headers = new Headers()
  for (let i = 0; i + 1 < rawHeaders.length; i += 2) {
    try {
      headers.append(rawHeaders[i], rawHeaders[i + 1])
    } catch {
      // Drop a header value the Fetch Headers class will not accept.
    }
  }
  return headers
}

// Default transport: node:http(s) with DNS pinned to the vetted addresses.
// Returns { status, statusText, headers, body } where body is a Buffer or null.
export function pinnedRequest({ url, method, headers, body, addresses, signal, maxBytes }) {
  const client = url.protocol === 'https:' ? https : http
  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method,
      headers,
      signal,
      agent: false,
      lookup: pinnedLookup(addresses),
    }, (res) => {
      const status = res.statusCode ?? 0
      const responseHeaders = toHeaders(res.rawHeaders)
      const head = { status, statusText: res.statusMessage ?? '', headers: responseHeaders }
      const redirect = REDIRECT_STATUSES.has(status) && responseHeaders.has('location')
      if (redirect || method === 'HEAD' || NULL_BODY_STATUSES.has(status)) {
        // The body is never read. Destroy rather than drain it: draining is
        // unbounded, and agent: false means there is no connection to reuse.
        res.destroy()
        resolve({ ...head, body: null })
        return
      }
      const declared = Number(responseHeaders.get('content-length'))
      if (Number.isFinite(declared) && declared > maxBytes) {
        res.destroy()
        reject(new ResponseTooLargeError(maxBytes, url.href))
        return
      }
      collectBody(res, responseHeaders.get('content-encoding'), maxBytes, url.href)
        .then((buffer) => resolve({ ...head, body: buffer }), reject)
    })
    req.on('error', reject)
    if (body != null) req.end(body)
    else req.end()
  })
}

// ── safeFetch ───────────────────────────────────────────────────────────────

function normalizeHeaders(headers) {
  const out = {}
  if (!headers) return out
  const entries = headers instanceof Headers ? headers.entries() : Object.entries(headers)
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) out[key.toLowerCase()] = String(value)
  }
  return out
}

function normalizeBody(body) {
  if (body === undefined || body === null) return undefined
  if (typeof body === 'string' || Buffer.isBuffer(body)) return body
  if (body instanceof Uint8Array) return Buffer.from(body)
  if (body instanceof URLSearchParams) return body.toString()
  throw new TypeError('safe-fetch: body must be a string, Buffer, Uint8Array or URLSearchParams')
}

function toResponse(result, finalUrl, redirected) {
  const { status } = result
  if (!Number.isInteger(status) || status < 200 || status > 599) {
    throw new Error(`safe-fetch: unsupported HTTP status ${status}: ${finalUrl}`)
  }
  const headers = new Headers(result.headers)
  // The body handed to Response is already decoded.
  headers.delete('content-encoding')
  headers.delete('content-length')
  const body = result.body == null || NULL_BODY_STATUSES.has(status) ? null : result.body
  let response
  try {
    response = new Response(body, { status, statusText: result.statusText ?? '', headers })
  } catch {
    response = new Response(body, { status, headers })
  }
  Object.defineProperty(response, 'url', { value: finalUrl, enumerable: true })
  Object.defineProperty(response, 'redirected', { value: redirected, enumerable: true })
  return response
}

// fetch-compatible GET/POST for untrusted URLs. Returns a standard Response.
// Options: method, headers, body, timeoutMs (whole request including every
// redirect hop), signal, maxRedirects, maxBytes. `lookup` and `transport` are
// injection points for tests.
export async function safeFetch(input, options = {}) {
  const {
    method = 'GET',
    headers,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    maxBytes = DEFAULT_MAX_BYTES,
    lookup = defaultLookup,
    transport = pinnedRequest,
  } = options

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  let current = input instanceof URL ? input.href : String(input)
  let currentMethod = String(method).toUpperCase()
  let currentBody = normalizeBody(body)
  const currentHeaders = { 'accept-encoding': 'gzip, deflate, br', ...normalizeHeaders(headers) }

  for (let hop = 0; ; hop += 1) {
    const { url, addresses } = await resolveSafeUrl(current, { lookup, signal: combinedSignal })
    if (combinedSignal.aborted) throw combinedSignal.reason

    const result = await transport({
      url,
      method: currentMethod,
      headers: { ...currentHeaders },
      body: currentBody,
      addresses,
      signal: combinedSignal,
      maxBytes,
    })

    const location = REDIRECT_STATUSES.has(result.status) ? result.headers?.get('location') : null
    if (!location) return toResponse(result, url.href, hop > 0)

    if (hop >= maxRedirects) throw new TooManyRedirectsError(maxRedirects, url.href)

    let next
    try {
      next = new URL(location, url)
    } catch {
      throw new UnsafeUrlError(`safe-fetch: invalid redirect Location "${location}": ${url.href}`, url.href)
    }

    if (result.status === 303 || ((result.status === 301 || result.status === 302) && currentMethod === 'POST')) {
      currentMethod = currentMethod === 'HEAD' ? 'HEAD' : 'GET'
      currentBody = undefined
      delete currentHeaders['content-type']
      delete currentHeaders['content-length']
    }
    if (next.origin !== url.origin) {
      for (const name of CROSS_ORIGIN_STRIPPED_HEADERS) delete currentHeaders[name]
    }
    current = next.href
  }
}
