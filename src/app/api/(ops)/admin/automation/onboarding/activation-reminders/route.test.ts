import { describe, expect, it } from 'vitest'
import * as route from './route'

describe('onboarding activation reminders route module', () => {
  it('exports POST handler', () => {
    expect(typeof route.POST).toBe('function')
  })
})