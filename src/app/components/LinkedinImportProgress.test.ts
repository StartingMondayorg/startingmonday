import { describe, expect, it } from 'vitest'
import { ceilingFor, LinkedinImportProgress } from './LinkedinImportProgress'

describe('LinkedinImportProgress', () => {
  it('exports a component', () => {
    expect(typeof LinkedinImportProgress).toBe('function')
  })

  it('caps a single-stage run below completion until the work returns', () => {
    expect(ceilingFor(0, 1)).toBe(94)
  })

  it('splits the bar evenly across a two-stage run', () => {
    expect(ceilingFor(0, 2)).toBe(47)
    expect(ceilingFor(1, 2)).toBe(94)
  })

  it('never exceeds the final ceiling when the stage index overruns', () => {
    expect(ceilingFor(5, 2)).toBe(94)
  })
})
