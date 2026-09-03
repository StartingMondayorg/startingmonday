import { beforeEach, describe, expect, it, vi } from 'vitest'

const dispatchIncident = vi.fn()
const afterCallbacks: Array<() => unknown> = []

vi.mock('next/server', async importOriginal => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (cb: () => unknown) => void afterCallbacks.push(cb) }
})
vi.mock('@/lib/incident/github-dispatch', () => ({ dispatchIncident }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => supabaseStub }))

// Minimal Supabase stub: records calls and lets each test decide what claim returns.
let claimResult: { data: unknown; error: unknown } = { data: null, error: null }
let budgetResult: { data: unknown; error: unknown } = { data: true, error: null }
const inserted: Array<{ table: string; row: unknown }> = []
const supabaseStub = {
  from: (table: string) => ({
    insert: (row: unknown) => {
      inserted.push({ table, row })
      return Promise.resolve({ error: null })
    },
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }),
  rpc: (fn: string) =>
    Promise.resolve(fn === 'claim_agent_incident' ? claimResult : budgetResult),
}

const { POST, shouldIgnore } = await import('./route')
const { signSlackRequest } = await import('@/lib/slack-signature')

const SECRET = 'signing-secret'
const CHANNEL = 'C_ALERTS_PROD'

function post(body: unknown, opts: { sign?: boolean; secret?: string } = {}) {
  const raw = JSON.stringify(body)
  const headers = new Headers({ 'content-type': 'application/json' })
  if (opts.sign !== false) {
    const signed = signSlackRequest(raw, opts.secret ?? SECRET, Math.floor(Date.now() / 1000))
    for (const [k, v] of Object.entries(signed)) headers.set(k, v)
  }
  return POST(new Request('https://startingmonday.app/api/webhooks/slack', {
    method: 'POST', headers, body: raw,
  }) as never)
}

async function drainAfter() {
  while (afterCallbacks.length) await afterCallbacks.shift()!()
}

beforeEach(() => {
  vi.stubEnv('SLACK_SIGNING_SECRET', SECRET)
  vi.stubEnv('SLACK_ALERTS_PROD_CHANNEL_ID', CHANNEL)
  vi.stubEnv('AGENT_RESPONDER_ENABLED', '1')
  vi.stubEnv('AGENT_APP_ID', '1')
  vi.stubEnv('AGENT_APP_PRIVATE_KEY', 'key')
  dispatchIncident.mockReset()
  afterCallbacks.length = 0
  inserted.length = 0
  claimResult = { data: [{ is_new: true, occurrences: 1, current_status: 'open' }], error: null }
  budgetResult = { data: true, error: null }
})

const sentryAlert = {
  type: 'event_callback',
  event_id: 'Ev1',
  event: {
    type: 'message', channel: CHANNEL, ts: '1760000000.1', bot_id: 'B_SENTRY',
    text: 'TypeError https://sentry.io/organizations/sm/issues/6412887301/',
  },
}

describe('POST /api/webhooks/slack', () => {
  it('rejects an unsigned request', async () => {
    const res = await post(sentryAlert, { sign: false })
    expect(res.status).toBe(401)
  })

  it('rejects a request signed with the wrong secret', async () => {
    const res = await post(sentryAlert, { secret: 'attacker' })
    expect(res.status).toBe(401)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('answers the Slack url_verification handshake', async () => {
    const res = await post({ type: 'url_verification', challenge: 'abc123' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ challenge: 'abc123' })
  })

  it('acknowledges immediately and defers the work, so Slack does not retry', async () => {
    const res = await post(sentryAlert)
    expect(res.status).toBe(200)
    // Nothing has run yet: the ack must not wait on Supabase or GitHub.
    expect(dispatchIncident).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(1)
  })

  it('dispatches an actionable first-occurrence alert', async () => {
    await post(sentryAlert)
    await drainAfter()
    expect(dispatchIncident).toHaveBeenCalledOnce()
    expect(dispatchIncident.mock.calls[0][0]).toMatchObject({
      alertClass: 'app-error-new', mode: 'diagnose-and-patch',
    })
  })

  it('does not dispatch when the kill switch is off', async () => {
    vi.stubEnv('AGENT_RESPONDER_ENABLED', '0')
    await post(sentryAlert)
    await drainAfter()
    expect(dispatchIncident).not.toHaveBeenCalled()
  })

  it('does not dispatch a repeat delivery of the same fingerprint', async () => {
    claimResult = { data: [{ is_new: false, occurrences: 7, current_status: 'dispatched' }], error: null }
    await post(sentryAlert)
    await drainAfter()
    expect(dispatchIncident).not.toHaveBeenCalled()
  })

  it('fails closed when the incident claim errors', async () => {
    claimResult = { data: null, error: { message: 'db down' } }
    await post(sentryAlert)
    await drainAfter()
    expect(dispatchIncident).not.toHaveBeenCalled()
  })

  it('does not dispatch once the daily budget is spent', async () => {
    budgetResult = { data: false, error: null }
    await post(sentryAlert)
    await drainAfter()
    expect(dispatchIncident).not.toHaveBeenCalled()
  })
})

describe('shouldIgnore', () => {
  const base = { type: 'message', channel: CHANNEL, text: 'P0 Synthetic failure - 1/8 checks failed' }

  it('accepts a root alert in the target channel', () => {
    expect(shouldIgnore(base, CHANNEL)).toBeNull()
  })

  it('ignores thread replies, which is how the agent avoids answering itself', () => {
    expect(shouldIgnore({ ...base, thread_ts: '1.0' }, CHANNEL)).toBe('thread_reply')
  })

  it('ignores other channels', () => {
    expect(shouldIgnore({ ...base, channel: 'C_OTHER' }, CHANNEL)).toBe('other_channel')
  })

  it('ignores the routing test from slack-alert-test.yml', () => {
    expect(shouldIgnore({ ...base, text: '✅ Slack alert test (prod tier)' }, CHANNEL)).toBe('routing_test')
  })

  it('ignores edits and deletions', () => {
    expect(shouldIgnore({ ...base, subtype: 'message_changed' }, CHANNEL)).toBe('subtype_message_changed')
  })
})
