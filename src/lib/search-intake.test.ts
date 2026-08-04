import { describe, expect, it } from 'vitest'
import {
  buildSearchIntakeSection,
  intakeOptionLabel,
  transitionTypeFromEmploymentStatus,
  urgencyFromSearchTimeline,
  TRANSITION_TYPE_OPTIONS,
} from './search-intake'

describe('onboarding to intake mapping', () => {
  it('maps every onboarding employment status to a transition type', () => {
    expect(transitionTypeFromEmploymentStatus('employed_exploring')).toBe('confidential_search')
    expect(transitionTypeFromEmploymentStatus('active_search')).toBe('active_search')
    expect(transitionTypeFromEmploymentStatus('consulting')).toBe('consulting_interim')
    expect(transitionTypeFromEmploymentStatus('between_roles')).toBe('post_transition')
  })

  it('maps every onboarding search timeline to an urgency', () => {
    expect(urgencyFromSearchTimeline('immediately')).toBe('immediate')
    expect(urgencyFromSearchTimeline('3_months')).toBe('within_3_months')
    expect(urgencyFromSearchTimeline('6_months')).toBe('within_6_months')
    expect(urgencyFromSearchTimeline('opportunistic')).toBe('right_opportunity')
  })

  it('returns null for unknown or missing values', () => {
    expect(transitionTypeFromEmploymentStatus('something_else')).toBeNull()
    expect(transitionTypeFromEmploymentStatus(null)).toBeNull()
    expect(urgencyFromSearchTimeline(undefined)).toBeNull()
  })
})

describe('intakeOptionLabel', () => {
  it('resolves known values to labels', () => {
    expect(intakeOptionLabel(TRANSITION_TYPE_OPTIONS, 'post_transition')).toBe('Post-transition (recently exited or between roles)')
  })

  it('passes legacy free-text values through unchanged', () => {
    expect(intakeOptionLabel(TRANSITION_TYPE_OPTIONS, 'Confidential search')).toBe('Confidential search')
  })

  it('returns null for empty values', () => {
    expect(intakeOptionLabel(TRANSITION_TYPE_OPTIONS, null)).toBeNull()
  })
})

describe('buildSearchIntakeSection', () => {
  it('returns empty string when role_context has no intake', () => {
    expect(buildSearchIntakeSection(null)).toBe('')
    expect(buildSearchIntakeSection({})).toBe('')
  })

  it('returns empty string when the intake has no substantive fields', () => {
    expect(buildSearchIntakeSection({ search_intake: { audience: 'individual' } })).toBe('')
  })

  it('serializes populated fields with labels', () => {
    const section = buildSearchIntakeSection({
      search_intake: {
        transition_type: 'confidential_search',
        search_stage: 'interviewing',
        decision_criteria: ['Mandate quality', 'Sponsor depth'],
        red_flags: ['Unclear mandate'],
      },
    })
    expect(section).toContain('SEARCH INTAKE')
    expect(section).toContain('Transition type: Confidential search (employed, searching quietly)')
    expect(section).toContain('Search stage: Active interviews')
    expect(section).toContain('Decision criteria: Mandate quality, Sponsor depth')
    expect(section).toContain('Red flags: Unclear mandate')
  })
})
