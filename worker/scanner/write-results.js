import { notify } from '../lib/notify.js'
import { logger } from '../lib/logger.js'

// scan_results schema: one row per company scan
// raw_hits: JSONB array of { title, score, is_match, summary }
// ai_score: highest match score found (0-100)
// ai_summary: plain-text summary of findings
// status: 'success' | 'blocked' | 'error' | 'extraction_failed'
// acquisition_path: 'ats_feed' | 'direct_fetch' | 'render' -- only 'render' spends
//   a browserless.io unit (SMK-476)
// render_ms: duration of the browserless.io call; a unit is 30s of browser time
// extracted_chars / extracted_line_count / extracted_max_line_chars: text-shape
//   telemetry per scan (SMK-489 item 4), so collapsed extraction stays measurable

function shapeColumns(textShape) {
  return {
    extracted_chars: textShape?.chars ?? null,
    extracted_line_count: textShape?.lineCount ?? null,
    extracted_max_line_chars: textShape?.maxLineChars ?? null,
  }
}

export async function writeScanResult(supabase, { companyId, userId, hits, aiScore, aiSummary, acquisitionPath = null, atsProvider = null, renderMs = null, textShape = null }) {
  const { error } = await supabase.from('scan_results').insert({
    company_id: companyId,
    user_id: userId,
    scanned_at: new Date().toISOString(),
    status: 'success',
    raw_hits: hits,
    ai_score: aiScore,
    ai_summary: aiSummary,
    acquisition_path: acquisitionPath,
    ats_provider: atsProvider,
    render_ms: renderMs,
    ...shapeColumns(textShape),
  })
  if (error) throw new Error(`Failed to write scan result: ${error.message}`)
}

// SMK-489 item 3: the scan acquired content but extraction collapsed it into an
// unreadable shape. This is a distinct failure outcome, never a success with
// zero hits, so per-company health reporting (SMK-478) can see it.
export async function writeScanExtractionFailure(supabase, { companyId, userId, acquisitionPath = null, atsProvider = null, renderMs = null, textShape = null }) {
  const shape = textShape ?? {}
  const { error } = await supabase.from('scan_results').insert({
    company_id: companyId,
    user_id: userId,
    scanned_at: new Date().toISOString(),
    status: 'extraction_failed',
    raw_hits: [],
    ai_score: 0,
    ai_summary: 'Career page content could not be parsed into readable lines; no verdict on open roles',
    error_message: `Degenerate extraction shape: ${shape.chars ?? '?'} chars in ${shape.lineCount ?? '?'} line(s), longest line ${shape.maxLineChars ?? '?'} chars`.slice(0, 500),
    acquisition_path: acquisitionPath,
    ats_provider: atsProvider,
    render_ms: renderMs,
    ...shapeColumns(textShape),
  })
  if (error) throw new Error(`Failed to write extraction failure: ${error.message}`)
}

export async function updateCompanyScanTime(supabase, companyId) {
  const { error } = await supabase
    .from('companies')
    .update({ last_checked_at: new Date().toISOString() })
    .eq('id', companyId)
  if (error) logger.error('write-results: failed to update last_checked_at', { companyId, error: error.message })
}

export async function writeScanBlocked(supabase, { companyId, userId, message }) {
  await supabase.from('scan_results').insert({
    company_id: companyId,
    user_id: userId,
    scanned_at: new Date().toISOString(),
    status: 'blocked',
    raw_hits: [],
    ai_score: 0,
    error_message: (message ?? 'Site blocks automated access').slice(0, 500),
  })
}

export async function writeScanError(supabase, { companyId, userId, error }) {
  await supabase.from('scan_results').insert({
    company_id: companyId,
    user_id: userId,
    scanned_at: new Date().toISOString(),
    status: 'error',
    raw_hits: [],
    ai_score: 0,
    error_message: error.message?.slice(0, 500) ?? 'Unknown error',
  })
}

// Fires once when 3 consecutive scans all return 0 hits (any status).
// "Once" is enforced by checking that the 4th-most-recent scan had hits —
// so the alert only triggers at the exact moment we cross the threshold.
// Fires once when 3 consecutive scans all return 0 hits (any status).
// "Once" is enforced by checking that the 4th-most-recent scan had hits —
// so the alert only triggers at the exact moment we cross the threshold.
export async function checkAndAlertScanFailures(supabase, { companyId, companyName, userId }) {
  try {
    const [{ data: recent }, { data: userRow }] = await Promise.all([
      supabase
        .from('scan_results')
        .select('raw_hits')
        .eq('company_id', companyId)
        .order('scanned_at', { ascending: false })
        .limit(4),
      supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single(),
    ])

    if (!recent || recent.length < 3) return

    const last3Empty = recent.slice(0, 3).every(r => !r.raw_hits?.length)
    if (!last3Empty) return

    // Already past 3 consecutive failures — don't re-alert
    const fourth = recent[3]
    if (fourth && !fourth.raw_hits?.length) return

    const userEmail = userRow?.email ?? userId
    const subject = `Scan failure: ${companyName} — 3 consecutive empty results`
    const body = [
      `Company: ${companyName}`,
      `User: ${userEmail}`,
      `Company ID: ${companyId}`,
      '',
      'The last 3 scans returned 0 results (blocked, error, or no roles detected).',
      'The career page may be broken, JS-rendered, or blocking the scraper.',
      '',
      `Admin: https://startingmonday.app/dashboard/admin`,
    ].join('\n')

    logger.warn('write-results: 3 consecutive scan failures', { companyId, companyName })
    await notify({ subject, body })
  } catch (err) {
    logger.error('write-results: checkAndAlertScanFailures failed', { error: err.message })
  }
}
