import { after, type NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { verifySlackSignature } from '@/lib/slack-signature'
import { classify, type SlackMessageEvent } from '@/lib/incident/classify'
import { fingerprint } from '@/lib/incident/fingerprint'
import { redactRecord } from '@/lib/incident/redact'
import { decideDispatch, globalDailyLimit } from '@/lib/incident/config'
import { dispatchIncident } from '@/lib/incident/github-dispatch'

// Slack Events receiver for #alerts-prod. An alert lands in the channel, this
// route classifies it, dedupes it by fingerprint, and fires a repository_dispatch
// that wakes the incident-response agent.
//
// AUTHENTICATION: the Slack v0 HMAC check below is the ONLY thing guarding this
// endpoint. scripts/check-api-guards.mjs deliberately excludes every route under
// a webhooks/ path segment from its audit, so nothing else will notice if this
// check is weakened or removed. Treat it as security-critical.
//
// Runbook: docs/sre/runbooks/agent-incident-loop.md

export const dynamic = 'force-dynamic'

type SlackEnvelope = {
  type?: string
  challenge?: string
  event_id?: string
  event?: SlackMessageEvent
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function log(stage: string, detail: Record<string, unknown>) {
  console.log(JSON.stringify({ scope: 'slack-incident-webhook', stage, ...detail }))
}

/**
 * Messages we must never act on. Ordered cheapest-first; the bot-self check is
 * the primary anti-recursion stop, since the agent posts its own replies into
 * this same channel.
 */
export function shouldIgnore(event: SlackMessageEvent | undefined, channelId: string): string | null {
  if (!event) return 'no_event'
  if (event.type !== 'message') return 'not_a_message'
  if (channelId && event.channel !== channelId) return 'other_channel'
  // Thread replies include our own agent's answers. Only root alerts count.
  if (event.thread_ts) return 'thread_reply'
  if (event.subtype && event.subtype !== 'bot_message') return `subtype_${event.subtype}`

  const text = event.text ?? ''
  if (/Slack Alert Test|Slack alert test/i.test(text)) return 'routing_test'
  if (/Simulated/i.test(text)) return 'simulated'
  return null
}

async function handleEvent(envelope: SlackEnvelope): Promise<void> {
  const channelId = process.env.SLACK_ALERTS_PROD_CHANNEL_ID ?? ''
  const eventId = envelope.event_id
  const event = envelope.event

  const ignored = shouldIgnore(event, channelId)
  if (ignored) {
    log('ignored', { event_id: eventId, reason: ignored })
    return
  }

  const supabase = createAdminClient()

  // Slack retries a delivery it thinks failed, reusing the event_id. Claiming it
  // first makes the whole handler idempotent.
  if (eventId) {
    const { error } = await supabase.from('agent_slack_events').insert({ event_id: eventId })
    if (error) {
      log('duplicate_delivery', { event_id: eventId })
      return
    }
  }

  const classification = classify(event!)
  if (!classification) {
    log('unclassified', { event_id: eventId, text: (event!.text ?? '').slice(0, 120) })
    return
  }

  const { alertClass, signalKey, evidence } = classification
  const fp = fingerprint(alertClass, signalKey)
  const safeEvidence = redactRecord(evidence)

  const { data, error } = await supabase.rpc('claim_agent_incident', {
    p_fingerprint: fp,
    p_alert_class: alertClass,
    p_signal_key: signalKey,
    p_channel: event!.channel ?? channelId,
    p_thread_ts: event!.ts ?? null,
    p_evidence: safeEvidence,
  })

  if (error || !data?.[0]) {
    // Fail closed: the incident where the database is down must not also be the
    // incident where an unbounded agent fires.
    log('claim_failed', { event_id: eventId, fingerprint: fp, error: error?.message })
    return
  }

  const claim = data[0] as { is_new: boolean; occurrences: number; current_status: string }
  log('claimed', { fingerprint: fp, alert_class: alertClass, occurrences: claim.occurrences })

  const failed = safeEvidence.failed ?? ''
  const [failedCount, totalCount] = failed.split('/').map(Number)

  const decision = decideDispatch({
    alertClass,
    signalKey,
    fingerprint: fp,
    occurrenceCount: claim.occurrences,
    enabled: process.env.AGENT_RESPONDER_ENABLED === '1',
    allFailing: Number.isFinite(failedCount) && failedCount === totalCount,
  })

  if (!decision.dispatch) {
    log('no_dispatch', { fingerprint: fp, reason: decision.reason, mode: decision.mode })
    return
  }

  const { data: allowed, error: budgetError } = await supabase.rpc('consume_agent_dispatch_budget', {
    p_limit: globalDailyLimit(),
  })
  if (budgetError || allowed !== true) {
    log('budget_exhausted', { fingerprint: fp, limit: globalDailyLimit(), error: budgetError?.message })
    return
  }

  try {
    await dispatchIncident({
      owner: process.env.GITHUB_REPO_OWNER ?? 'StartingMondayorg',
      repo: process.env.GITHUB_REPO_NAME ?? 'startingmonday',
      appId: process.env.AGENT_APP_ID!,
      privateKey: process.env.AGENT_APP_PRIVATE_KEY!,
      fingerprint: fp,
      alertClass,
      mode: decision.mode,
    })
    await supabase
      .from('agent_incidents')
      .update({ status: 'dispatched', dispatched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('fingerprint', fp)
    await supabase.from('agent_incident_events').insert({
      fingerprint: fp,
      from_status: claim.current_status,
      to_status: 'dispatched',
      actor: 'ingress',
      detail: { alert_class: alertClass, mode: decision.mode },
    })
    log('dispatched', { fingerprint: fp, mode: decision.mode })
  } catch (dispatchError) {
    log('dispatch_failed', { fingerprint: fp, error: (dispatchError as Error).message })
  }
}

export async function POST(request: NextRequest) {
  // Raw body first: the HMAC covers the exact bytes Slack sent, so any parse
  // before this point would break verification.
  const rawBody = await request.text()

  const verification = verifySlackSignature({
    rawBody,
    signature: request.headers.get('x-slack-signature'),
    timestamp: request.headers.get('x-slack-request-timestamp'),
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  })
  if (!verification.ok) {
    log('rejected', { reason: verification.reason })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let envelope: SlackEnvelope
  try {
    envelope = JSON.parse(rawBody) as SlackEnvelope
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // One-time handshake when the Request URL is saved in the Slack app config.
  if (envelope.type === 'url_verification' && envelope.challenge) {
    return NextResponse.json({ challenge: envelope.challenge })
  }

  // Slack retries anything not acknowledged within 3 seconds, so acknowledge
  // now and do the classification, database work and dispatch afterwards.
  after(() => handleEvent(envelope).catch(error => log('handler_error', { error: (error as Error).message })))

  return NextResponse.json({ ok: true })
}
