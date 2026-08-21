import { isAllowedByRobots } from './robots-check.js'
import { fetchPage, BlockedError } from './fetch-page.js'
import { extractText } from './extract-text.js'
import { fetchAtsJobs, jobsToText } from './ats-adapters.js'
import { detectRoles } from './detect-roles.js'
import { scoreHit } from './score-hit.js'

export async function scanLiveBriefCompany(company, userProfile) {
  if (!company.career_page_url) return { status: 'no_public_postings', evidence: [] }
  if (!(await isAllowedByRobots(company.career_page_url))) {
    return { status: 'blocked_by_source_policy', evidence: [], errorClass: 'robots_blocked' }
  }

  try {
    const atsFeed = await fetchAtsJobs(company.career_page_url)
    const text = atsFeed?.jobs?.length
      ? jobsToText(atsFeed.jobs)
      : extractText(await fetchPage(company.career_page_url))
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
    }
  } catch (error) {
    if (error instanceof BlockedError) {
      return { status: 'blocked_by_source_policy', evidence: [], errorClass: 'site_blocked' }
    }
    return {
      status: 'failed',
      evidence: [],
      errorClass: error instanceof Error ? error.name : 'scan_failed',
    }
  }
}
