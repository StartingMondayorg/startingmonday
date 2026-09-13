import assert from 'node:assert/strict'
import test from 'node:test'

import { buildOutreachLogCursorFilter, checkForbidden, checkSignature, resolveLookbackDays } from './outreach-audit-rules.mjs'

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

test('buildOutreachLogCursorFilter creates keyset pagination clause', () => {
  assert.equal(
    buildOutreachLogCursorFilter('2026-09-13T00:00:00.000Z', 'abc-123'),
    'sent_at.gt.2026-09-13T00:00:00.000Z,and(sent_at.eq.2026-09-13T00:00:00.000Z,id.gt.abc-123)',
  )
  assert.equal(buildOutreachLogCursorFilter(null, 'abc-123'), null)
})
