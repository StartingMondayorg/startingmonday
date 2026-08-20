import { describe, expect, it } from 'vitest'
import DashboardProgressPage from './page'

describe('dashboard progress page module', () => {
  it('exports DashboardProgressPage', () => {
    expect(typeof DashboardProgressPage).toBe('function')
  })
})