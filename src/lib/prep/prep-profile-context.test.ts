import { describe, it, expect } from 'vitest'
import { buildCareerHistorySection, buildStarStoriesSection } from './prep-profile-context'

const stories = [
  { situation: 'Team missed two quarters', action: 'Rebuilt pipeline process', result: 'Hit plan in Q3', tags: ['execution'] },
  { situation: 'Merger integration stalled', action: 'Ran integration office', result: 'Closed 90-day plan on time' },
]

describe('buildStarStoriesSection', () => {
  it('returns empty string when no stories', () => {
    expect(buildStarStoriesSection(null)).toBe('')
    expect(buildStarStoriesSection({ star_stories: [] })).toBe('')
    expect(buildStarStoriesSection({ star_stories: null })).toBe('')
  })

  it('formats stories with tags and STAR fields', () => {
    const out = buildStarStoriesSection({ star_stories: stories })
    expect(out).toContain('INTERVIEW STORIES (candidate-verified, treat as authoritative)')
    expect(out).toContain('Story 1 [applies to: execution]')
    expect(out).toContain('Situation: Team missed two quarters')
    expect(out).toContain('Action: Ran integration office')
    expect(out).toContain('Result: Hit plan in Q3')
  })

  it('embeds the custom usage instruction', () => {
    const out = buildStarStoriesSection({ star_stories: stories }, 'Use story 1 only.')
    expect(out).toContain('Use story 1 only.')
  })
})

describe('buildCareerHistorySection', () => {
  it('returns empty string with no profile or inputs', () => {
    expect(buildCareerHistorySection(null)).toBe('')
    expect(buildCareerHistorySection({})).toBe('')
  })

  it('prefers verified career history over resume text', () => {
    const out = buildCareerHistorySection({
      resume_text: 'RAW RESUME',
      career_history_json: [
        { company: 'Acme', title: 'VP Ops', start_year: '2019', end_year: '2023', key_outcome: 'Scaled ops 3x' },
      ],
    })
    expect(out).toContain('Verified career history')
    expect(out).toContain('Acme | VP Ops | 2019 to 2023')
    expect(out).toContain('Scaled ops 3x')
    expect(out).not.toContain('RAW RESUME')
  })

  it('falls back to truncated resume text when no verified history', () => {
    const out = buildCareerHistorySection({ resume_text: 'x'.repeat(5000) }, 100)
    expect(out).toContain('Resume / career history:')
    expect(out.length).toBeLessThan(200)
  })
})
