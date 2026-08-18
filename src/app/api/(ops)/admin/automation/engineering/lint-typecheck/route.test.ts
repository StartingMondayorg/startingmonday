import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('engineering lint typecheck route module', () => {
  it('exports POST handler', () => {
    expect(typeof route.POST).toBe('function')
  })
})