import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildKeysetCursorDisjunction,
  checkForbidden,
  checkSignature,
  computeLookbackWindow,
  resolveLookbackDays,
} from './outreach-audit-rules.mjs'

test('resolveLookbackDays defaults to 7 when unset', () => {
  assert.equal(resolveLookbackDays(undefined), 7)
  assert.equal(resolveLookbackDays(''), 7)
})

test('resolveLookbackDays accepts positive integers', () => {
  assert.equal(resolveLookbackDays('1'), 1)
  assert.equal(resolveLookbackDays('30'), 30)
  assert.equal(resolveLookbackDays(' 7 '), 7)
})

test('resolveLookbackDays falls back to 7 for invalid values', () => {
  assert.equal(resolveLookbackDays('   '), 7)
  assert.equal(resolveLookbackDays('0'), 7)
  assert.equal(resolveLookbackDays('-2'), 7)
  assert.equal(resolveLookbackDays('1.5'), 7)
  assert.equal(resolveLookbackDays('7days'), 7)
  assert.equal(resolveLookbackDays('abc'), 7)
})

test('resolveLookbackDays uses environment variable when argument is omitted', () => {
  const original = process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS
  try {
    process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS = ' 14 '
    assert.equal(resolveLookbackDays(), 14)
    process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS = 'x14'
    assert.equal(resolveLookbackDays(), 7)
  } finally {
    if (original == null) delete process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS
    else process.env.OUTREACH_DB_AUDIT_LOOKBACK_DAYS = original
  }
})

test('checkSignature validates required signoff block', () => {
  assert.equal(checkSignature('Hi there\n\nRich\nstartingmonday.app\n'), true)
  assert.equal(checkSignature('Hi there\n\nBest,\nRich\n'), false)
})

test('checkForbidden detects banned outreach phrases', () => {
  assert.equal(checkForbidden('I hope this finds you well'), true)
  assert.equal(checkForbidden('Specific and direct outreach copy'), false)
})

test('computeLookbackWindow derives inclusive bounds from one timestamp', () => {
  const nowMs = Date.parse('2026-09-13T12:34:56.000Z')
  const { startIso, endIso } = computeLookbackWindow(nowMs, 7)
  assert.equal(endIso, '2026-09-13T12:34:56.000Z')
  assert.equal(startIso, '2026-09-06T12:34:56.000Z')
})

test('buildKeysetCursorDisjunction returns lexicographic cursor predicate', () => {
  assert.equal(
    buildKeysetCursorDisjunction('2026-09-13T00:00:00.000Z', 'abc-123'),
    'or(and(sent_at.eq.2026-09-13T00:00:00.000Z,id.gt.abc-123),sent_at.gt.2026-09-13T00:00:00.000Z)',
  )
  assert.equal(buildKeysetCursorDisjunction('2026-09-13T00:00:00.000Z', 0), 'or(and(sent_at.eq.2026-09-13T00:00:00.000Z,id.gt.0),sent_at.gt.2026-09-13T00:00:00.000Z)')
  assert.equal(buildKeysetCursorDisjunction(null, 'abc-123'), null)
})

test('audit query cursor uses one grouped OR expression', () => {
  const cursor = buildKeysetCursorDisjunction('2026-09-13T00:00:00.000Z', 'abc-123')
  const fullFilter = `sender_email=eq.richard@startingmonday.app&sent_at=gte.2026-09-06T00:00:00.000Z&sent_at=lte.2026-09-13T00:00:00.000Z&or=(${cursor})`
  assert.match(fullFilter, /or=\(or\(and\(sent_at\.eq\./)
})
