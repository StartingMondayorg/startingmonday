import { describe, expect, it } from 'vitest'
import {
  decisionMarkerForStage,
  extractDecisionOwnerFromNotes,
  upsertDecisionOwnerInNotes,
} from './decision-timeline-utils'

describe('dashboard decision timeline utils', () => {
  it('maps known stages to decision markers', () => {
    const watching = decisionMarkerForStage('watching')
    const offer = decisionMarkerForStage('offer')

    expect(watching.decisionWindowLabel).toBe('within 2 days')
    expect(offer.decisionWindowLabel).toBe('within 1 day')
    expect(offer.marker.toLowerCase()).toContain('accept/decline')
  })

  it('falls back for unknown stages', () => {
    const result = decisionMarkerForStage('custom-stage')
    expect(result.decisionWindowLabel).toBe('within 3 days')
    expect(result.marker.toLowerCase()).toContain('irreversible')
  })

  it('extracts decision owner from notes', () => {
    const notes = '[Decision Owner: Coach]\nSome note body'
    expect(extractDecisionOwnerFromNotes(notes)).toBe('Coach')
  })

  it('upserts owner into notes while preserving body', () => {
    const notes = 'Current context line'
    const updated = upsertDecisionOwnerInNotes(notes, 'Partner')

    expect(updated.startsWith('[Decision Owner: Partner]')).toBe(true)
    expect(updated).toContain('Current context line')
  })

  it('replaces existing decision owner line', () => {
    const notes = '[Decision Owner: Executive]\nCurrent context line'
    const updated = upsertDecisionOwnerInNotes(notes, 'Admin')

    expect(updated).toContain('[Decision Owner: Admin]')
    expect(updated).not.toContain('[Decision Owner: Executive]')
  })
})
