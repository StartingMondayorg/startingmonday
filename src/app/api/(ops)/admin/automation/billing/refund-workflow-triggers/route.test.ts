import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('refund workflow triggers route module', () => {
  it('exports POST handler', () => {
    expect(typeof route.POST).toBe('function')
  })
})