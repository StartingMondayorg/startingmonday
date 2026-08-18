import { describe, expect, it } from 'vitest'
import { CoachClientDataView } from './client-data-view'

describe('coach client data view module', () => {
  it('exports CoachClientDataView', () => {
    expect(typeof CoachClientDataView).toBe('function')
  })
})