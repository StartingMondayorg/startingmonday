#!/usr/bin/env node
import { pathToFileURL } from 'node:url'

const BASE_URL = process.env.RELEASE_MONITOR_BASE_URL ?? 'https://startingmonday.app'
const EXPECTED_SHA = (process.env.RELEASE_EXPECTED_SHA ?? '').trim().toLowerCase()
const EXPECTED_HERO_PRIMARY = process.env.RELEASE_EXPECTED_HERO_PRIMARY ?? ''
const EXPECTED_HERO_SECONDARY = process.env.RELEASE_EXPECTED_HERO_SECONDARY ?? ''
// Railway builds have taken ~26 minutes (docs/evidence/production-promotion-2026-10-21.md, D2),
// so the default wait covers 45 minutes.
const TIMEOUT_SECONDS = Number.parseInt(process.env.RELEASE_TIMEOUT_SECONDS ?? '2700', 10)
const INTERVAL_SECONDS = Number.parseInt(process.env.RELEASE_INTERVAL_SECONDS ?? '20', 10)
// Once the expected SHA is live, homepage/hero checks get this long to pass before failing
// early, so a deployed-but-broken release does not hold the gate for the full timeout.
const POST_DEPLOY_GRACE_SECONDS = Number.parseInt(process.env.RELEASE_POST_DEPLOY_GRACE_SECONDS ?? '300', 10)
const OUTPUT_JSON = process.env.RELEASE_OUTPUT_JSON === '1' || process.argv.includes('--json')

const REQUEST_TIMEOUT_MS = 15000

function trimSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function normalizeSha(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isShaMatch(expected, actual) {
  if (!expected || !actual) return false
  return expected === actual || expected.startsWith(actual) || actual.startsWith(expected)
}

async function fetchWithTimeout(pathname) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${trimSlash(BASE_URL)}${pathname}`, { signal: controller.signal })
    const body = await res.text()
    return { ok: res.ok, status: res.status, body }
  } finally {
    clearTimeout(timeout)
  }
}

function parseDeployMarker(rawBody) {
  try {
    const parsed = JSON.parse(rawBody)
    return {
      ok: parsed?.kind === 'deploy-marker',
      deploySha: normalizeSha(parsed?.deploy_sha),
      release: String(parsed?.release ?? ''),
    }
  } catch {
    return { ok: false, deploySha: '', release: '' }
  }
}

function heroCheck(html) {
  const checks = []

  if (EXPECTED_HERO_PRIMARY) {
    checks.push({
      key: 'hero_primary',
      expected: EXPECTED_HERO_PRIMARY,
      matched: html.includes(EXPECTED_HERO_PRIMARY),
    })
  }

  if (EXPECTED_HERO_SECONDARY) {
    checks.push({
      key: 'hero_secondary',
      expected: EXPECTED_HERO_SECONDARY,
      matched: html.includes(EXPECTED_HERO_SECONDARY),
    })
  }

  return checks
}

async function evaluate() {
  const startedAt = Date.now()
  const deadline = startedAt + TIMEOUT_SECONDS * 1000
  const attempts = []
  let firstShaMatchAt = null

  logProgress(`waiting up to ${TIMEOUT_SECONDS}s for ${trimSlash(BASE_URL)} to serve ${EXPECTED_SHA.slice(0, 12)} (poll every ${INTERVAL_SECONDS}s)`)

  while (Date.now() <= deadline) {
    const now = new Date().toISOString()
    const attempt = {
      at: now,
      marker: { ok: false, status: 0, deploySha: '', release: '', reason: '' },
      homepage: { ok: false, status: 0, heroChecks: [], reason: '' },
    }

    try {
      const markerRes = await fetchWithTimeout('/api/deploy-marker')
      attempt.marker.status = markerRes.status

      if (!markerRes.ok) {
        attempt.marker.reason = `HTTP ${markerRes.status}`
      } else {
        const marker = parseDeployMarker(markerRes.body)
        attempt.marker.ok = marker.ok
        attempt.marker.deploySha = marker.deploySha
        attempt.marker.release = marker.release
        if (!marker.ok) {
          attempt.marker.reason = 'Unexpected deploy marker payload'
        }
      }
    } catch (error) {
      attempt.marker.reason = error instanceof Error ? error.message : 'deploy marker request failed'
    }

    try {
      const homeRes = await fetchWithTimeout('/')
      attempt.homepage.status = homeRes.status

      if (!homeRes.ok) {
        attempt.homepage.reason = `HTTP ${homeRes.status}`
      } else {
        attempt.homepage.ok = true
        attempt.homepage.heroChecks = heroCheck(homeRes.body)
      }
    } catch (error) {
      attempt.homepage.reason = error instanceof Error ? error.message : 'homepage request failed'
    }

    attempts.push(attempt)

    const shaMatches = isShaMatch(EXPECTED_SHA, attempt.marker.deploySha)
    const heroChecks = attempt.homepage.heroChecks
    const heroMatches = heroChecks.every((item) => item.matched)
    const heroChecksPresent = heroChecks.length > 0 ? heroMatches : true
    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000)
    const remainingSeconds = Math.max(0, Math.round((deadline - Date.now()) / 1000))

    if (attempt.marker.ok && shaMatches && attempt.homepage.ok && heroChecksPresent) {
      logProgress(`attempt ${attempts.length} (+${elapsedSeconds}s): ${describeAttempt(attempt, EXPECTED_SHA)} -> PASS`)
      return finalize({ ok: true, startedAt, attempts })
    }

    if (attempt.marker.ok && shaMatches && firstShaMatchAt === null) {
      firstShaMatchAt = Date.now()
    }
    const graceExpired = firstShaMatchAt !== null
      && shaMatches
      && Date.now() - firstShaMatchAt >= POST_DEPLOY_GRACE_SECONDS * 1000

    const outOfTime = Date.now() + INTERVAL_SECONDS * 1000 > deadline
    let next = ' -> waiting'
    if (graceExpired) next = ' -> deployed but checks still failing after grace period; stopping'
    else if (outOfTime) next = ' -> timeout reached; stopping'

    logProgress(
      `attempt ${attempts.length} (+${elapsedSeconds}s, ${remainingSeconds}s left): ${describeAttempt(attempt, EXPECTED_SHA)}${next}`,
    )

    if (graceExpired || outOfTime) {
      break
    }

    // Wait for deployment propagation before checking again.
    await sleep(INTERVAL_SECONDS * 1000)
  }

  return finalize({ ok: false, startedAt, attempts })
}

function finalize({ ok, startedAt, attempts }) {
  const result = {
    ok,
    baseUrl: BASE_URL,
    expectedSha: EXPECTED_SHA,
    timeoutSeconds: TIMEOUT_SECONDS,
    intervalSeconds: INTERVAL_SECONDS,
    attempts,
    resolvedAt: new Date().toISOString(),
    elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
  }
  const { outcome, message } = classifyReleaseOutcome(result)
  return { ...result, outcome, message }
}

function logProgress(line) {
  // stderr keeps --json stdout parseable when the workflow tees it to a file.
  console.error(`[release-parity] ${line}`)
}

export function describeAttempt(attempt, expectedSha) {
  const marker = attempt.marker.ok
    ? `marker=${attempt.marker.deploySha ? attempt.marker.deploySha.slice(0, 12) : '(missing)'}`
      + (isShaMatch(expectedSha, attempt.marker.deploySha) ? ' (expected)' : ' (old)')
    : `marker=unavailable${attempt.marker.reason ? ` (${attempt.marker.reason})` : ''}`
  const checks = attempt.homepage.heroChecks ?? []
  const homepage = attempt.homepage.ok
    ? `homepage=${attempt.homepage.status}` + (checks.length ? ` hero=${checks.filter((item) => item.matched).length}/${checks.length}` : '')
    : `homepage=unavailable${attempt.homepage.reason ? ` (${attempt.homepage.reason})` : ''}`
  return `${marker} ${homepage}`
}

// Distinguishes "Railway has not finished deploying" from "deployed but checks failed"
// so a timeout is not misread as a broken release (or vice versa).
export function classifyReleaseOutcome(result) {
  const expected = normalizeSha(result.expectedSha)
  const attempts = result.attempts ?? []
  const last = attempts[attempts.length - 1]
  const baseUrl = result.baseUrl
  const elapsed = `${result.elapsedSeconds ?? 0}s`

  if (result.ok) {
    return { outcome: 'pass', message: `Release ${expected.slice(0, 12)} is live on ${baseUrl} and checks passed after ${elapsed}.` }
  }

  if (!last) {
    return { outcome: 'unknown', message: `Release status unknown: no attempts were made against ${baseUrl}.` }
  }

  const served = normalizeSha(last.marker.deploySha)
  const servedKnown = last.marker.ok && served && served !== 'unknown'

  if (servedKnown && isShaMatch(expected, served)) {
    const failures = []
    if (!last.homepage.ok) failures.push(`homepage ${last.homepage.reason || 'unavailable'}`)
    const missingHero = (last.homepage.heroChecks ?? []).filter((item) => !item.matched).map((item) => item.expected)
    if (missingHero.length) failures.push(`missing hero text: ${missingHero.join(' | ')}`)
    return {
      outcome: 'checks_failed',
      message: `Deployed but checks failed: ${baseUrl} serves ${served.slice(0, 12)} (expected) but ${failures.join('; ') || 'checks did not pass'} after ${elapsed}.`,
    }
  }

  const everMatched = attempts.some((attempt) => attempt.marker.ok && isShaMatch(expected, attempt.marker.deploySha))

  if (servedKnown) {
    return {
      outcome: 'pending',
      message: `Deployment still pending: ${baseUrl} still serving ${served.slice(0, 12)}, not ${expected.slice(0, 12)}, after ${elapsed}`
        + (everMatched ? ' (the expected SHA was served earlier, so production may have rolled back).' : '. Check the Railway build before re-running this gate.'),
    }
  }

  return {
    outcome: 'unknown',
    message: `Deployment status unknown: ${baseUrl}/api/deploy-marker did not report a SHA (${last.marker.reason || `deploy_sha=${served || 'missing'}`}) after ${elapsed}.`,
  }
}

function renderTextSummary(result) {
  const last = result.attempts[result.attempts.length - 1]
  const heroFailures = (last?.homepage.heroChecks ?? [])
    .filter((item) => !item.matched)
    .map((item) => item.expected)

  console.log(`Release parity: ${result.ok ? 'PASS' : 'FAIL'} after ${result.elapsedSeconds}s (${result.attempts.length} attempts)`)
  console.log(`Outcome: ${result.outcome}`)
  console.log(`Base URL: ${result.baseUrl}`)
  console.log(`Expected SHA: ${result.expectedSha || '(not set)'}`)

  if (last) {
    console.log(`Last deploy marker SHA: ${last.marker.deploySha || '(missing)'}`)
    if (last.marker.reason) {
      console.log(`Last deploy marker issue: ${last.marker.reason}`)
    }
    if (last.homepage.reason) {
      console.log(`Last homepage issue: ${last.homepage.reason}`)
    }
  }

  if (heroFailures.length > 0) {
    console.log(`Missing hero assertions: ${heroFailures.join(' | ')}`)
  }
}

async function main() {
  if (!EXPECTED_SHA) {
    console.error('RELEASE_EXPECTED_SHA is required')
    process.exitCode = 1
    return
  }

  const result = await evaluate()

  if (OUTPUT_JSON) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    renderTextSummary(result)
  }

  if (!result.ok) {
    const prefix = process.env.GITHUB_ACTIONS === 'true' ? `::error title=Release parity (${result.outcome})::` : ''
    console.error(`${prefix}${result.message}`)
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'release parity check failed')
    process.exitCode = 1
  })
}