import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('outreach tone guard route module', () => {
  it('exports GET handler and runtime', () => {
    expect(typeof route.GET).toBe('function')
    expect(route.runtime).toBe('nodejs')
  })
})