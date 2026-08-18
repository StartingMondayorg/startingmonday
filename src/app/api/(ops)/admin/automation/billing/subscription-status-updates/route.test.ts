import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('subscription status updates route module', () => {
  it('exports POST handler', () => {
    expect(typeof route.POST).toBe('function')
  })
})