import { describe, expect, it } from 'vitest'
import { generatePixelTokenSigned, parsePixelTokenSigned } from './pixel-token'

describe('pixel tokens', () => {
  it('rejects malformed tokens and refuses signing without a configured secret', () => {
    const id = '12345678-1234-1234-1234-123456789abc'
    expect(() => generatePixelTokenSigned(id, 'welcome', '2026-08-14')).toThrow('PIXEL_TOKEN_SECRET')
    expect(parsePixelTokenSigned('not-a-token')).toBeNull()
  })
})
