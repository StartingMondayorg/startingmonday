#!/usr/bin/env node
/**
 * Promote production to a commit (SMK-465).
 *
 * The pipeline is: merge a PR into main, Railway deploys main to staging, you
 * look at staging, then run this to move production forward to the same commit.
 *
 * Production deploys from the `production` branch, which normally only moves by
 * fast-forward from main. There is no separate history and no cherry-picking, so
 * "what is in production" is always a prefix of "what is in main" — the two can
 * never disagree about what a commit contains.
 *
 * By default the target is main's HEAD. `--to <commit-ish>` promotes to a
 * specific commit instead, which covers two real cases:
 *
 *   - ship part of main (main has moved on, you only want up to a known-good
 *     commit), and
 *   - roll back (target is behind production). That direction rewrites the
 *     production branch, so it needs --rollback on top of --apply.
 *
 * The central safety rule: you can only promote a commit that STAGING HAS
 * ACTUALLY RUN. This reads Railway's staging deployment history and requires a
 * deployment of that exact commit that came up (SUCCESS or REMOVED, never
 * FAILED). That is what makes staging a gate
 * rather than decoration — without it, promoting is just pushing to production
 * with extra steps. A rollback is exempt, because its target already ran in
 * production; see the migration warning it prints instead.
 *
 * Dry run by default. Nothing moves without --apply.
 *
 * Usage:
 *   node scripts/promote-to-production.mjs                            # dry run, main HEAD
 *   node scripts/promote-to-production.mjs --apply
 *   node scripts/promote-to-production.mjs --to 63b5144c              # dry run, specific commit
 *   node scripts/promote-to-production.mjs --to 63b5144c --apply
 *   node scripts/promote-to-production.mjs --to 63b5144c --rollback --apply
 *
 * Flags:
 *   --to <commit-ish>      Target commit. Must be an ancestor of origin/main.
 *   --apply                Actually push. Without it, nothing moves.
 *   --rollback             Required to move production backwards (rewrites the branch).
 *   --skip-staging-check   Promote a commit staging has not verified. Prints loudly.
 *   --history-limit <n>    How many staging deployments to search (default 100, max 1000).
 */

import { execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)

function flagValue(name) {
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  const i = argv.indexOf(`--${name}`)
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  return null
}
const hasFlag = (name) => argv.includes(`--${name}`) || argv.some((a) => a.startsWith(`--${name}=`))

const APPLY = hasFlag('apply')
const ROLLBACK = hasFlag('rollback')
const SKIP_STAGING = hasFlag('skip-staging-check')
const TO = flagValue('to')
const HISTORY_LIMIT = Number(flagValue('history-limit') ?? 100)

const SOURCE = 'main'
const TARGET = 'production'
const STAGING_URL = process.env.PROMOTE_STAGING_URL ?? 'https://startingmonday-staging-staging.up.railway.app'
const RAILWAY_PROJECT = process.env.PROMOTE_RAILWAY_PROJECT ?? '82281226-8e3c-4e88-9793-a12811d70472'
const RAILWAY_STAGING_SERVICE = process.env.PROMOTE_RAILWAY_SERVICE ?? 'startingmonday-staging'
const RAILWAY_STAGING_ENV = process.env.PROMOTE_RAILWAY_ENV ?? 'staging'

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const short = (sha) => sha.slice(0, 7)

function isAncestor(maybeAncestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', maybeAncestor, descendant], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function die(...lines) {
  for (const l of lines) console.error(l)
  process.exit(1)
}

if (!Number.isInteger(HISTORY_LIMIT) || HISTORY_LIMIT < 1 || HISTORY_LIMIT > 1000) {
  die(`--history-limit must be an integer between 1 and 1000 (got ${flagValue('history-limit')}).`)
}

// ── resolve what we are promoting to ────────────────────────────────────────
try {
  git('fetch', 'origin', SOURCE, TARGET, '--quiet')
} catch {
  die(`Could not fetch. Does origin/${TARGET} exist?`)
}

const head = git('rev-parse', `origin/${SOURCE}`)
const current = git('rev-parse', `origin/${TARGET}`)

let target = head
if (TO) {
  try {
    target = git('rev-parse', '--verify', `${TO}^{commit}`)
  } catch {
    // The commit may be on main but not yet in this clone.
    try {
      git('fetch', 'origin', TO, '--quiet')
      target = git('rev-parse', '--verify', `${TO}^{commit}`)
    } catch {
      die(`Not a commit this repo knows about: ${TO}`, 'Try `git fetch origin` first.')
    }
  }
}

console.log(`promote  ${TARGET} -> ${short(target)}${TO ? '' : ` (${SOURCE} HEAD)`}`)
console.log(APPLY ? 'mode     APPLY\n' : 'mode     dry run — pass --apply to promote\n')

// Production may only ever run code that is on main. This is the invariant that
// keeps "what is in production" a prefix of "what is in main"; without it, this
// script would be a way to ship an unmerged branch straight to users.
if (!isAncestor(target, head)) {
  die(
    `Refusing: ${short(target)} is not an ancestor of ${SOURCE} (${short(head)}).`,
    'Only commits already merged to main can be promoted. If this is a branch commit,',
    'merge it to main first and let staging deploy it.',
  )
}

if (target === current) {
  console.log(`Nothing to promote. ${TARGET} is already at ${short(target)}.`)
  process.exit(0)
}

// ── direction ───────────────────────────────────────────────────────────────
const forward = isAncestor(current, target)
const backward = isAncestor(target, current)

if (!forward && !backward) {
  die(
    `Refusing: ${TARGET} (${short(current)}) and ${short(target)} have diverged.`,
    'Something was committed directly to production. Resolve that by hand;',
    'this script will not force past it.',
  )
}

if (backward && !ROLLBACK) {
  die(
    `Refusing: ${short(target)} is BEHIND ${TARGET} (${short(current)}).`,
    '',
    'That is a rollback: it rewrites the production branch and un-ships every',
    'commit in between. If that is what you mean, pass --rollback.',
  )
}
if (forward && ROLLBACK) {
  die(`--rollback was passed but ${short(target)} is ahead of ${TARGET}. Drop the flag.`)
}

const range = forward ? `${current}..${target}` : `${target}..${current}`
const commits = git('log', '--oneline', '--no-merges', range).split('\n').filter(Boolean)

console.log(`${TARGET} is at   ${short(current)}`)
console.log(`${SOURCE} is at         ${short(head)}`)
console.log(`target is        ${short(target)}${target === head ? '' : `  (${git('log', '-1', '--format=%s', target).slice(0, 60)})`}`)
console.log(`\n${commits.length} commit(s) would ${forward ? 'ship' : 'be UN-shipped'}:\n`)
for (const c of commits.slice(0, 25)) console.log(`  ${c}`)
if (commits.length > 25) console.log(`  … and ${commits.length - 25} more`)

// ── the gate ────────────────────────────────────────────────────────────────
console.log('')

if (backward) {
  // A rollback target already ran in production, so the staging gate adds
  // nothing. The real hazard is the database: migrations applied since the
  // target commit are still applied, and the old code has to tolerate them.
  const applied = git('diff', '--diff-filter=A', '--name-only', target, current, '--', 'supabase/migrations')
    .split('\n')
    .filter(Boolean)

  console.log('rollback — staging gate skipped (this commit already ran in production)')
  if (applied.length) {
    console.log('')
    console.log(`!! ${applied.length} migration(s) landed after ${short(target)} and are ALREADY APPLIED`)
    console.log('   to the production database. Rolling the code back does not roll them back.')
    console.log('   Confirm the old code tolerates the current schema before applying:')
    for (const f of applied.slice(0, 15)) console.log(`     ${f.replace('supabase/migrations/', '')}`)
    if (applied.length > 15) console.log(`     … and ${applied.length - 15} more`)
  } else {
    console.log('no migrations landed in this range — schema is unchanged since the target')
  }
} else if (SKIP_STAGING) {
  console.log('!! staging check SKIPPED — promoting a commit staging has not verified')
} else {
  // Ask Railway what staging actually built and ran, rather than what it happens
  // to be serving this second. The live health endpoint can only ever confirm
  // main's HEAD; deployment history can confirm any commit.
  let deployments
  try {
    const raw = execFileSync(
      'railway',
      [
        'deployment', 'list',
        '--service', RAILWAY_STAGING_SERVICE,
        '--environment', RAILWAY_STAGING_ENV,
        '--project', RAILWAY_PROJECT,
        '--limit', String(HISTORY_LIMIT),
        '--json',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    deployments = JSON.parse(raw)
  } catch (e) {
    die(
      `Could not read staging deployment history: ${String(e.stderr ?? e.message).trim().split('\n')[0]}`,
      '',
      'The Railway CLI must be installed and logged in (`railway login`).',
      'Staging must be verifiable to promote. Override with --skip-staging-check.',
    )
  }

  if (!Array.isArray(deployments)) {
    die('Railway returned deployment history in an unexpected shape. Cannot verify staging.')
  }

  // Railway status semantics, confirmed against this project's own history:
  //   SUCCESS  only ever the currently-active deployment
  //   REMOVED  built, ran, and was later superseded by a newer deploy
  //   FAILED   never came up — and it STAYS failed; it does not decay to REMOVED
  // So "staging ran this" means SUCCESS or REMOVED. Checking for SUCCESS alone
  // would pass only main's HEAD and reject every older commit, which is exactly
  // the case --to exists for.
  const RAN = new Set(['SUCCESS', 'REMOVED'])
  const IN_FLIGHT = new Set(['BUILDING', 'DEPLOYING', 'INITIALIZING', 'QUEUED', 'WAITING'])

  // A commit can be deployed more than once (redeploys, restarts).
  const records = deployments.filter((d) => d?.meta?.commitHash === target)

  if (!records.length) {
    die(
      `staging has no deployment of ${short(target)} in its last ${HISTORY_LIMIT} deployments.`,
      '',
      'Either staging has not built this commit yet, or the commit is older than',
      'the search window. Promoting now would ship something staging never ran.',
      'Raise the window with --history-limit <n> (max 1000), or override with --skip-staging-check.',
    )
  }

  const ran = records.filter((d) => RAN.has(d.status))
  const inFlight = records.filter((d) => IN_FLIGHT.has(d.status))
  const failed = records.filter((d) => !RAN.has(d.status) && !IN_FLIGHT.has(d.status))

  if (!ran.length && inFlight.length) {
    die(
      `staging is still deploying ${short(target)} (${inFlight[0].status}).`,
      'Wait for it to finish, then promote.',
    )
  }
  if (!ran.length) {
    die(
      `staging never got ${short(target)} running — ${failed.length} attempt(s), latest ${failed[0].status}.`,
      '',
      'This commit did not build or start on staging. Fix it before promoting.',
    )
  }

  const proof = ran[0]
  console.log(`staging verified: ${proof.status} deployment of ${short(target)} at ${proof.createdAt}`)
  if (failed.length) {
    console.log(`   (note: ${failed.length} other attempt(s) at this commit failed — it did run, but check why)`)
  }

  // Informational only — a mismatch is normal when promoting a non-HEAD commit.
  try {
    const res = await fetch(`${STAGING_URL}/api/health`, { signal: AbortSignal.timeout(20_000) })
    const serving = (await res.json())?.commit ?? null
    if (serving && serving !== target) {
      console.log(`staging is currently serving ${short(serving)} (not the promotion target — fine, just so you know)`)
    }
  } catch {
    console.log('staging health endpoint unreachable — not blocking, the deployment record is the gate')
  }
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply${backward ? ' --rollback' : ''} to promote.`)
  process.exit(0)
}

// ── push ────────────────────────────────────────────────────────────────────
// Forward moves are plain fast-forwards. A rollback needs --force-with-lease,
// pinned to the exact SHA we read above, so a concurrent promotion by someone
// else aborts this push instead of being silently erased.
const pushArgs = ['push']
if (backward) pushArgs.push(`--force-with-lease=refs/heads/${TARGET}:${current}`)
pushArgs.push('origin', `${target}:refs/heads/${TARGET}`)

try {
  execFileSync('git', pushArgs, { stdio: 'pipe' })
} catch (e) {
  die(`\nPush failed:\n${String(e.stderr ?? e.message).trim().split('\n').slice(0, 5).join('\n')}`)
}

console.log(`\n${TARGET} moved ${short(current)} -> ${short(target)}`)
console.log('Railway will deploy it. Watch with:')
console.log('  railway logs --service startingmonday --environment production')
