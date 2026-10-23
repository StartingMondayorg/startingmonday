import assert from 'node:assert/strict'
import test from 'node:test'

import {
  computeStaleness,
  describeStaleness,
  isRuntimeAffecting,
  parseGitLog,
} from './check-production-staleness.mjs'

const NOW = Date.parse('2026-10-22T12:00:00Z')
const daysAgo = (days) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString()

test('docs/** and tests/** only commits are not runtime-affecting', () => {
  assert.equal(isRuntimeAffecting(['docs/a.md', 'tests/e2e/x.spec.ts']), false)
  assert.equal(isRuntimeAffecting(['docs/a.md', 'src/app/page.tsx']), true)
  assert.equal(isRuntimeAffecting(['package.json']), true)
  assert.equal(isRuntimeAffecting([]), false)
  assert.equal(isRuntimeAffecting(['documentation.md']), true)
})

test('parseGitLog reads sha, committer date, subject and files', () => {
  const text = [
    '\x1eaaa111\x1f2026-10-22T14:45:30-07:00\x1ffix: one (#1)',
    '',
    'src/a.ts',
    'docs/b.md',
    '\x1ebbb222\x1f2026-10-21T10:00:00-07:00\x1fmerge',
    '',
  ].join('\n')
  assert.deepEqual(parseGitLog(text), [
    { sha: 'aaa111', committedAt: '2026-10-22T14:45:30-07:00', subject: 'fix: one (#1)', files: ['src/a.ts', 'docs/b.md'] },
    { sha: 'bbb222', committedAt: '2026-10-21T10:00:00-07:00', subject: 'merge', files: [] },
  ])
  assert.deepEqual(parseGitLog(''), [])
})

test('current when production serves main', () => {
  const result = computeStaleness({ commits: [], commitsBehind: 0, now: NOW })
  assert.equal(result.status, 'current')
  assert.equal(result.stale, false)
  assert.equal(result.behind, false)
  assert.match(describeStaleness(result, 'abcdef1234567890', 'origin/main'), /current with origin\/main/)
})

test('behind but within threshold is a warning, not stale', () => {
  const result = computeStaleness({
    commits: [
      { sha: 'new1', committedAt: daysAgo(1), subject: 'feat', files: ['src/x.ts'] },
      { sha: 'old1', committedAt: daysAgo(6.5), subject: 'feat', files: ['worker/y.js'] },
    ],
    now: NOW,
  })
  assert.equal(result.status, 'behind')
  assert.equal(result.stale, false)
  assert.equal(result.commitsBehind, 2)
  assert.equal(result.oldestRuntimeUnpromoted.sha, 'old1')
  assert.equal(result.oldestRuntimeAgeDays, 6.5)
})

test('stale when the oldest runtime-affecting unpromoted commit exceeds the threshold', () => {
  const result = computeStaleness({
    commits: [
      { sha: 'rt', committedAt: daysAgo(8), subject: 'feat', files: ['src/x.ts'] },
      { sha: 'doc', committedAt: daysAgo(46), subject: 'docs', files: ['docs/x.md'] },
    ],
    commitsBehind: 5,
    now: NOW,
  })
  assert.equal(result.status, 'stale')
  assert.equal(result.stale, true)
  assert.equal(result.commitsBehind, 5)
  assert.equal(result.runtimeCommitsBehind, 1)
  assert.equal(result.oldestUnpromoted.sha, 'doc')
  assert.equal(result.oldestRuntimeUnpromoted.sha, 'rt')
  assert.match(describeStaleness(result, 'abcdef1234567890', 'origin/main'), /^Production is STALE \(abcdef123456\): 5 commit\(s\) behind/)
})

test('old docs/tests-only backlog never trips the threshold', () => {
  const result = computeStaleness({
    commits: [{ sha: 'doc', committedAt: daysAgo(46), subject: 'docs', files: ['docs/x.md', 'tests/y.spec.ts'] }],
    now: NOW,
  })
  assert.equal(result.status, 'behind')
  assert.equal(result.stale, false)
  assert.equal(result.oldestRuntimeUnpromoted, null)
  assert.match(describeStaleness(result, 'abcdef1234567890', 'origin/main'), /docs\/tests only/)
})

test('threshold is exclusive and configurable', () => {
  const commits = [{ sha: 'rt', committedAt: daysAgo(7), subject: 'feat', files: ['src/x.ts'] }]
  assert.equal(computeStaleness({ commits, now: NOW }).stale, false)
  assert.equal(computeStaleness({ commits, now: NOW, thresholdDays: 3 }).stale, true)
})

test('just over the threshold is stale even though the displayed age rounds down', () => {
  const commits = [{ sha: 'rt', committedAt: daysAgo(7 + 1 / 24), subject: 'feat', files: ['src/x.ts'] }]
  const result = computeStaleness({ commits, now: NOW })
  assert.equal(result.oldestRuntimeAgeDays, 7)
  assert.equal(result.stale, true)
})
