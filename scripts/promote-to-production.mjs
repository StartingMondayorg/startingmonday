#!/usr/bin/env node
/**
 * Promote main to production (SMK-465).
 *
 * The pipeline is: merge a PR into main, Railway deploys main to staging, you
 * look at staging, then run this to move production forward to the same commit.
 *
 * Production deploys from the `production` branch, which only ever moves by
 * fast-forward from main. There is no separate history and no cherry-picking, so
 * "what is in production" is always a prefix of "what is in main" — the two can
 * never disagree about what a commit contains.
 *
 * The central safety rule: you can only promote a commit that STAGING HAS
 * ACTUALLY RUN. The script reads the deployed commit from staging's health
 * endpoint and refuses to promote anything else. That is what makes staging a
 * gate rather than decoration — without this check, promoting is just pushing to
 * production with extra steps.
 *
 * Dry run by default. Nothing moves without --apply.
 *
 * Usage:
 *   node scripts/promote-to-production.mjs
 *   node scripts/promote-to-production.mjs --apply
 *   node scripts/promote-to-production.mjs --apply --skip-staging-check   # see below
 */

import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
/**
 * Escape hatch for the case where staging is down for reasons unrelated to the
 * code — a failed build, a Railway incident — and you need to ship anyway. It
 * prints loudly because using it means promoting something staging never ran.
 */
const SKIP_STAGING = args.includes('--skip-staging-check')

const SOURCE = 'main'
const TARGET = 'production'
const STAGING_URL = 'https://startingmonday-staging-staging.up.railway.app'

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim()

function short(sha) { return sha.slice(0, 7) }

console.log(`promote  ${SOURCE} -> ${TARGET}`)
console.log(APPLY ? 'mode     APPLY\n' : 'mode     dry run — pass --apply to promote\n')

try {
  git('fetch', 'origin', SOURCE, TARGET, '--quiet')
} catch {
  console.error(`Could not fetch. Does origin/${TARGET} exist?`)
  process.exit(1)
}

const head = git('rev-parse', `origin/${SOURCE}`)
const current = git('rev-parse', `origin/${TARGET}`)

if (head === current) {
  console.log(`Nothing to promote. ${TARGET} is already at ${short(head)}.`)
  process.exit(0)
}

// Fast-forward only. If production has commits main does not, someone has
// committed directly to production and the histories have diverged — that needs
// a human, not a flag.
const isAncestor = (() => {
  try { execFileSync('git', ['merge-base', '--is-ancestor', current, head], { stdio: 'ignore' }); return true }
  catch { return false }
})()

if (!isAncestor) {
  console.error(`Refusing: ${TARGET} (${short(current)}) is not an ancestor of ${SOURCE} (${short(head)}).`)
  console.error('The branches have diverged — something was committed directly to production.')
  console.error('Resolve that by hand; this script will not force anything.')
  process.exit(1)
}

const commits = git('log', '--oneline', '--no-merges', `${current}..${head}`).split('\n').filter(Boolean)
console.log(`${TARGET} is at   ${short(current)}`)
console.log(`${SOURCE} is at         ${short(head)}`)
console.log(`\n${commits.length} commit(s) would ship:\n`)
for (const c of commits.slice(0, 25)) console.log(`  ${c}`)
if (commits.length > 25) console.log(`  … and ${commits.length - 25} more`)

// ── the gate ────────────────────────────────────────────────────────────────
console.log('')
if (SKIP_STAGING) {
  console.log('!! staging check SKIPPED — promoting a commit staging has not verified')
} else {
  let deployed = null
  try {
    const res = await fetch(`${STAGING_URL}/api/health`, { signal: AbortSignal.timeout(20_000) })
    const body = await res.json()
    deployed = body?.commit ?? null
  } catch (e) {
    console.error(`Could not read staging health: ${e.message}`)
    console.error(`Staging must be reachable to promote. Override with --skip-staging-check.`)
    process.exit(1)
  }

  if (!deployed) {
    console.error('staging health returned no commit field. Cannot verify what it is running.')
    process.exit(1)
  }
  if (deployed !== head) {
    console.error(`staging is running ${short(deployed)}, but ${SOURCE} is at ${short(head)}.`)
    console.error('')
    console.error('Staging has not deployed this commit yet, or its build failed. Promoting now')
    console.error('would ship something staging never ran. Wait for staging to catch up.')
    process.exit(1)
  }
  console.log(`staging verified: running ${short(deployed)} — matches ${SOURCE}`)
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to promote.`)
  process.exit(0)
}

// Push main's SHA straight onto the remote production branch. No local checkout,
// no merge commit; without --force this fails rather than rewriting history.
try {
  execFileSync('git', ['push', 'origin', `${head}:refs/heads/${TARGET}`], { stdio: 'pipe' })
} catch (e) {
  console.error(`\nPush failed:\n${String(e.stderr ?? e.message).trim().split('\n').slice(0, 5).join('\n')}`)
  process.exit(1)
}

console.log(`\n${TARGET} moved ${short(current)} -> ${short(head)}`)
console.log('Railway will deploy it. Watch with:')
console.log('  railway logs --service startingmonday --environment production')
