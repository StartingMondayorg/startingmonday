import { createHmac, timingSafeEqual } from 'crypto'

// Slack signs every request with HMAC-SHA256 over "v0:<timestamp>:<raw body>".
// The raw body must be the exact bytes Slack sent, so callers have to read
// request.text() before any JSON parsing -- the same ordering the Stripe and
// Resend receivers use.
//
// This route sits under a webhooks/ path segment, which scripts/check-api-guards.mjs
// excludes from its audit. That exclusion means nothing else verifies this
// endpoint is authenticated, so the check below is the only thing standing
// between an anonymous POST and a repository_dispatch.

const VERSION = 'v0'
const MAX_SKEW_SECONDS = 300

export type SignatureResult = { ok: true } | { ok: false; reason: string }

export function verifySlackSignature(options: {
  rawBody: string
  signature: string | null
  timestamp: string | null
  signingSecret: string | undefined
  nowSeconds?: number
}): SignatureResult {
  const { rawBody, signature, timestamp, signingSecret } = options
  if (!signingSecret) return { ok: false, reason: 'missing_signing_secret' }
  if (!signature || !timestamp) return { ok: false, reason: 'missing_headers' }

  const sent = Number(timestamp)
  if (!Number.isFinite(sent)) return { ok: false, reason: 'bad_timestamp' }

  // Replay window. Without it a captured request stays valid forever.
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000)
  if (Math.abs(now - sent) > MAX_SKEW_SECONDS) return { ok: false, reason: 'stale_timestamp' }

  const expected = `${VERSION}=${createHmac('sha256', signingSecret)
    .update(`${VERSION}:${timestamp}:${rawBody}`)
    .digest('hex')}`

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return { ok: false, reason: 'signature_mismatch' }
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'signature_mismatch' }
}

/** Test/fixture helper: produces the header pair Slack would send. */
export function signSlackRequest(rawBody: string, signingSecret: string, timestamp: number) {
  const ts = String(timestamp)
  return {
    'x-slack-request-timestamp': ts,
    'x-slack-signature': `${VERSION}=${createHmac('sha256', signingSecret)
      .update(`${VERSION}:${ts}:${rawBody}`)
      .digest('hex')}`,
  }
}
