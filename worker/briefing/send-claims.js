import { createHash } from 'node:crypto'

// Per-user, per-local-date claim on a briefing send (migration 190,
// code review 2026-10-22 P1-3). The claim is taken before the briefing is
// generated and closed after the Resend call, so a crash between the send and
// the bookkeeping writes cannot produce a second email on the next tick.

export const CLAIMS_TABLE = 'briefing_send_claims'

// A 'claimed' row older than this is treated as abandoned (worker crash or
// restart mid-send) and may be reclaimed. The briefing job runs every 5 minutes
// with a 90-minute catch-up window, so 30 minutes leaves room for two retries.
export const CLAIM_LEASE_MS = 30 * 60_000

const UNIQUE_VIOLATION = '23505'
// 42P01 is Postgres undefined_table; PostgREST reports a table missing from its
// schema cache as PGRST205 (older releases used 42P01 directly).
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205'])

export function briefingIdempotencyKey(userId, localDate) {
  return `briefing-${userId}-${localDate}`
}

export function recipientHash(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null
  return createHash('sha256').update(normalized).digest('hex')
}

export function isMissingTableError(error) {
  return Boolean(error && MISSING_TABLE_CODES.has(error.code))
}

// Returns one of:
//   { outcome: 'claimed', reclaimed }        caller owns the send
//   { outcome: 'skip', reason }              already sent, or another run holds a live lease
//   { outcome: 'unavailable' }               table missing (migration 190 not applied yet)
// Throws on any other database error.
export async function claimBriefingSend(supabase, { userId, localDate, now = new Date(), leaseMs = CLAIM_LEASE_MS }) {
  const claimedAt = now.toISOString()
  const { error: insertError } = await supabase
    .from(CLAIMS_TABLE)
    .insert({ user_id: userId, local_date: localDate, status: 'claimed', claimed_at: claimedAt })

  if (!insertError) return { outcome: 'claimed', reclaimed: false, claimedAt }
  if (isMissingTableError(insertError)) return { outcome: 'unavailable' }
  if (insertError.code !== UNIQUE_VIOLATION) {
    throw new Error(`briefing claim insert failed: ${insertError.code ?? ''} ${insertError.message}`.trim())
  }

  const { data: existing, error: readError } = await supabase
    .from(CLAIMS_TABLE)
    .select('status, claimed_at')
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .maybeSingle()
  if (readError) throw new Error(`briefing claim read failed: ${readError.message}`)
  if (!existing) return { outcome: 'skip', reason: 'claim_vanished' }

  if (existing.status === 'sent') return { outcome: 'skip', reason: 'already_sent' }

  const heldSince = new Date(existing.claimed_at).getTime()
  if (existing.status === 'claimed' && now.getTime() - heldSince < leaseMs) {
    return { outcome: 'skip', reason: 'claim_in_flight' }
  }

  // Stale 'claimed' or 'failed': take it over only if nobody else did first.
  const { data: taken, error: reclaimError } = await supabase
    .from(CLAIMS_TABLE)
    .update({ status: 'claimed', claimed_at: claimedAt, sent_at: null, provider_message_id: null })
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .eq('status', existing.status)
    .eq('claimed_at', existing.claimed_at)
    .select('user_id')
  if (reclaimError) throw new Error(`briefing claim reclaim failed: ${reclaimError.message}`)
  if (!taken?.length) return { outcome: 'skip', reason: 'claim_lost_race' }
  return { outcome: 'claimed', reclaimed: true, previousStatus: existing.status, claimedAt }
}

// Not owner-checked on purpose: once Resend has accepted an email for this
// key, the row must say 'sent' whoever holds the lease, so nobody sends again.
export async function markBriefingSendSent(supabase, { userId, localDate, providerMessageId, now = new Date() }) {
  const { error } = await supabase
    .from(CLAIMS_TABLE)
    .update({ status: 'sent', sent_at: now.toISOString(), provider_message_id: providerMessageId ?? null })
    .eq('user_id', userId)
    .eq('local_date', localDate)
  if (error) throw new Error(`briefing claim mark-sent failed: ${error.message}`)
}

// Releases a claim for retry only while this run still owns it: claimed_at is
// the lease token. A run that stalled past the lease and was reclaimed by
// another run must not flip that run's live claim to 'failed'.
export async function markBriefingSendFailed(supabase, { userId, localDate, claimedAt }) {
  const { error } = await supabase
    .from(CLAIMS_TABLE)
    .update({ status: 'failed' })
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .eq('status', 'claimed')
    .eq('claimed_at', claimedAt)
  if (error) throw new Error(`briefing claim mark-failed failed: ${error.message}`)
}
