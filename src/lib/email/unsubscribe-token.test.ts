import { beforeEach, describe, expect, it, vi } from 'vitest'
import { unsubscribeUrl, verifyUnsubscribeToken } from './unsubscribe-token'

describe('unsubscribe tokens', () => {
  beforeEach(() => vi.stubEnv('UNSUBSCRIBE_SECRET', 'test-secret'))

  it('round-trips a UUID and rejects a tampered signature', () => {
    const id = '12345678-1234-1234-1234-123456789abc'
    const url = new URL(unsubscribeUrl(id))
    expect(verifyUnsubscribeToken(url.searchParams.get('uid'), url.searchParams.get('sig'))).toBe(id)
    expect(verifyUnsubscribeToken(url.searchParams.get('uid'), 'bad')).toBeNull()
  })
})
