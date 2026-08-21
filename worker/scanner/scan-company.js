import { isAllowedByRobots } from './robots-check.js'
import { fetchPage, BlockedError } from './fetch-page.js'
import { extractText } from './extract-text.js'
import { fetchAtsJobs, jobsToText } from './ats-adapters.js'
import { detectRoles } from './detect-roles.js'
import { scoreHit } from './score-hit.js'
import { wasRecentlyScanned, getPreviousHitTitles, RESCAN_WINDOW_STANDARD_HOURS } from './deduplicate.js'
import { writeScanResult, updateCompanyScanTime, writeScanBlocked, writeScanError, checkAndAlertScanFailures } from './write-results.js'
import { resolveCanonicalCompany } from '../lib/canonical-company.js'
import { recordRoleOpening, inferRoleFamilyFromTitle, isLeadershipTitle } from '../lib/outcome-labels.js'
import { logger } from '../lib/logger.js'

// Scans one company's career page end-to-end and writes a single scan_results row.
// rescanWindowHours must match the caller's cron cadence -- see deduplicate.js.
// Returns { skipped?, blocked?, hits, matches, newHits, error? }
export async function scanCompany(supabase, company, userProfile, { rescanWindowHours = RESCAN_WINDOW_STANDARD_HOURS } = {}) {
  const { id: companyId, user_id: userId, name, career_page_url } = company

  if (!career_page_url) {
    logger.info('scanner: skipping missing career_page_url', { companyId, userId, companyName: name })
    return { skipped: true }
  }

  try {
    // 1. Skip if scanned recently
    if (await wasRecentlyScanned(supabase, companyId, rescanWindowHours)) {
      logger.info('scanner: scanned recently, skipping', { companyId, userId, companyName: name, rescanWindowHours })
      return { skipped: true }
    }

    // 2. robots.txt check
    if (!(await isAllowedByRobots(career_page_url))) {
      logger.warn('scanner: blocked by robots.txt', { companyId, userId, companyName: name, careerPageUrl: career_page_url })
      return { blocked: true }
    }

    // 3. Get job text. Prefer a structured ATS JSON feed (Greenhouse, Lever,
    //    SmartRecruiters, BambooHR) — reliable and cheap. Fall back to fetching and
    //    extracting the career page (with browserless.io render) for non-ATS boards.
    let text
    let acquisitionPath
    let atsProvider = null
    let renderMs = null
    const atsFeed = await fetchAtsJobs(career_page_url)
    if (atsFeed && atsFeed.jobs.length) {
      logger.info('scanner: using ATS feed', { companyId, userId, companyName: name, ats: atsFeed.ats, jobCount: atsFeed.jobs.length })
      text = jobsToText(atsFeed.jobs)
      acquisitionPath = 'ats_feed'
      atsProvider = atsFeed.ats
    } else {
      logger.info('scanner: fetching career page', { companyId, userId, companyName: name, careerPageUrl: career_page_url })
      const fetched = await fetchPage(career_page_url)
      text = extractText(fetched.html)
      acquisitionPath = fetched.via
      renderMs = fetched.renderMs
    }
    logger.info('scanner: text acquired', { companyId, userId, companyName: name, acquisitionPath, atsProvider, renderMs })

    // 4. Detect candidate titles
    const candidates = detectRoles(text, userProfile)
    logger.info('scanner: candidates detected', { companyId, userId, companyName: name, candidateCount: candidates.length })

    // 5. Score each candidate; flag ones not seen in the previous scan
    const previousTitles = await getPreviousHitTitles(supabase, companyId)
    const scoredHits = []
    for (const candidate of candidates) {
      const score = await scoreHit(candidate, userProfile, name, company.role_watch_description ?? null)
      scoredHits.push({
        title: candidate.title,
        score: score.score,
        is_match: score.is_match,
        summary: score.summary,
        is_new: !previousTitles.has(candidate.title.toLowerCase()),
      })
    }

    // 6. Summarise
    const matches = scoredHits.filter(h => h.is_match)
    const newHits = scoredHits.filter(h => h.is_new)
    const aiScore = matches.length ? Math.max(...matches.map(h => h.score)) : 0
    const aiSummary = matches.length
      ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'} found: ${matches.map(h => h.title).join(', ')}`
      : scoredHits.length === 0
        ? 'No public postings found in this scan'
        : `No matches among ${scoredHits.length} ${scoredHits.length === 1 ? 'posting' : 'postings'} detected`

    // 7. Write one scan_results row
    await writeScanResult(supabase, { companyId, userId, hits: scoredHits, aiScore, aiSummary, acquisitionPath, atsProvider, renderMs })
    await updateCompanyScanTime(supabase, companyId)
    checkAndAlertScanFailures(supabase, { companyId, companyName: name, userId }).catch(() => {})

    const newMatchTitles = newHits.filter(h => h.is_match).map(h => h.title)

    // Outcome labeling (T2.1): every newly detected leadership posting is
    // ground truth that a role opened. Back-label the preceding event window.
    // Fire-and-forget — labeling must never affect scan results.
    for (const title of newMatchTitles) {
      if (!isLeadershipTitle(title)) continue
      labelDetectedOpening(supabase, company, title).catch(err =>
        logger.warn('scanner: outcome labeling failed', { companyId, title, error: err.message })
      )
    }

    logger.info('scanner: scan complete', { companyId, userId, companyName: name, matchCount: matches.length, newHitCount: newHits.length })
    return { hits: scoredHits.length, matches: matches.length, newHits: newHits.length, newMatchTitles, acquisitionPath, renderMs }
  } catch (error) {
    if (error instanceof BlockedError) {
      logger.warn('scanner: blocked by site', { companyId, userId, companyName: name, error: error.message })
      await writeScanBlocked(supabase, { companyId, userId, message: error.message })
      await updateCompanyScanTime(supabase, companyId)
      checkAndAlertScanFailures(supabase, { companyId, companyName: name, userId }).catch(() => {})
      return { blocked: true }
    }
    logger.error('scanner: scan failed', { companyId, userId, companyName: name, error: error.message })
    await writeScanError(supabase, { companyId, userId, error })
    checkAndAlertScanFailures(supabase, { companyId, companyName: name, userId }).catch(() => {})
    return { error: error.message }
  }
}

// Resolves the canonical company and records a career_scan role opening.
async function labelDetectedOpening(supabase, company, title) {
  const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
  if (!canonicalCompanyId) return
  await recordRoleOpening(supabase, {
    canonicalCompanyId,
    roleFamily: inferRoleFamilyFromTitle(title),
    roleTitle: title,
    openedOn: new Date().toISOString().slice(0, 10),
    labelSource: 'career_scan',
    sourceRef: `${company.id}:${title.toLowerCase()}`,
  })
}
