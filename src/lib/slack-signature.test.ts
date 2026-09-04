import { describe, expect, it } from 'vitest'
import { signSlackRequest, verifySlackSignature } from './slack-signature'

const SECRET = 'test-signing-secret'
const NOW = 1_760_000_000

function headersFor(body: string, at = NOW) {
  return signSlackRequest(body, SECRET, at)
}

describe('verifySlackSignature', () => {
  const body = JSON.stringify({ type: 'event_callback', event: { text: 'hi' } })

  it('accepts a correctly signed request', () => {
    const h = headersFor(body)
    expect(
      verifySlackSignature({
        rawBody: body,
        signature: h['x-slack-signature'],
        timestamp: h['x-slack-request-timestamp'],
        signingSecret: SECRET,
        nowSeconds: NOW,
      }),
    ).toEqual({ ok: true })
  })

  it('rejects a body that changed after signing', () => {
    const h = headersFor(body)
    const result = verifySlackSignature({
      rawBody: body.replace('hi', 'ho'),
      signature: h['x-slack-signature'],
      timestamp: h['x-slack-request-timestamp'],
      signingSecret: SECRET,
      nowSeconds: NOW,
    })
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('rejects a valid signature replayed outside the 5-minute window', () => {
    const h = headersFor(body)
    const result = verifySlackSignature({
      rawBody: body,
      signature: h['x-slack-signature'],
      timestamp: h['x-slack-request-timestamp'],
      signingSecret: SECRET,
      nowSeconds: NOW + 301,
    })
    expect(result).toEqual({ ok: false, reason: 'stale_timestamp' })
  })

  it('rejects a signature made with a different secret', () => {
    const h = signSlackRequest(body, 'attacker-secret', NOW)
    const result = verifySlackSignature({
      rawBody: body,
      signature: h['x-slack-signature'],
      timestamp: h['x-slack-request-timestamp'],
      signingSecret: SECRET,
      nowSeconds: NOW,
    })
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('fails closed when the secret is unset rather than accepting anything', () => {
    const h = headersFor(body)
    expect(
      verifySlackSignature({
        rawBody: body,
        signature: h['x-slack-signature'],
        timestamp: h['x-slack-request-timestamp'],
        signingSecret: undefined,
        nowSeconds: NOW,
      }),
    ).toEqual({ ok: false, reason: 'missing_signing_secret' })
  })

  it('rejects missing headers', () => {
    expect(
      verifySlackSignature({ rawBody: body, signature: null, timestamp: null, signingSecret: SECRET }),
    ).toEqual({ ok: false, reason: 'missing_headers' })
  })
})
