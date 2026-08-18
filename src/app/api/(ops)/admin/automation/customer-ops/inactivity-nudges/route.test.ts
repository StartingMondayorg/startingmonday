import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('inactivity nudges route module', () => {
  it('exports POST handler', () => {
    expect(typeof route.POST).toBe('function')
  })
})