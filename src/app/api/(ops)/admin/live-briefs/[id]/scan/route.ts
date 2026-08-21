import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess, requireLiveBriefStaffAccess } from '@/lib/live-brief-auth'

export const dynamic = 'force-dynamic'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SelectedCompany = {
  company_key?: unknown
  company_name?: unknown
  career_page_url?: unknown
  target_role_lane?: unknown
}

type ScanPayload = {
  idempotency_key?: unknown
  companies?: unknown
}

type ParsedCompany = {
  company_key: string
  company_name: string
  career_page_url: string | null
  target_role_lane: string | null
}

function dispatchLiveBriefScan(runId: string) {
  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET
  if (!workerUrl || !workerSecret) return
  void fetch(`${workerUrl.replace(/\/$/, '')}/trigger-live-brief-scan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-worker-secret': workerSecret },
    body: JSON.stringify({ runId }),
  }).catch(() => {})
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const result = value.trim()
  return result && result.length <= maxLength ? result : null
}

function parseCompanies(value: unknown): { companies?: ParsedCompany[]; error?: string } {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    return { error: 'companies must contain between 1 and 10 selected companies' }
  }

  const companies: ParsedCompany[] = []
  const keys = new Set<string>()
  for (const company of value as SelectedCompany[]) {
    const companyKey = text(company?.company_key, 240)
    const companyName = text(company?.company_name, 240)
    if (!companyKey || !companyName || keys.has(companyKey)) {
      return { error: 'each company needs a unique company_key and company_name' }
    }
    keys.add(companyKey)
    companies.push({
      company_key: companyKey,
      company_name: companyName,
      career_page_url: text(company?.career_page_url, 500),
      target_role_lane: text(company?.target_role_lane, 240),
    })
  }
  return { companies }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefStaffAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  const admin = createAdminClient()
  const { data: run, error: runError } = await admin
    .from('live_brief_scan_runs')
    .select('id,request_id,status,selected_company_count,completed_company_count,blocked_company_count,failed_company_count,accepted_partial_at,started_at,completed_at,created_at')
    .eq('request_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (runError) return NextResponse.json({ error: 'Unable to load scan status' }, { status: 500 })
  if (!run) return NextResponse.json({ error: 'Scan run not found' }, { status: 404 })

  const { data: companies, error: companiesError } = await admin
    .from('live_brief_scan_companies')
    .select('id,company_key,company_name,career_page_url,target_role_lane,status,evidence_summary,error_class,observed_at')
    .eq('run_id', run.id)
    .order('created_at', { ascending: true })

  if (companiesError) return NextResponse.json({ error: 'Unable to load company scan status' }, { status: 500 })
  return NextResponse.json({ run, companies: companies ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  let payload: ScanPayload
  try {
    payload = await request.json() as ScanPayload
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const idempotencyKey = typeof payload?.idempotency_key === 'string' && UUID_PATTERN.test(payload.idempotency_key)
    ? payload.idempotency_key
    : crypto.randomUUID()
  const parsedCompanies = parseCompanies(payload?.companies)
  if (parsedCompanies.error) return NextResponse.json({ error: parsedCompanies.error }, { status: 400 })

  const admin = createAdminClient()
  const { data: existingRun, error: existingError } = await admin
    .from('live_brief_scan_runs')
    .select('id,status')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existingError) return NextResponse.json({ error: 'Unable to check scan idempotency' }, { status: 500 })
  if (existingRun) return NextResponse.json({ run_id: existingRun.id, status: existingRun.status, idempotent: true })

  const { data: current, error: requestError } = await admin
    .from('live_brief_requests')
    .select('status,reviewed_profile')
    .eq('id', id)
    .maybeSingle()
  if (requestError) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })
  if (!current.reviewed_profile || Object.keys(current.reviewed_profile).length === 0) {
    return NextResponse.json({ error: 'A reviewed profile is required before scanning' }, { status: 409 })
  }

  const { data: run, error: runError } = await admin
    .from('live_brief_scan_runs')
    .insert({
      request_id: id,
      idempotency_key: idempotencyKey,
      created_by_user_id: auth.userId,
      selected_company_count: parsedCompanies.companies!.length,
    })
    .select('id,status')
    .single()
  if (runError || !run?.id) return NextResponse.json({ error: 'Unable to create scan run' }, { status: 500 })

  const { error: companiesError } = await admin
    .from('live_brief_scan_companies')
    .insert(parsedCompanies.companies!.map((company) => ({ ...company, run_id: run.id })))
  if (companiesError) {
    await admin.from('live_brief_scan_runs').delete().eq('id', run.id)
    return NextResponse.json({ error: 'Unable to queue selected companies' }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from('live_brief_requests')
    .update({ status: 'scanning' })
    .eq('id', id)
  if (updateError) {
    await admin.from('live_brief_scan_runs').delete().eq('id', run.id)
    return NextResponse.json({ error: 'Unable to start scan request' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      actor_user_id: auth.userId,
      event_type: 'scan_started',
      idempotency_key: crypto.randomUUID(),
      event_payload: { run_id: run.id, selected_company_count: parsedCompanies.companies!.length },
    })
  if (eventError) {
    await admin.from('live_brief_requests').update({ status: current.status }).eq('id', id)
    await admin.from('live_brief_scan_runs').delete().eq('id', run.id)
    return NextResponse.json({ error: 'Scan start event could not be recorded' }, { status: 500 })
  }

  dispatchLiveBriefScan(run.id)
  return NextResponse.json({ run_id: run.id, status: run.status, idempotent: false }, { status: 202 })
}