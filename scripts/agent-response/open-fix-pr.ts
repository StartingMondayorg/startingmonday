#!/usr/bin/env npx tsx
// Validates an agent-authored patch, applies it, and opens a DRAFT pull request.
// Runs in the publish job, which holds the GitHub App token and never invokes a
// model.
//
//   npx tsx scripts/agent-response/open-fix-pr.ts --incident incident.json \
//     --patch agent.patch --diagnosis agent-output.txt --jira SMK-123

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { describeViolations, validatePatch } from '@/lib/incident/patch-safety'
import { assertPublishable, parseDiagnosis } from '@/lib/incident/diagnosis'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

function sh(cmd: string, cmdArgs: string[]): string {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function main(): void {
  const incident = JSON.parse(readFileSync(flag('incident') ?? 'incident.json', 'utf8'))
  const jiraKey = flag('jira')
  const patchPath = flag('patch') ?? 'agent.patch'

  if (!jiraKey) throw new Error('--jira is required: a PR without an SMK key breaks the commit convention')
  if (!existsSync(patchPath)) throw new Error(`no patch at ${patchPath}`)

  const patch = readFileSync(patchPath, 'utf8')
  const parsed = parseDiagnosis(readFileSync(flag('diagnosis') ?? 'agent-output.txt', 'utf8'))
  if (!parsed.ok) throw new Error(`diagnosis did not match the contract: ${parsed.error}`)

  const report = validatePatch(patch)
  if (!report.ok) {
    // Refusing is a normal outcome, not a crash: the incident is still tracked
    // in Jira and the thread still gets a reply.
    throw new Error(`patch rejected by safety gate -- ${describeViolations(report)}`)
  }
  console.log(`patch ok: ${report.files.length} file(s), +${report.addedLines}/-${report.removedLines}`)

  const title = `fix(${jiraKey}): ${parsed.diagnosis.summary.replace(/\s+/g, ' ').slice(0, 90)}`
  const bodyText = [
    `Automated fix proposed by the incident response agent. **Draft — needs human review.**`,
    '',
    `**Jira:** ${jiraKey}`,
    `**Alert class:** ${incident.alert_class}`,
    `**Fingerprint:** \`${incident.fingerprint}\``,
    '',
    '## Diagnosis',
    parsed.diagnosis.summary,
    '',
    '## Reasoning',
    parsed.diagnosis.reasoning,
    parsed.diagnosis.suggested_fix ? `\n## Approach\n${parsed.diagnosis.suggested_fix}` : '',
    '',
    `Patch touched ${report.files.length} file(s), +${report.addedLines}/-${report.removedLines}.`,
  ].join('\n')

  // Same gate as the Slack reply: the PR body is public on this repo.
  const safety = assertPublishable(`${title}\n${bodyText}`)
  if (!safety.safe) throw new Error(`output safety gate blocked the PR body (${safety.hits.join(', ')})`)

  const branch = `agent/${jiraKey.toLowerCase()}-${incident.fingerprint.slice(0, 8)}`

  sh('git', ['config', 'user.name', 'starting-monday-agent[bot]'])
  sh('git', ['config', 'user.email', 'starting-monday-agent[bot]@users.noreply.github.com'])
  sh('git', ['checkout', '-b', branch])
  sh('git', ['apply', '--whitespace=nowarn', patchPath])
  sh('git', ['add', '-A'])
  sh('git', ['commit', '-m', title])
  sh('git', ['push', '-u', 'origin', branch])

  const prUrl = sh('gh', [
    'pr', 'create',
    '--base', 'main',
    '--head', branch,
    '--title', title,
    '--body', bodyText,
    '--draft',
    '--label', 'agent-authored',
  ]).trim()

  const prNumber = prUrl.match(/\/pull\/(\d+)/)?.[1] ?? ''
  console.log(`opened draft PR ${prUrl}`)
  // Consumed by the workflow to link the PR into Slack and the incident row.
  if (process.env.GITHUB_OUTPUT) {
    execFileSync('bash', ['-c', `printf 'pr_url=%s\\npr_number=%s\\n' "${prUrl}" "${prNumber}" >> "$GITHUB_OUTPUT"`])
  }
}

try {
  main()
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
