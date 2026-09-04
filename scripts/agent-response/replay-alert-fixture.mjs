#!/usr/bin/env node
// Signs a committed alert fixture the way Slack would and POSTs it at the
// receiver. This is the Stage 0 verification vehicle: it proves classification,
// dedup and the storm rule without waiting for a real production incident.
//
//   node scripts/agent-response/replay-alert-fixture.mjs synthetics-p0 --count 12
//   node scripts/agent-response/replay-alert-fixture.mjs routing-test --url http://localhost:3000
//
// SLACK_SIGNING_SECRET must match the receiver's.

import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'

const args = process.argv.slice(2)
const name = args.find(a => !a.startsWith('--'))
const flag = (key, fallback) => {
  const i = args.indexOf(`--${key}`)
  return i === -1 ? fallback : args[i + 1]
}

const dir = new URL('../../docs/fixtures/alerts/', import.meta.url)
if (!name) {
  console.error('Usage: replay-alert-fixture.mjs <fixture> [--count N] [--url URL]')
  console.error(`Fixtures: ${readdirSync(dir).map(f => f.replace('.json', '')).join(', ')}`)
  process.exit(1)
}

const secret = process.env.SLACK_SIGNING_SECRET
if (!secret) {
  console.error('SLACK_SIGNING_SECRET is required so the receiver can verify the replay.')
  process.exit(1)
}

const baseUrl = flag('url', process.env.REPLAY_TARGET_URL ?? 'http://localhost:3000')
const count = Number(flag('count', '1'))
const event = JSON.parse(readFileSync(new URL(`${name}.json`, dir), 'utf8'))
const channel = process.env.SLACK_ALERTS_PROD_CHANNEL_ID
if (channel) event.channel = channel

let sent = 0
for (let i = 0; i < count; i += 1) {
  // A fresh event_id per delivery: Slack only reuses one when it is retrying.
  // Using distinct ids here is what makes this a genuine storm test rather than
  // a test of the retry-dedup table.
  const body = JSON.stringify({
    type: 'event_callback',
    event_id: `Ev${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    event: { ...event, ts: `${Date.now() / 1000 + i}` },
  })
  const ts = String(Math.floor(Date.now() / 1000))
  const signature = `v0=${createHmac('sha256', secret).update(`v0:${ts}:${body}`).digest('hex')}`

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/webhooks/slack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slack-request-timestamp': ts,
      'x-slack-signature': signature,
    },
    body,
  })
  if (!response.ok) {
    console.error(`delivery ${i + 1}: ${response.status} ${await response.text()}`)
    process.exit(1)
  }
  sent += 1
}

console.log(`sent ${sent} delivery(ies) of "${name}" to ${baseUrl}`)
console.log('Expected: exactly one agent_incidents row, occurrence_count =', count)
