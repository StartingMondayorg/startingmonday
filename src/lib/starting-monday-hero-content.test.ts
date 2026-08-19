import { describe, expect, it } from 'vitest'
import {
  findStartingMondayHeroCopyViolations,
  STARTING_MONDAY_HERO_CONTENT,
} from './starting-monday-hero-content'

describe('Starting Monday hero content contract', () => {
  it('contains the approved gated hero copy and destinations', () => {
    expect(STARTING_MONDAY_HERO_CONTENT.eyebrow).toBe('Career intelligence for managers and executives.')
    expect(STARTING_MONDAY_HERO_CONTENT.heading).toBe('Be on the shortlist before the role is posted.')
    expect(STARTING_MONDAY_HERO_CONTENT.primaryCtaHref).toBe('/signup')
    expect(STARTING_MONDAY_HERO_CONTENT.secondaryCtaHref).toBe('/example')
  })

  it('keeps the rejected closing claim and pilot microcopy unset', () => {
    expect(STARTING_MONDAY_HERO_CONTENT.exampleClosingLine).toBeNull()
    expect(STARTING_MONDAY_HERO_CONTENT.pilotMicrocopy).toBeNull()
  })

  it('uses the approved real anonymized case with factual dated events', () => {
    expect(STARTING_MONDAY_HERO_CONTENT.proofCase?.illustrative).toBe(false)
    expect(STARTING_MONDAY_HERO_CONTENT.proofCase?.events).toHaveLength(3)
    expect(STARTING_MONDAY_HERO_CONTENT.proofCase?.status).toBe('Status: leadership transition documented.')
  })

  it('passes the approved copy through the surface-specific lint', () => {
    expect(findStartingMondayHeroCopyViolations()).toEqual([])
  })
})