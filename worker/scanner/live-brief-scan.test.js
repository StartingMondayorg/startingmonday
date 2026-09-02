import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  fetchPage: vi.fn(),
  fetchAtsJobs: vi.fn(),
}))

vi.mock('./robots-check.js', () => ({ isAllowedByRobots: async () => true }))
vi.mock('./fetch-page.js', () => ({
  fetchPage: state.fetchPage,
  BlockedError: class BlockedError extends Error {},
}))
vi.mock('./ats-adapters.js', () => ({
  fetchAtsJobs: state.fetchAtsJobs,
  jobsToText: (jobs) => jobs.map(j => j.title).join('\n'),
}))
vi.mock('./score-hit.js', () => ({
  scoreHit: async () => ({ score: 90, is_match: true, summary: 'match' }),
}))

const { scanLiveBriefCompany } = await import('./live-brief-scan.js')

const company = { company_name: 'Acme', career_page_url: 'https://acme.example/careers' }
const profile = { target_titles: [] }

beforeEach(() => {
  state.fetchPage.mockReset()
  state.fetchAtsJobs.mockReset().mockResolvedValue(null)
})

describe('scanLiveBriefCompany acquisition telemetry (SMK-489 item 5)', () => {
  it('returns the render path and duration with a completed scan', async () => {
    state.fetchPage.mockResolvedValue({
      content: 'VP of Engineering\nChief Technology Officer',
      kind: 'text',
      via: 'render',
      renderMs: 1800,
    })

    const result = await scanLiveBriefCompany(company, profile)

    expect(result.status).toBe('complete')
    expect(result.acquisitionPath).toBe('render')
    expect(result.renderMs).toBe(1800)
    expect(result.evidence.map(h => h.title)).toEqual(['VP of Engineering', 'Chief Technology Officer'])
  })

  it('returns ats_feed as the path when a feed served the text', async () => {
    state.fetchAtsJobs.mockResolvedValue({ ats: 'lever', jobs: [{ title: 'VP of Engineering' }] })

    const result = await scanLiveBriefCompany(company, profile)

    expect(result.status).toBe('complete')
    expect(result.acquisitionPath).toBe('ats_feed')
    expect(result.renderMs).toBeNull()
    expect(state.fetchPage).not.toHaveBeenCalled()
  })

  it('extracts roles from minified fetched HTML (regression: object passed to extractText)', async () => {
    state.fetchPage.mockResolvedValue({
      content: '<html><body><ul><li>VP of Engineering</li><li>Barista</li></ul></body></html>',
      kind: 'html',
      via: 'direct_fetch',
      renderMs: null,
    })

    const result = await scanLiveBriefCompany(company, profile)

    expect(result.status).toBe('complete')
    expect(result.acquisitionPath).toBe('direct_fetch')
    expect(result.evidence.map(h => h.title)).toEqual(['VP of Engineering'])
  })

  it('fails with extraction_degenerate instead of reporting no postings for a collapsed page', async () => {
    state.fetchPage.mockResolvedValue({
      content: '<html><body><div>' + '<span>VP of Engineering</span>'.repeat(80) + '</div></body></html>',
      kind: 'html',
      via: 'render',
      renderMs: 2100,
    })

    const result = await scanLiveBriefCompany(company, profile)

    expect(result.status).toBe('failed')
    expect(result.errorClass).toBe('extraction_degenerate')
    expect(result.acquisitionPath).toBe('render')
    expect(result.renderMs).toBe(2100)
  })
})
