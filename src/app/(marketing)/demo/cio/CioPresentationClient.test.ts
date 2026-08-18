import { describe, expect, it } from 'vitest'
import { CioPresentationClient } from './CioPresentationClient'

describe('cio presentation module', () => {
  it('exports CioPresentationClient', () => {
    expect(typeof CioPresentationClient).toBe('function')
  })
})