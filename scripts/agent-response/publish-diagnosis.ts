#!/usr/bin/env npx tsx
// Runs in the publish job, which holds the Slack token and the database
// credentials but never invokes the LLM. Everything it receives from the agent
// is untrusted text: it is parsed against a strict contract and passed through
// the output safety gate before anything is posted.
//
//   npx tsx scripts/agent-response/publish-diagnosis.ts \
//     --incident incident.json --diagnosis agent-output.txt [--dry-run]

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { assertPublishable, parseDiagnosis, renderThreadMessage } from '@/lib/incident/diagnosis'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
const dryRun = args.includes('--dry-run')
// Set when the investigation itself failed. We still owe the thread a reply --
// silence after an alert is indistinguishable from the loop being switched off.
const failureNotice = flag('failed')

const incident = JSON.parse(readFileSync(flag('incident') ?? 'incident.json', 'utf8'))

function fail(reason: string): never {
  console.error(`publish failed: ${reason}`)
  process.exit(1)
}

async function main(): Promise<void> {
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined

  let text: string
  let verdict: string

  if (failureNotice) {
    // No automatic retry: a failed agent run during a live incident is a signal
    // for a human, not a reason to spend again.
    verdict = 'agent_failed'
    text = [
      ':warning: The incident agent could not complete.',
      '',
      failureNotice,
      '',
      'No retry will be attempted.',
      runUrl ? `<${runUrl}|View agent run>` : '',
    ].filter(Boolean).join('\n')
  } else {
    const rawOutput = readFileSync(flag('diagnosis') ?? 'agent-output.txt', 'utf8')
    const parsed = parseDiagnosis(rawOutput)
    if (!parsed.ok) fail(`agent output did not match the contract - ${parsed.error}`)
    verdict = parsed.diagnosis.verdict
    text = renderThreadMessage({
      diagnosis: parsed.diagnosis,
      alertClass: incident.alert_class,
      runUrl,
      dryRun,
    })

    // The agent is instructed not to leak. This is what enforces it.
    const safety = assertPublishable(text)
    if (!safety.safe) {
      fail(
        `output safety gate blocked the message (${safety.hits.join(', ')}). ` +
        'Nothing was posted. Inspect the run artifact.',
      )
    }
  }

  const token = process.env.SLACK_BOT_TOKEN
  const channel = incident.slack_channel_id || process.env.SLACK_ALERTS_PROD_CHANNEL_ID
  if (!token) fail('SLACK_BOT_TOKEN is required')
  if (!channel) fail('no channel on the incident and SLACK_ALERTS_PROD_CHANNEL_ID is unset')
  if (!incident.slack_thread_ts) fail('incident has no slack_thread_ts to reply under')

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      channel,
      thread_ts: incident.slack_thread_ts,
      text,
      unfurl_links: false,
    }),
  })

  const result = (await response.json()) as { ok: boolean; error?: string; ts?: string }
  if (!result.ok) fail(`slack rejected the reply: ${result.error}`)
  console.log(`posted ${verdict} to thread ${incident.slack_thread_ts}`)

  // Record the outcome. A failure here must not look like a failure to diagnose,
  // so it is reported separately and does not retract the Slack reply.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const supabase = createClient(url, key)
    const status = failureNotice ? 'agent_failed' : 'diagnosed'
    const { error } = await supabase
      .from('agent_incidents')
      .update({
        status,
        ...(failureNotice ? {} : { verdict }),
        updated_at: new Date().toISOString(),
      })
      .eq('fingerprint', incident.fingerprint)
    if (error) console.error(`warning: incident status not updated - ${error.code} ${error.message}`)

    await supabase.from('agent_incident_events').insert({
      fingerprint: incident.fingerprint,
      from_status: incident.status,
      to_status: status,
      actor: 'responder',
      run_id: process.env.GITHUB_RUN_ID ?? null,
      detail: { verdict, dry_run: dryRun },
    })
  }
}

main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
