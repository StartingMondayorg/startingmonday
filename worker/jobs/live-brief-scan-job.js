import { getSupabase } from '../lib/supabase.js'
import { createLimiter } from '../lib/concurrency.js'
import { scanLiveBriefCompany } from '../scanner/live-brief-scan.js'

const MAX_COMPANIES = 10
const MAX_CONCURRENT = 3

export async function runLiveBriefScanJob(runId) {
  const supabase = getSupabase()
  const { data: run, error: runError } = await supabase
    .from('live_brief_scan_runs')
    .select('id,request_id,status,selected_company_count')
    .eq('id', runId)
    .maybeSingle()
  if (runError || !run) throw new Error('live brief scan run not found')
  if (run.status !== 'queued') return { skipped: true, status: run.status }
  if (run.selected_company_count < 1 || run.selected_company_count > MAX_COMPANIES) throw new Error('live brief scan company limit exceeded')

  const { data: request, error: requestError } = await supabase
    .from('live_brief_requests')
    .select('reviewed_profile,status')
    .eq('id', run.request_id)
    .single()
  if (requestError || !request) throw new Error('live brief request not found')

  const { data: companies, error: companiesError } = await supabase
    .from('live_brief_scan_companies')
    .select('id,company_key,company_name,career_page_url,target_role_lane,status')
    .eq('run_id', run.id)
    .order('created_at', { ascending: true })
  if (companiesError) throw new Error(`live brief scan companies unavailable: ${companiesError.message}`)

  await supabase.from('live_brief_scan_runs').update({ status: 'scanning', started_at: new Date().toISOString() }).eq('id', run.id)
  const limit = createLimiter(MAX_CONCURRENT)
  const results = await Promise.all((companies ?? []).map((company) => limit(async () => {
    await supabase.from('live_brief_scan_companies').update({ status: 'scanning' }).eq('id', company.id)
    const result = await scanLiveBriefCompany(company, request.reviewed_profile ?? {})
    await supabase.from('live_brief_scan_companies').update({
      status: result.status,
      evidence_summary: result.evidence,
      error_class: result.errorClass ?? null,
      observed_at: result.observedAt ?? new Date().toISOString(),
    }).eq('id', company.id)
    return result
  })))

  const completed = results.filter((result) => result.status === 'complete').length
  const blocked = results.filter((result) => result.status === 'blocked_by_source_policy').length
  const failed = results.filter((result) => result.status === 'failed').length
  const runStatus = failed === results.length ? 'failed' : 'completed'
  await supabase.from('live_brief_scan_runs').update({
    status: runStatus,
    completed_company_count: completed,
    blocked_company_count: blocked,
    failed_company_count: failed,
    completed_at: new Date().toISOString(),
  }).eq('id', run.id)

  if (runStatus === 'completed') {
    await supabase.from('live_brief_requests').update({ status: 'ready_for_review' }).eq('id', run.request_id)
  }
  return { runId: run.id, status: runStatus, completed, blocked, failed }
}
