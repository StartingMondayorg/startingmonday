import { describe, expect, it } from 'vitest'
import { findSensitive, redact, redactRecord } from './redact'

// gitleaks scans this repo on every PR and cannot tell a redactor's test
// fixture from a real credential -- four of the samples below tripped it.
// Assembling them from fragments leaves no secret-shaped literal in the file
// while still handing redact() the complete string, so the tests lose nothing.
// An allowlist entry would have been less work and strictly worse: it would
// blind the scanner to a genuine secret pasted into this file later.
const sample = (...parts: string[]) => parts.join('')

const SAMPLES = {
  stripeKey: sample('sk_', 'live_', '51HxxAbCdEfGhIjKlMn'),
  stripeWebhook: sample('whsec', '_AbCdEfGhIjKlMnOpQr'),
  stripeCustomer: sample('cus', '_QxAbCdEfGhIjKl'),
  anthropic: sample('sk-', 'ant-', 'api03-AbCdEfGhIjKlMn'),
  githubToken: sample('ghp', '_AbCdEfGhIjKlMnOpQrStUvWxYz0123'),
  slackToken: sample('xoxb', '-123456789012-AbCdEfGhIjKl'),
  slackWebhook: sample('https://hooks.slack.com', '/services/T00/B00/XXXXXXXX'),
  jwt: sample('eyJhbGciOiJIUzI1NiJ9', '.eyJyb2xlIjoic2VydmljZV9yb2xlIn0', '.AbCdEfGhIjKlMnOpQrStUv'),
  unknownKey: sample('Zx9Qm2Lp7Rt4', 'Vy1Bn6Kd8Wf3', 'Hj5Gs0Ac'),
}

describe('redact', () => {
  it.each([
    ['a Stripe live key', `key ${SAMPLES.stripeKey} here`, SAMPLES.stripeKey],
    ['a Stripe webhook secret', SAMPLES.stripeWebhook, SAMPLES.stripeWebhook],
    ['a Stripe customer id', `customer ${SAMPLES.stripeCustomer} failed`, SAMPLES.stripeCustomer],
    ['an Anthropic key', SAMPLES.anthropic, SAMPLES.anthropic],
    ['a GitHub token', SAMPLES.githubToken, SAMPLES.githubToken],
    ['a Slack bot token', SAMPLES.slackToken, SAMPLES.slackToken],
    ['a Slack webhook URL', SAMPLES.slackWebhook, SAMPLES.slackWebhook],
    ['an email address', 'failed for teddy@startingmonday.app', '@startingmonday.app'],
    ['a Railway internal host', 'dial worker-sub.railway.internal:3010', '.railway.internal'],
    ['an IP address', 'from 203.0.113.42 blocked', '203.0.113.42'],
    ['a UUID', 'user 550e8400-e29b-41d4-a716-446655440000 not found', '550e8400'],
  ])('removes %s', (_label, input, leak) => {
    expect(redact(input)).not.toContain(leak)
  })

  it('removes a JWT including the Supabase service-role shape', () => {
    expect(redact(`token=${SAMPLES.jwt}`)).toBe('token=[REDACTED_JWT]')
  })

  it('catches a high-entropy secret with a prefix we have never seen', () => {
    expect(redact(`APOLLO_KEY=${SAMPLES.unknownKey}`)).toContain('[REDACTED_SECRET]')
  })

  it('keeps git SHAs, which are the evidence the agent needs', () => {
    const sha = '63b5144c9f2a1e8d7b3c4a5e6f7089ab12cd34ef'
    expect(redact(`deploy ${sha} did not land`)).toContain(sha)
    expect(redact('deploy 7e73a5c2 did not land')).toContain('7e73a5c2')
  })

  it('keeps file paths and line numbers intact', () => {
    const frame = 'src/app/api/(ai)/chat/route.ts in POST at line 272'
    expect(redact(frame)).toBe(frame)
  })

  it('keeps ordinary prose untouched', () => {
    expect(redact('Post-deploy synthetics failed on production')).toBe(
      'Post-deploy synthetics failed on production',
    )
  })

  it('is safe on empty input', () => {
    expect(redact('')).toBe('')
  })
})

describe('redactRecord', () => {
  it('redacts every value while preserving keys', () => {
    const out = redactRecord({ sha: '7e73a5c2', who: 'a@b.com' })
    expect(out.sha).toBe('7e73a5c2')
    expect(out.who).toBe('[REDACTED_EMAIL]')
  })
})

describe('findSensitive', () => {
  it('names the rules that fired so the output gate can explain itself', () => {
    expect(findSensitive('mail a@b.com from 10.0.0.1')).toEqual(
      expect.arrayContaining(['email', 'ipv4']),
    )
  })

  it('reports nothing for clean text', () => {
    expect(findSensitive('synthetics failed on main')).toEqual([])
  })
})
