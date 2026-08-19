import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isStartingMondayHeroEvidenceEnabled,
  isStartingMondayDashboardSimplificationEnabled,
  STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG,
  STARTING_MONDAY_DASHBOARD_SIMPLIFICATION_ENABLED_FLAG,
} from './feature-flags'

describe('Starting Monday hero evidence feature flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to disabled when unset', () => {
    vi.stubEnv(STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG, '')

    expect(isStartingMondayHeroEvidenceEnabled()).toBe(false)
  })

  it.each(['1', 'true', 'yes', 'on'])('enables for %s', (value) => {
    vi.stubEnv(STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG, value)

    expect(isStartingMondayHeroEvidenceEnabled()).toBe(true)
  })

  it('does not enable for an unrecognized value', () => {
    vi.stubEnv(STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG, 'pilot')

    expect(isStartingMondayHeroEvidenceEnabled()).toBe(false)
  })
})

describe('Starting Monday dashboard simplification feature flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to disabled when unset', () => {
    vi.stubEnv(STARTING_MONDAY_DASHBOARD_SIMPLIFICATION_ENABLED_FLAG, '')

    expect(isStartingMondayDashboardSimplificationEnabled()).toBe(false)
  })

  it.each(['1', 'true', 'yes', 'on'])('enables for %s', (value) => {
    vi.stubEnv(STARTING_MONDAY_DASHBOARD_SIMPLIFICATION_ENABLED_FLAG, value)

    expect(isStartingMondayDashboardSimplificationEnabled()).toBe(true)
  })
})