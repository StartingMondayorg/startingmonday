import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('monitoring alerts route module', () => {
  it('exports GET and POST handlers', () => {
    expect(typeof route.GET).toBe('function')
    expect(typeof route.POST).toBe('function')
  })
})