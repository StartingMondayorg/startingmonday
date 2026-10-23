import { logger } from '../lib/logger.js'
import { getSupabase } from '../lib/supabase.js'
import { resolveCanonicalCompany, clearCanonicalCache } from '../lib/canonical-company.js'
import { inferRoleFamilyFromTitle, recordRoleOpening } from '../lib/outcome-labels.js'
import { safeFetch, UnsafeUrlError } from '../lib/safe-fetch.js'

const SCANNER_MISS_LOCK_KEY = 5814309962n
const SCANNER_MISS_BATCH = Number(process.env.SCANNER_MISS_BATCH ?? 80)

function leadershipKeywordHit(text) {
  const lower = String(text ?? '').toLowerCase()
  return /(chief|cto|cio|ciso|coo|cpo|vp|vice president|head of|director|general manager)/.test(lower)
}

function extractHtmlTitle(html) {
  const match = String(html ?? '').match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.trim() ?? null
}

async function verifyRoleUrl(url) {
  try {
    // role_url comes from scanner-miss reports: resolve, pin and re-check
    // every redirect (P1-5).
    const response = await safeFetch(url, {
      timeoutMs: 12000,
      maxBytes: 5 * 1024 * 1024,
      headers: { 'User-Agent': 'StartingMondayBot/1.0 (+https://startingmonday.app)' },
    })
    if (!response.ok) return { verified: false, status: 'pending_review', note: `fetch_failed_${response.status}` }

    const html = await response.text()
    const title = extractHtmlTitle(html)
    if (leadershipKeywordHit(html) || leadershipKeywordHit(title)) {
      return { verified: true, title }
    }

    return { verified: false, status: 'rejected', note: 'no_leadership_markers' }
  } catch (err) {
    if (err instanceof UnsafeUrlError) return { verified: false, status: 'rejected', note: 'unsafe_url' }
    return { verified: false, status: 'pending_review', note: `fetch_error:${err.message}` }
  }
}

export async function runScannerMissVerifierJob() {
  const supabase = getSupabase()

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: SCANNER_MISS_LOCK_KEY })
  if (!locked) {
    logger.warn('scanner-miss-verifier-job: another instance running — skipping')
    return
  }

  clearCanonicalCache()

  const stats = { reviewed: 0, verified: 0, pendingReview: 0, rejected: 0, labels: 0 }

  try {
    const { data: misses, error } = await supabase
      .from('scanner_misses')
      .select('id, user_id, company_id, role_url, role_title, status')
      .in('status', ['new', 'pending_review'])
      .order('created_at', { ascending: true })
      .limit(SCANNER_MISS_BATCH)

    if (error) {
      logger.error('scanner-miss-verifier-job: failed to load queue', { error: error.message })
      return
    }

    const companyIds = [...new Set((misses ?? []).map((row) => row.company_id))]
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, user_id, company_url, sector, is_public_company, sec_cik_padded, canonical_company_id')
      .in('id', companyIds)
    const companyById = new Map((companies ?? []).map((company) => [company.id, company]))

    for (const row of misses ?? []) {
      stats.reviewed += 1
      const company = companyById.get(row.company_id)
      if (!company) continue

      const result = await verifyRoleUrl(row.role_url)
      const roleTitle = row.role_title ?? result.title ?? 'Leadership role (user report)'

      if (!result.verified) {
        await supabase
          .from('scanner_misses')
          .update({
            status: result.status,
            verification_notes: result.note,
          })
          .eq('id', row.id)

        if (result.status === 'pending_review') stats.pendingReview += 1
        else stats.rejected += 1
        continue
      }

      const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
      if (!canonicalCompanyId) continue

      const opening = await recordRoleOpening(supabase, {
        canonicalCompanyId,
        roleFamily: inferRoleFamilyFromTitle(roleTitle),
        roleTitle,
        openedOn: new Date().toISOString().slice(0, 10),
        labelSource: 'user_reported_miss',
        sourceRef: row.id,
      })

      await supabase
        .from('scanner_misses')
        .update({
          status: 'verified',
          role_title: roleTitle,
          verified_opened_on: new Date().toISOString().slice(0, 10),
          verified_at: new Date().toISOString(),
          verification_notes: 'verified_via_fetch',
        })
        .eq('id', row.id)

      stats.verified += 1
      if (opening.openingId && !opening.existing) stats.labels += 1
    }

    logger.info('scanner-miss-verifier-job: complete', stats)
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: SCANNER_MISS_LOCK_KEY })
  }
}
