#!/usr/bin/env npx tsx
// Renders the Jira summary and description for an incident, before the agent
// runs. Filing the ticket first means it survives an agent crash and gives the
// branch name and PR title their SMK key.
//
//   npx tsx scripts/agent-response/build-ticket-body.ts --incident incident.json \
//     --summary-out summary.txt --body-out ticket.txt

import { readFileSync, writeFileSync } from 'node:fs'
import { redact } from '@/lib/incident/redact'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

function main(): void {
  const incident = JSON.parse(readFileSync(flag('incident') ?? 'incident.json', 'utf8'))
  const evidence: Record<string, string> = incident.evidence ?? {}

  // Evidence is already redacted at ingest; redacting again is cheap and means
  // a gap upstream cannot reach a Jira ticket.
  const headline = redact(String(evidence.summary ?? evidence.tests ?? incident.signal_key ?? ''))
    .split('\n')[0]
    .replace(/[<>|*]/g, '')
    .trim()
    .slice(0, 120)

  const summary = `[${incident.alert_class}] ${headline || incident.signal_key || 'production alert'}`

  const body = [
    `Automated incident report. Filed before diagnosis, so this ticket exists even if the agent run fails.`,
    `Alert class: ${incident.alert_class}`,
    `Signal: ${incident.signal_key}`,
    `Times seen: ${incident.occurrence_count}`,
    `First seen: ${incident.first_seen_at}`,
    `Fingerprint: ${incident.fingerprint}`,
    'Evidence:\n' + (Object.entries(evidence).map(([k, v]) => `${k}: ${redact(String(v))}`).join('\n') || 'none'),
    'Runbook: docs/sre/runbooks/agent-incident-loop.md',
  ].join('\n\n')

  writeFileSync(flag('summary-out') ?? 'summary.txt', summary)
  writeFileSync(flag('body-out') ?? 'ticket.txt', body)
  console.log(`summary: ${summary}`)
}

main()
