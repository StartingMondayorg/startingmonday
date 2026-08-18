import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('billing readiness route module', () => {
  it('exports GET handler', () => {
    expect(typeof route.GET).toBe('function')
  })
})
