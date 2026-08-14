import { describe, expect, it } from 'vitest'
import { isDemoUser } from './demo'

describe('demo helpers', () => {
  it('rejects demo access when no demo identity is configured', () => {
    expect(isDemoUser('demo-user')).toBe(false)
  })
})
