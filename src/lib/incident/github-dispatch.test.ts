import { generateKeyPairSync } from 'crypto'
import { describe, expect, it } from 'vitest'
import { buildAppJwt, normalizeKey } from './github-dispatch'

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()

describe('buildAppJwt', () => {
  it('produces a verifiable RS256 JWT with GitHub-acceptable claims', () => {
    const now = 1_760_000_000
    const [header, payload] = buildAppJwt('12345', pem, now).split('.')
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' })

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    expect(claims.iss).toBe('12345')
    // GitHub rejects a future iat and caps expiry at 10 minutes.
    expect(claims.iat).toBeLessThan(now)
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600)
  })

  it('accepts a PEM whose newlines were flattened by a secret store', () => {
    const flattened = pem.replace(/\n/g, '\\n')
    expect(() => buildAppJwt('12345', flattened)).not.toThrow()
  })
})

describe('normalizeKey', () => {
  it('leaves a real PEM untouched', () => {
    expect(normalizeKey(pem)).toBe(pem)
  })
})
