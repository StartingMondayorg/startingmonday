import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveLookbackDays } from './outreach-audit-rules.mjs'

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
