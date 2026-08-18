import { describe, expect, it } from 'vitest'
import { DashboardIntelSetupSections } from './intel-setup-sections'

describe('dashboard intel setup sections module', () => {
  it('exports DashboardIntelSetupSections', () => {
    expect(typeof DashboardIntelSetupSections).toBe('function')
  })
})