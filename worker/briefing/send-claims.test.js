import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createFakeSupabase } from './fake-supabase.test-helper.js'
import {
  CLAIM_LEASE_MS,
  briefingIdempotencyKey,
  claimBriefingSend,
  markBriefingSendFailed,
  markBriefingSendSent,
} from './send-claims.js'

const KEY = ['user_id', 'local_date']
const NOW = new Date('2026-10-19T09:30:00.000Z')

function claimsDb(rows = []) {
  return createFakeSupabase({ tables: { briefing_send_claims: rows }, uniqueKeys: { briefing_send_claims: KEY } })
}

describe('claimBriefingSend', () => {
  it('claims a fresh (user, date)', async () => {
    const supabase = claimsDb()
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'claimed', reclaimed: false, claimedAt: NOW.toISOString() })
    expect(supabase.db.briefing_send_claims).toEqual([
      { user_id: 'u1', local_date: '2026-10-19', status: 'claimed', claimed_at: NOW.toISOString() },
    ])
  })

  it('skips when the briefing for that date was already sent', async () => {
    const supabase = claimsDb([
      { user_id: 'u1', local_date: '2026-10-19', status: 'sent', claimed_at: '2026-10-19T09:00:00.000Z' },
    ])
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'skip', reason: 'already_sent' })
  })

  it('skips while another run holds a live claim', async () => {
    const heldAt = new Date(NOW.getTime() - CLAIM_LEASE_MS + 60_000).toISOString()
    const supabase = claimsDb([{ user_id: 'u1', local_date: '2026-10-19', status: 'claimed', claimed_at: heldAt }])
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'skip', reason: 'claim_in_flight' })
    expect(supabase.db.briefing_send_claims[0].claimed_at).toBe(heldAt)
  })

  it('reclaims a stale claim left by a crashed run', async () => {
    const heldAt = new Date(NOW.getTime() - CLAIM_LEASE_MS - 60_000).toISOString()
    const supabase = claimsDb([{ user_id: 'u1', local_date: '2026-10-19', status: 'claimed', claimed_at: heldAt }])
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'claimed', reclaimed: true, previousStatus: 'claimed', claimedAt: NOW.toISOString() })
    expect(supabase.db.briefing_send_claims[0]).toMatchObject({ status: 'claimed', claimed_at: NOW.toISOString() })
  })

  it('reclaims a failed claim immediately', async () => {
    const supabase = claimsDb([
      { user_id: 'u1', local_date: '2026-10-19', status: 'failed', claimed_at: NOW.toISOString() },
    ])
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toMatchObject({ outcome: 'claimed', reclaimed: true, previousStatus: 'failed' })
  })

  it('backs off when another run reclaimed the stale row first', async () => {
    const heldAt = new Date(NOW.getTime() - CLAIM_LEASE_MS - 60_000).toISOString()
    const supabase = createFakeSupabase({
      tables: { briefing_send_claims: [{ user_id: 'u1', local_date: '2026-10-19', status: 'claimed', claimed_at: heldAt }] },
      uniqueKeys: { briefing_send_claims: KEY },
      // Simulates the competing run's update landing between our read and our compare-and-swap.
      failures: {
        'briefing_send_claims:update': state => {
          state.filters = state.filters.map(f => (f[1] === 'claimed_at' ? ['eq', 'claimed_at', 'someone-else'] : f))
          return null
        },
      },
    })
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'skip', reason: 'claim_lost_race' })
  })

  it('reports the table as unavailable when migration 190 is not applied', async () => {
    const supabase = createFakeSupabase({ missingTables: ['briefing_send_claims'] })
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'unavailable' })
  })

  it('also treats Postgres undefined_table (42P01) as unavailable', async () => {
    const supabase = createFakeSupabase({
      failures: { 'briefing_send_claims:insert': { code: '42P01', message: 'relation does not exist' } },
    })
    const result = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(result).toEqual({ outcome: 'unavailable' })
  })

  it('throws on other database errors', async () => {
    const supabase = createFakeSupabase({
      failures: { 'briefing_send_claims:insert': { code: '08006', message: 'connection failure' } },
    })
    await expect(claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW }))
      .rejects.toThrow('briefing claim insert failed')
  })
})

describe('claim outcome writes', () => {
  it('records sent status, time, and provider id', async () => {
    const supabase = claimsDb([{ user_id: 'u1', local_date: '2026-10-19', status: 'claimed', claimed_at: NOW.toISOString() }])
    await markBriefingSendSent(supabase, { userId: 'u1', localDate: '2026-10-19', providerMessageId: 'msg_1', now: NOW })
    expect(supabase.db.briefing_send_claims[0]).toMatchObject({
      status: 'sent', sent_at: NOW.toISOString(), provider_message_id: 'msg_1',
    })
  })

  it('marks only a still-claimed row as failed', async () => {
    const supabase = claimsDb([{ user_id: 'u1', local_date: '2026-10-19', status: 'sent', claimed_at: NOW.toISOString() }])
    await markBriefingSendFailed(supabase, { userId: 'u1', localDate: '2026-10-19', claimedAt: NOW.toISOString() })
    expect(supabase.db.briefing_send_claims[0].status).toBe('sent')
  })

  it('does not let a stalled run fail the live claim of the run that reclaimed it', async () => {
    const staleAt = new Date(NOW.getTime() - CLAIM_LEASE_MS - 60_000)
    const supabase = claimsDb()

    const runA = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: staleAt })
    const runB = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: NOW })
    expect(runB).toMatchObject({ outcome: 'claimed', reclaimed: true })

    // Run A wakes up, fails, and tries to release what it thinks is its claim.
    await markBriefingSendFailed(supabase, { userId: 'u1', localDate: '2026-10-19', claimedAt: runA.claimedAt })
    expect(supabase.db.briefing_send_claims[0]).toMatchObject({ status: 'claimed', claimed_at: runB.claimedAt })

    // So a third run still sees B's live lease and stays out.
    const runC = await claimBriefingSend(supabase, { userId: 'u1', localDate: '2026-10-19', now: new Date(NOW.getTime() + 60_000) })
    expect(runC).toEqual({ outcome: 'skip', reason: 'claim_in_flight' })

    // B's own release still works.
    await markBriefingSendFailed(supabase, { userId: 'u1', localDate: '2026-10-19', claimedAt: runB.claimedAt })
    expect(supabase.db.briefing_send_claims[0].status).toBe('failed')
  })

  it('derives the Resend idempotency key from the claim key', () => {
    expect(briefingIdempotencyKey('u1', '2026-10-19')).toBe('briefing-u1-2026-10-19')
  })
})

describe('migration 190 briefing_send_claims', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/190_briefing_send_claims.sql'), 'utf8')

  it('keys claims by user and local date with the expected statuses', () => {
    expect(sql).toContain('primary key (user_id, local_date)')
    expect(sql).toContain("check (status in ('claimed', 'sent', 'failed'))")
  })

  it('is service-role only: RLS on, no policies, explicit grants', () => {
    expect(sql).toContain('alter table public.briefing_send_claims enable row level security')
    expect(sql).not.toMatch(/create policy/i)
    expect(sql).toContain('revoke all on table public.briefing_send_claims from anon, authenticated')
    expect(sql).toContain('grant select, insert, update, delete on table public.briefing_send_claims to service_role')
  })
})
