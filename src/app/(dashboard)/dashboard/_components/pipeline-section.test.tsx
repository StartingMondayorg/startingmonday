import { describe, expect, it } from 'vitest'
import { DashboardPipelineSection } from './pipeline-section'

describe('dashboard pipeline section module', () => {
  it('exports DashboardPipelineSection', () => {
    expect(typeof DashboardPipelineSection).toBe('function')
  })
})