import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// These scripts are only ever executed by a workflow, so nothing else would
// notice if one stopped loading. That is exactly what happened: two of them
// used top-level await, which tsx rejects when transforming a .ts file in a
// CommonJS package, and the responder died on its first real run. The original
// smoke test happened to cover the one script without top-level await.
//
// So this executes each of them for real and asserts they reach their own
// argument or environment validation. A static check for `await` would pass a
// script that failed to load for some other reason.

const repoRoot = new URL('../../../', import.meta.url).pathname

function run(script: string, args: string[]) {
  return spawnSync('npx', ['tsx', `scripts/agent-response/${script}`, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    // Deliberately no Supabase or Slack credentials: we want each script to
    // reach its own validation, not to talk to anything.
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', SLACK_BOT_TOKEN: '' },
  })
}

function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'agent-scripts-'))
  const incident = join(dir, 'incident.json')
  writeFileSync(incident, JSON.stringify({
    fingerprint: 'f', alert_class: 'app-error-new', signal_key: 's',
    occurrence_count: 1, first_seen_at: '2026-01-01T00:00:00Z', status: 'open',
    slack_thread_ts: '1.2', slack_channel_id: 'C1', evidence: {},
  }))
  const diagnosis = join(dir, 'agent-output.txt')
  writeFileSync(diagnosis, JSON.stringify({
    verdict: 'not-code-fixable', summary: 's', reasoning: 'r', files: [],
  }))
  return dir
}

describe('agent-response scripts load and execute', () => {
  const dir = fixture()
  const incident = join(dir, 'incident.json')

  it.each([
    ['fetch-incident.ts', ['--fingerprint', 'test'], /SUPABASE_SERVICE_ROLE_KEY is required|are required/],
    ['build-incident-prompt.ts', ['--incident', incident], /diagnosing a production incident/],
    ['publish-diagnosis.ts', ['--incident', incident, '--diagnosis', join(dir, 'agent-output.txt'), '--dry-run'],
      /SLACK_BOT_TOKEN is required/],
  ])('%s runs and reaches its own validation', (script, args, expected) => {
    const result = run(script, args as string[])
    const output = `${result.stdout}${result.stderr}`

    // The specific regression: tsx refusing to transform top-level await.
    expect(output).not.toContain('Top-level await')
    expect(output).not.toContain('TransformError')
    expect(output).toMatch(expected as RegExp)
  }, 60_000)
})
