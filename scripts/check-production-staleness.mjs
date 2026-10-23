#!/usr/bin/env node
// Production staleness check (P1-6 / D1 in docs/evidence/production-promotion-2026-10-21.md).
//
// Compares the SHA production serves with origin/main and reports how far behind
// production is. Production is "stale" when the oldest runtime-affecting commit on
// main that production does not yet serve landed more than STALENESS_THRESHOLD_DAYS
// (default 7) ago. Commits that touch only docs/** or tests/** are not
// runtime-affecting and are ignored for the threshold (they still count as behind).
//
// Env:
//   PRODUCTION_BASE_URL        default https://startingmonday.app
//   PRODUCTION_SHA             optional override; otherwise read from /api/deploy-marker (fallback /api/health)
//   MAIN_REF                   default origin/main (requires a full-history checkout)
//   STALENESS_THRESHOLD_DAYS   default 7
//
// Exit codes: 0 when a result was computed (stale or not; see GITHUB_OUTPUT `stale`),
// 1 when production's SHA could not be resolved or is not in this repository.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export const NON_RUNTIME_PREFIXES = ['docs/', 'tests/']
const DAY_MS = 24 * 60 * 60 * 1000

export function isRuntimeAffecting(files) {
  // A commit with no listed files (e.g. an empty merge) changes nothing at runtime.
  return files.some((file) => !NON_RUNTIME_PREFIXES.some((prefix) => file.startsWith(prefix)))
}

// Parses `git log --format=%x1e%H%x1f%cI%x1f%s --name-only`.
export function parseGitLog(text) {
  return String(text ?? '')
    .split('\x1e')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [header, ...rest] = chunk.split(/\r?\n/)
      const [sha, committedAt, subject = ''] = header.split('\x1f')
      const files = rest.map((line) => line.trim()).filter(Boolean)
      return { sha, committedAt, subject, files }
    })
}

export function computeStaleness({ commits, commitsBehind = commits.length, now = Date.now(), thresholdDays = 7 }) {
  const byAge = [...commits].sort((a, b) => Date.parse(a.committedAt) - Date.parse(b.committedAt))
  const runtime = byAge.filter((commit) => isRuntimeAffecting(commit.files))
  const ageDays = (commit) => (commit ? Math.floor(((now - Date.parse(commit.committedAt)) / DAY_MS) * 10) / 10 : 0)
  const summarize = (commit) => (commit ? { sha: commit.sha, committedAt: commit.committedAt, subject: commit.subject, ageDays: ageDays(commit) } : null)

  const oldestRuntime = runtime[0] ?? null
  const oldestRuntimeAgeDays = ageDays(oldestRuntime)
  const stale = oldestRuntime !== null && oldestRuntimeAgeDays > thresholdDays
  const behind = commitsBehind > 0

  return {
    status: stale ? 'stale' : behind ? 'behind' : 'current',
    stale,
    behind,
    thresholdDays,
    commitsBehind,
    runtimeCommitsBehind: runtime.length,
    oldestUnpromoted: summarize(byAge[0]),
    oldestRuntimeUnpromoted: summarize(oldestRuntime),
    oldestRuntimeAgeDays,
  }
}

export function describeStaleness(result, productionSha, mainRef) {
  const prod = productionSha.slice(0, 12)
  if (result.status === 'current') return `Production (${prod}) is current with ${mainRef}.`
  const oldest = result.oldestRuntimeUnpromoted
  const runtimePart = oldest
    ? `oldest unpromoted runtime commit ${oldest.sha.slice(0, 12)} is ${oldest.ageDays}d old (threshold ${result.thresholdDays}d)`
    : 'no runtime-affecting commits pending (docs/tests only)'
  const lead = result.stale ? `Production is STALE (${prod}):` : `Production (${prod}) is`
  return `${lead} ${result.commitsBehind} commit(s) behind ${mainRef} (${result.runtimeCommitsBehind} runtime-affecting); ${runtimePart}.`
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return response.json()
}

async function resolveProductionSha(baseUrl) {
  if (process.env.PRODUCTION_SHA) return { sha: process.env.PRODUCTION_SHA.trim().toLowerCase(), source: 'PRODUCTION_SHA' }
  const errors = []
  try {
    const marker = await fetchJson(`${baseUrl}/api/deploy-marker`)
    const sha = String(marker?.deploy_sha ?? '').trim().toLowerCase()
    if (marker?.kind === 'deploy-marker' && /^[0-9a-f]{7,40}$/.test(sha)) return { sha, source: '/api/deploy-marker' }
    errors.push(`/api/deploy-marker deploy_sha=${sha || 'missing'}`)
  } catch (error) {
    errors.push(`/api/deploy-marker ${error instanceof Error ? error.message : error}`)
  }
  try {
    const health = await fetchJson(`${baseUrl}/api/health`)
    const sha = String(health?.commit ?? '').trim().toLowerCase()
    if (/^[0-9a-f]{7,40}$/.test(sha)) return { sha, source: '/api/health' }
    errors.push(`/api/health commit=${sha || 'missing'}`)
  } catch (error) {
    errors.push(`/api/health ${error instanceof Error ? error.message : error}`)
  }
  throw new Error(`could not read production SHA: ${errors.join('; ')}`)
}

function writeGithubOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, ' ')}`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
}

function writeStepSummary(result, productionSha, mainRef, source) {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  const oldest = result.oldestRuntimeUnpromoted
  const rows = [
    ['Status', result.status],
    ['Production SHA', `${productionSha} (${source})`],
    ['Compared with', mainRef],
    ['Commits behind', String(result.commitsBehind)],
    ['Runtime-affecting commits behind', String(result.runtimeCommitsBehind)],
    ['Oldest unpromoted runtime commit', oldest ? `${oldest.sha.slice(0, 12)} ${oldest.committedAt} (${oldest.ageDays}d) ${oldest.subject}` : '(none)'],
    ['Threshold', `${result.thresholdDays} days`],
  ]
  let summary = '## Production staleness\n\n| Metric | Value |\n|---|---|\n'
  for (const [key, value] of rows) summary += `| ${key} | ${value.replace(/\|/g, '\\|')} |\n`
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}

async function main() {
  const baseUrl = (process.env.PRODUCTION_BASE_URL ?? 'https://startingmonday.app').replace(/\/$/, '')
  const mainRef = process.env.MAIN_REF ?? 'origin/main'
  const thresholdDays = Number.parseFloat(process.env.STALENESS_THRESHOLD_DAYS ?? '7')
  const annotate = process.env.GITHUB_ACTIONS === 'true'

  let productionSha
  let source
  try {
    ;({ sha: productionSha, source } = await resolveProductionSha(baseUrl))
    productionSha = git(['rev-parse', '--verify', `${productionSha}^{commit}`]).trim()
  } catch (error) {
    const message = `Production staleness unknown: ${error instanceof Error ? error.message.split('\n')[0] : error}`
    console.error(annotate ? `::error title=Production staleness unknown::${message}` : message)
    writeGithubOutputs({ status: 'unknown', stale: 'false', message })
    process.exitCode = 1
    return
  }

  const range = `${productionSha}..${mainRef}`
  const commitsBehind = Number.parseInt(git(['rev-list', '--count', range]).trim(), 10)
  // --first-parent dates each change by when it landed on main, not when its branch was authored.
  const log = git(['log', '--first-parent', '--diff-merges=first-parent', '--name-only', '--format=%x1e%H%x1f%cI%x1f%s', range])
  const result = computeStaleness({ commits: parseGitLog(log), commitsBehind, thresholdDays })
  const message = describeStaleness(result, productionSha, mainRef)

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ productionSha, source, mainRef, ...result, message }, null, 2))
  } else {
    console.log(message)
  }

  if (annotate && result.stale) console.log(`::error title=Production is stale::${message}`)
  else if (annotate && result.behind) console.log(`::warning title=Production behind main::${message}`)

  writeGithubOutputs({
    status: result.status,
    stale: result.stale ? 'true' : 'false',
    production_sha: productionSha,
    commits_behind: result.commitsBehind,
    runtime_commits_behind: result.runtimeCommitsBehind,
    oldest_runtime_sha: result.oldestRuntimeUnpromoted?.sha ?? '',
    oldest_runtime_age_days: result.oldestRuntimeAgeDays,
    threshold_days: result.thresholdDays,
    message,
  })
  writeStepSummary(result, productionSha, mainRef, source)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
