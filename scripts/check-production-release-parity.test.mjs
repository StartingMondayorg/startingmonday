import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyReleaseOutcome, describeAttempt, isShaMatch } from './check-production-release-parity.mjs'

const EXPECTED = 'ea2f80b9e1ae2ec114d6cc00d8b1f382adb68a78'
const OLD = '5eb737f9f719ab848cfe7970feaa3cc9d5d317bf'

function attempt({ sha = '', markerOk = true, markerReason = '', homeOk = true, homeReason = '', hero = [true, true] } = {}) {
  return {
    at: '2026-10-22T19:00:00Z',
    marker: { ok: markerOk, status: markerOk ? 200 : 0, deploySha: sha, release: 'r', reason: markerReason },
    homepage: {
      ok: homeOk,
      status: homeOk ? 200 : 0,
      heroChecks: hero.map((matched, index) => ({ key: `hero_${index}`, expected: `Hero ${index}`, matched })),
      reason: homeReason,
    },
  }
}

function result(attempts, ok = false) {
  return { ok, baseUrl: 'https://startingmonday.app', expectedSha: EXPECTED, attempts, elapsedSeconds: 2700 }
}

test('isShaMatch accepts short and full SHAs', () => {
  assert.equal(isShaMatch(EXPECTED, EXPECTED.slice(0, 7)), true)
  assert.equal(isShaMatch(EXPECTED, OLD), false)
  assert.equal(isShaMatch(EXPECTED, ''), false)
})

test('pass when the gate succeeded', () => {
  assert.equal(classifyReleaseOutcome(result([attempt({ sha: EXPECTED })], true)).outcome, 'pass')
})

test('pending when production still serves an older SHA', () => {
  const outcome = classifyReleaseOutcome(result([attempt({ sha: OLD }), attempt({ sha: OLD })]))
  assert.equal(outcome.outcome, 'pending')
  assert.match(outcome.message, /^Deployment still pending: https:\/\/startingmonday\.app still serving 5eb737f9f719, not ea2f80b9e1ae/)
  assert.doesNotMatch(outcome.message, /rolled back/)
})

test('pending notes a rollback when the expected SHA was served earlier', () => {
  const outcome = classifyReleaseOutcome(result([attempt({ sha: EXPECTED, hero: [false, true] }), attempt({ sha: OLD })]))
  assert.equal(outcome.outcome, 'pending')
  assert.match(outcome.message, /rolled back/)
})

test('checks_failed when the expected SHA is live but hero text is missing', () => {
  const outcome = classifyReleaseOutcome(result([attempt({ sha: OLD }), attempt({ sha: EXPECTED, hero: [true, false] })]))
  assert.equal(outcome.outcome, 'checks_failed')
  assert.match(outcome.message, /^Deployed but checks failed: .* serves ea2f80b9e1ae \(expected\) but missing hero text: Hero 1/)
})

test('checks_failed when the expected SHA is live but the homepage errors', () => {
  const outcome = classifyReleaseOutcome(result([attempt({ sha: EXPECTED, homeOk: false, homeReason: 'HTTP 502', hero: [] })]))
  assert.equal(outcome.outcome, 'checks_failed')
  assert.match(outcome.message, /homepage HTTP 502/)
})

test('unknown when the deploy marker never reports a SHA', () => {
  assert.equal(classifyReleaseOutcome(result([attempt({ markerOk: false, markerReason: 'HTTP 503' })])).outcome, 'unknown')
  assert.equal(classifyReleaseOutcome(result([attempt({ sha: 'unknown' })])).outcome, 'unknown')
  assert.equal(classifyReleaseOutcome(result([])).outcome, 'unknown')
})

test('describeAttempt summarises marker and hero progress', () => {
  assert.equal(describeAttempt(attempt({ sha: OLD, hero: [true, false] }), EXPECTED), 'marker=5eb737f9f719 (old) homepage=200 hero=1/2')
  assert.equal(describeAttempt(attempt({ sha: EXPECTED }), EXPECTED), 'marker=ea2f80b9e1ae (expected) homepage=200 hero=2/2')
  assert.equal(
    describeAttempt(attempt({ markerOk: false, markerReason: 'HTTP 503', homeOk: false, homeReason: 'aborted', hero: [] }), EXPECTED),
    'marker=unavailable (HTTP 503) homepage=unavailable (aborted)',
  )
})
