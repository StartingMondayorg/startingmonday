import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase } from '../briefing/fake-supabase.test-helper.js'

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  assembleContext: vi.fn(),
  generateBriefing: vi.fn(),
  sendBriefing: vi.fn(),
}))

vi.mock('../lib/supabase.js', () => ({ getSupabase: mocks.getSupabase }))
vi.mock('../lib/logger.js', () => ({ logger: mocks.logger }))
vi.mock('../lib/usage-tracker.js', () => ({ trackUsage: vi.fn(async () => {}) }))
vi.mock('../briefing/assemble-context.js', () => ({ assembleContext: mocks.assembleContext }))
vi.mock('../briefing/generate-briefing.js', () => ({ generateBriefing: mocks.generateBriefing }))
vi.mock('../briefing/email-template.js', () => ({ renderBriefingEmail: () => '<p>briefing</p>' }))
vi.mock('../briefing/send-briefing.js', () => ({ sendBriefing: mocks.sendBriefing }))
vi.mock('../lib/watermark.js', () => ({
  watermarkEmailHtml: html => html,
  injectTrackingPixel: html => html,
}))

import { runBriefingJob } from './briefing-job.js'
import { CLAIM_LEASE_MS, recipientHash } from '../briefing/send-claims.js'

// Monday 2026-10-19, 09:30 UTC: inside the 09:00 UTC briefing window.
const NOW = new Date('2026-10-19T09:30:00.000Z')
const TODAY = '2026-10-19'

const USERS = [
  { id: 'user-a', email: 'alice@example.com', subscription_status: 'active' },
  { id: 'user-b', email: 'bob@example.com', subscription_status: 'active' },
]

function profile(userId) {
  return {
    user_id: userId,
    full_name: 'Test User',
    briefing_time: '09:00:00',
    briefing_timezone: 'UTC',
    briefing_days: ['Monday'],
    last_briefing_sent_at: null,
    briefing_frequency: 'daily',
    search_status: 'active',
    placed_at: null,
  }
}

function setup({ users = USERS, claims = [], failures = {}, missingTables = [] } = {}) {
  const supabase = createFakeSupabase({
    tables: {
      users,
      user_profiles: users.map(u => profile(u.id)),
      user_events: [],
      briefing_send_claims: claims,
      company_signals: [],
      team_seats: [],
      partners: [],
    },
    uniqueKeys: { briefing_send_claims: ['user_id', 'local_date'] },
    failures,
    missingTables,
  })
  mocks.getSupabase.mockReturnValue(supabase)
  return supabase
}

function loggedText() {
  return JSON.stringify([
    ...mocks.logger.info.mock.calls,
    ...mocks.logger.warn.mock.calls,
    ...mocks.logger.error.mock.calls,
  ])
}

describe('runBriefingJob send claims', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    for (const fn of [mocks.logger.info, mocks.logger.warn, mocks.logger.error, mocks.assembleContext, mocks.generateBriefing, mocks.sendBriefing]) {
      fn.mockReset()
    }
    mocks.assembleContext.mockImplementation(async (_s, userId) => ({ userId, todayStr: TODAY, signals: [], patternAlerts: [] }))
    mocks.generateBriefing.mockResolvedValue({ subject: 'Your briefing' })
    mocks.sendBriefing.mockImplementation(async ({ userId }) => ({ id: `msg-${userId}` }))
  })
  afterEach(() => { vi.useRealTimers() })

  it('claims, sends with the claim as idempotency key, and records the provider id', async () => {
    const supabase = setup({ users: [USERS[0]] })

    await runBriefingJob()

    expect(mocks.sendBriefing).toHaveBeenCalledTimes(1)
    expect(mocks.sendBriefing.mock.calls[0][0]).toMatchObject({
      to: 'alice@example.com',
      idempotencyKey: `briefing-user-a-${TODAY}`,
      userId: 'user-a',
    })
    expect(supabase.db.briefing_send_claims).toEqual([
      expect.objectContaining({
        user_id: 'user-a', local_date: TODAY, status: 'sent', provider_message_id: 'msg-user-a', sent_at: NOW.toISOString(),
      }),
    ])
    expect(mocks.logger.info).toHaveBeenCalledWith('briefing-job: complete', { sent: 1, skipped: 0, failed: 0 })
  })

  it('skips without generating or sending when the claim is already sent', async () => {
    // A crash after the earlier send left last_briefing_sent_at unset; only the claim remembers.
    setup({ claims: [{ user_id: 'user-a', local_date: TODAY, status: 'sent', claimed_at: NOW.toISOString() }], users: [USERS[0]] })

    await runBriefingJob()

    expect(mocks.generateBriefing).not.toHaveBeenCalled()
    expect(mocks.sendBriefing).not.toHaveBeenCalled()
    expect(mocks.logger.info).toHaveBeenCalledWith('briefing-job: complete', { sent: 0, skipped: 1, failed: 0 })
  })

  it('skips while another run holds a live claim', async () => {
    const heldAt = new Date(NOW.getTime() - 5 * 60_000).toISOString()
    setup({ claims: [{ user_id: 'user-a', local_date: TODAY, status: 'claimed', claimed_at: heldAt }], users: [USERS[0]] })

    await runBriefingJob()

    expect(mocks.sendBriefing).not.toHaveBeenCalled()
  })

  it('reclaims a stale claim and sends', async () => {
    const heldAt = new Date(NOW.getTime() - CLAIM_LEASE_MS - 60_000).toISOString()
    const supabase = setup({ claims: [{ user_id: 'user-a', local_date: TODAY, status: 'claimed', claimed_at: heldAt }], users: [USERS[0]] })

    await runBriefingJob()

    expect(mocks.sendBriefing).toHaveBeenCalledTimes(1)
    expect(supabase.db.briefing_send_claims[0]).toMatchObject({ status: 'sent', provider_message_id: 'msg-user-a' })
  })

  it('records a reclaimed send as sent when Resend reports the key was already used', async () => {
    const heldAt = new Date(NOW.getTime() - CLAIM_LEASE_MS - 60_000).toISOString()
    const supabase = setup({ claims: [{ user_id: 'user-a', local_date: TODAY, status: 'claimed', claimed_at: heldAt }], users: [USERS[0]] })
    mocks.sendBriefing.mockRejectedValue(Object.assign(new Error('Resend 409 invalid_idempotent_request'), {
      status: 409, code: 'invalid_idempotent_request',
    }))

    await runBriefingJob()

    expect(supabase.db.briefing_send_claims[0]).toMatchObject({ status: 'sent', provider_message_id: null })
    expect(supabase.db.user_profiles[0].last_briefing_sent_at).toBe(NOW.toISOString())
  })

  it('keeps going after one user fails, releases that claim, and fails the job with counts', async () => {
    const supabase = setup()
    mocks.sendBriefing.mockImplementation(async ({ userId }) => {
      if (userId === 'user-a') throw new Error('Resend 500')
      return { id: `msg-${userId}` }
    })

    await expect(runBriefingJob()).rejects.toThrow('briefing-job: 1 of 2 users failed (sent 1, skipped 0)')

    const byUser = Object.fromEntries(supabase.db.briefing_send_claims.map(c => [c.user_id, c]))
    expect(byUser['user-a'].status).toBe('failed')
    expect(byUser['user-b']).toMatchObject({ status: 'sent', provider_message_id: 'msg-user-b' })
    expect(mocks.logger.info).toHaveBeenCalledWith('briefing-job: complete', { sent: 1, skipped: 0, failed: 1 })
    expect(supabase.rpc).toHaveBeenCalledWith('advisory_unlock', expect.anything())
  })

  it('does not release the claim when bookkeeping fails after delivery', async () => {
    const supabase = setup({
      users: [USERS[0]],
      failures: { 'user_profiles:update': { code: '08006', message: 'connection failure' } },
    })

    await expect(runBriefingJob()).rejects.toThrow('1 of 1 users failed')

    expect(supabase.db.briefing_send_claims[0].status).toBe('sent')
  })

  it('falls back to sending without claims when migration 190 is missing, warning once', async () => {
    setup({ missingTables: ['briefing_send_claims'] })

    await runBriefingJob()

    expect(mocks.sendBriefing).toHaveBeenCalledTimes(2)
    const warnings = mocks.logger.warn.mock.calls.filter(([msg]) => msg.includes('briefing_send_claims table missing'))
    expect(warnings).toHaveLength(1)
    expect(mocks.logger.info).toHaveBeenCalledWith('briefing-job: complete', { sent: 2, skipped: 0, failed: 0 })
  })

  it('never logs or stores recipient email addresses', async () => {
    const supabase = setup()
    mocks.sendBriefing.mockImplementation(async ({ userId }) => {
      if (userId === 'user-b') throw new Error('Resend 500')
      return { id: `msg-${userId}` }
    })

    await runBriefingJob().catch(() => {})

    const logged = loggedText()
    expect(logged).not.toContain('alice@example.com')
    expect(logged).not.toContain('bob@example.com')
    expect(logged).toContain('user-a')

    const [event] = supabase.db.user_events
    expect(event.event_name).toBe('briefing_email_sent')
    expect(event.properties).not.toHaveProperty('to')
    expect(JSON.stringify(event.properties)).not.toContain('@')
    expect(event.properties.recipient_hash).toBe(recipientHash('alice@example.com'))
  })

  it('still dedupes a shared inbox using legacy events that stored the raw address', async () => {
    const supabase = setup({ users: [{ id: 'user-c', email: 'Alice@Example.com', subscription_status: 'trialing' }] })
    supabase.db.user_events.push({
      user_id: 'user-a',
      event_name: 'briefing_email_sent',
      created_at: new Date(NOW.getTime() - 10 * 60_000).toISOString(),
      properties: { source: 'briefing-job', to: 'alice@example.com' },
    })

    await runBriefingJob()

    expect(mocks.sendBriefing).not.toHaveBeenCalled()
  })
})
