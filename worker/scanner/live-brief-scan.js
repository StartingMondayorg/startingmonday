import { isAllowedByRobots } from './robots-check.js'
import { fetchPage, BlockedError } from './fetch-page.js'
import { extractText, normalizeText, textShape, isDegenerateTextShape } from './extract-text.js'
import { fetchAtsJobs, jobsToText } from './ats-adapters.js'
import { detectRoles } from './detect-roles.js'
import { scoreHit } from './score-hit.js'

// Scans one live-brief company. Returns acquisitionPath and renderMs on every
// outcome that acquired text (SMK-489 item 5) so the writer can persist them;
// before this they were never recorded and live-brief scans were invisible to
// acquisition-path analysis.
export async function scanLiveBriefCompany(company, userProfile) {
  if (!company.career_page_url) return { status: 'no_public_postings', evidence: [] }
  if (!(await isAllowedByRobots(company.career_page_url))) {
    return { status: 'blocked_by_source_policy', evidence: [], errorClass: 'robots_blocked' }
  }

  let acquisitionPath = null
  let renderMs = null
  try {
    let text
    const atsFeed = await fetchAtsJobs(company.career_page_url)
    if (atsFeed?.jobs?.length) {
      text = jobsToText(atsFeed.jobs)
      acquisitionPath = 'ats_feed'
    } else {
      const fetched = await fetchPage(company.career_page_url)
      text = fetched.kind === 'text' ? normalizeText(fetched.content) : extractText(fetched.content)
      acquisitionPath = fetched.via
      renderMs = fetched.renderMs
    }

    // SMK-489 item 3: unreadable extraction is a failure, not a zero.
    if (isDegenerateTextShape(textShape(text))) {
      return { status: 'failed', evidence: [], errorClass: 'extraction_degenerate', acquisitionPath, renderMs }
    }

    const candidates = detectRoles(text, userProfile)
    const hits = []
    for (const candidate of candidates) {
      const score = await scoreHit(candidate, userProfile, company.company_name, company.target_role_lane ?? null)
      hits.push({
        title: candidate.title,
        score: score.score,
        is_match: score.is_match,
        summary: score.summary,
        observed_at: new Date().toISOString(),
        source_url: company.career_page_url,
      })
    }
    return {
      status: hits.length ? 'complete' : 'no_public_postings',
      evidence: hits,
      observedAt: new Date().toISOString(),
      acquisitionPath,
      renderMs,
    }
  } catch (error) {
    if (error instanceof BlockedError) {
      return { status: 'blocked_by_source_policy', evidence: [], errorClass: 'site_blocked', acquisitionPath, renderMs }
    }
    return {
      status: 'failed',
      evidence: [],
      errorClass: error instanceof Error ? error.name : 'scan_failed',
      acquisitionPath,
      renderMs,
    }
  }
}
