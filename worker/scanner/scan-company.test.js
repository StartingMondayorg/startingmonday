import { describe, it, expect, vi, beforeEach } from 'vitest'

// extract-text.js and detect-roles.js stay real: these tests prove the
// extraction contract end to end, from fetched markup to the row writer.
const state = vi.hoisted(() => ({
  fetchPage: vi.fn(),
  fetchAtsJobs: vi.fn(),
  scoreHit: vi.fn(),
  writeScanResult: vi.fn(),
  writeScanExtractionFailure: vi.fn(),
  writeScanBlocked: vi.fn(),
  writeScanError: vi.fn(),
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
vi.mock('./score-hit.js', () => ({ scoreHit: state.scoreHit }))
vi.mock('./deduplicate.js', () => ({
  wasRecentlyScanned: async () => false,
  getPreviousHitTitles: async () => new Set(),
  RESCAN_WINDOW_STANDARD_HOURS: 24,
}))
vi.mock('./write-results.js', () => ({
  writeScanResult: state.writeScanResult,
  writeScanExtractionFailure: state.writeScanExtractionFailure,
  writeScanBlocked: state.writeScanBlocked,
  writeScanError: state.writeScanError,
  updateCompanyScanTime: async () => {},
  checkAndAlertScanFailures: async () => {},
}))
vi.mock('../lib/canonical-company.js', () => ({ resolveCanonicalCompany: async () => null }))
vi.mock('../lib/outcome-labels.js', () => ({
  recordRoleOpening: async () => {},
  inferRoleFamilyFromTitle: () => 'technology',
  isLeadershipTitle: () => false,
}))
vi.mock('../lib/logger.js', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {} },
}))

const { scanCompany } = await import('./scan-company.js')

const company = { id: 'c1', user_id: 'u1', name: 'Acme', career_page_url: 'https://acme.example/careers' }
const profile = { target_titles: [] }
const supabase = {}

beforeEach(() => {
  state.fetchPage.mockReset()
  state.fetchAtsJobs.mockReset().mockResolvedValue(null)
  state.scoreHit.mockReset().mockResolvedValue({ score: 85, is_match: true, summary: 'match' })
  state.writeScanResult.mockReset().mockResolvedValue(undefined)
  state.writeScanExtractionFailure.mockReset().mockResolvedValue(undefined)
})

describe('scanCompany extraction contract', () => {
  it('detects roles end to end from a minified rendered DOM and records shape telemetry', async () => {
    const minified =
      '<html><body><div id="app"><ul>' +
      '<li>VP of Engineering</li><li>Chief Technology Officer</li><li>Barista</li>' +
      '</ul></div></body></html>'
    state.fetchPage.mockResolvedValue({ content: minified, kind: 'html', via: 'render', renderMs: 3100 })

    const result = await scanCompany(supabase, company, profile)

    expect(result.hits).toBe(2)
    expect(state.writeScanExtractionFailure).not.toHaveBeenCalled()
    expect(state.writeScanResult).toHaveBeenCalledTimes(1)
    const row = state.writeScanResult.mock.calls[0][1]
    expect(row.acquisitionPath).toBe('render')
    expect(row.renderMs).toBe(3100)
    expect(row.textShape.lineCount).toBeGreaterThan(1)
    expect(row.textShape.chars).toBeGreaterThan(0)
    expect(row.hits.map(h => h.title)).toEqual(['VP of Engineering', 'Chief Technology Officer'])
  })

  it('uses browser-computed text directly when the render returns kind text', async () => {
    state.fetchPage.mockResolvedValue({
      content: 'Open roles\nVP of Engineering\nChief Technology Officer\n',
      kind: 'text',
      via: 'render',
      renderMs: 1200,
    })

    const result = await scanCompany(supabase, company, profile)

    expect(result.hits).toBe(2)
    const row = state.writeScanResult.mock.calls[0][1]
    expect(row.textShape.lineCount).toBe(3)
  })

  it('records an extraction failure, never success-zero, for a degenerate one-line page', async () => {
    // Inline-only markup: everything fuses into one giant line even after
    // block-boundary extraction. This must not be recorded as a success.
    const collapsed =
      '<html><body><div>' +
      '<span>VP of Engineering</span><span>Chief Technology Officer</span>'.repeat(40) +
      '</div></body></html>'
    state.fetchPage.mockResolvedValue({ content: collapsed, kind: 'html', via: 'render', renderMs: 2500 })

    const result = await scanCompany(supabase, company, profile)

    expect(result.extractionFailed).toBe(true)
    expect(state.writeScanResult).not.toHaveBeenCalled()
    expect(state.writeScanExtractionFailure).toHaveBeenCalledTimes(1)
    const row = state.writeScanExtractionFailure.mock.calls[0][1]
    expect(row.acquisitionPath).toBe('render')
    expect(row.renderMs).toBe(2500)
    expect(row.textShape.lineCount).toBe(1)
    expect(row.textShape.maxLineChars).toBeGreaterThan(1000)
  })

  it('records shape telemetry for ATS feed scans too', async () => {
    state.fetchAtsJobs.mockResolvedValue({
      ats: 'greenhouse',
      jobs: [{ title: 'VP of Engineering' }, { title: 'Chief Technology Officer' }],
    })

    await scanCompany(supabase, company, profile)

    expect(state.fetchPage).not.toHaveBeenCalled()
    const row = state.writeScanResult.mock.calls[0][1]
    expect(row.acquisitionPath).toBe('ats_feed')
    expect(row.textShape.lineCount).toBe(2)
  })
})
