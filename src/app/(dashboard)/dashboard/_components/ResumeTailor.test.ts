import { describe, expect, it } from 'vitest'
import { ResumeTailor } from './ResumeTailor'

describe('resume tailor module', () => {
  it('exports ResumeTailor', () => {
    expect(typeof ResumeTailor).toBe('function')
  })
})