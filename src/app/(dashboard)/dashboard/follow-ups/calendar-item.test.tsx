import { describe, expect, it } from 'vitest'
import { CalendarItemClient } from './calendar-item'

describe('calendar item module', () => {
  it('exports CalendarItemClient', () => {
    expect(typeof CalendarItemClient).toBe('function')
  })
})