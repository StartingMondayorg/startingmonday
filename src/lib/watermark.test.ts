import { describe, expect, it } from 'vitest'
import { decodeWatermark, encodeUserId, watermarkText } from './watermark'

describe('watermarking', () => {
  it('round-trips UUIDs and leaves invalid IDs unchanged', () => {
    const id = '12345678-1234-1234-1234-123456789abc'
    expect(decodeWatermark(encodeUserId(id))).toBe(id)
    expect(encodeUserId('not-a-uuid')).toBe('')
    expect(watermarkText('hello', 'not-a-uuid')).toBe('hello')
  })
})
