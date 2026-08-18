import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'

const MAX_COMPANIES = 8

function parseCompanyNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const names: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const name = entry.trim()
    if (!name || name.length > 120) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
    if (names.length >= MAX_COMPANIES) break
  }
  return names
}

// POST /api/onboarding/scan
// Creates company records from onboarding and kicks off the first on-demand
// scan pass (career page scan where possible plus signal refresh) via the
// worker's trigger endpoints. Recurring scans are handled by the scheduled
// scan job once these companies exist.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { companyNames?: unknown }
  const companyNames = parseCompanyNames(body.companyNames)
  if (companyNames.length === 0) {
    return NextResponse.json({ error: 'At least one company name is required' }, { status: 400 })
  }

  const rows = companyNames.map(name => ({
    user_id: user.id,
    name,
    stage: 'target',
  }))
  const { error: upsertError } = await supabase
    .from('companies')
    .upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true })
  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save companies' }, { status: 500 })
  }

  const { data: companies, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, career_page_url')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .in('name', companyNames)
  if (fetchError) {
    return NextResponse.json({ error: 'Failed to load companies' }, { status: 500 })
  }

  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET
  let triggered = 0

  if (workerUrl && workerSecret) {
    const headers = { 'Content-Type': 'application/json', 'x-worker-secret': workerSecret }

    for (const company of companies ?? []) {
      if (company.career_page_url) {
        fetch(`${workerUrl}/trigger-scan`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ companyId: company.id, userId: user.id }),
        }).catch(err => Sentry.captureException(err, {
          extra: { context: 'onboarding-scan-trigger', companyId: company.id, userId: user.id },
        }))
      }
      triggered += 1
    }

    // One signal refresh pass covers every company for this user.
    fetch(`${workerUrl}/trigger-signals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: user.id }),
    }).catch(err => Sentry.captureException(err, {
      extra: { context: 'onboarding-signal-trigger', userId: user.id },
    }))
  }

  await logEvent(user.id, 'onboarding_step_completed', {
    action_context: 'onboarding_scan_started',
    company_count: companyNames.length,
    scans_triggered: triggered,
    worker_available: Boolean(workerUrl && workerSecret),
  })

  return NextResponse.json({
    ok: true,
    companyCount: companies?.length ?? companyNames.length,
    scansTriggered: triggered,
    workerAvailable: Boolean(workerUrl && workerSecret),
  }, { status: 202 })
}

// GET /api/onboarding/scan
// Polls first-scan progress for the current user's companies so onboarding can
// show live status while the user keeps adding companies or contacts.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id, name, career_page_url')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(25)
  if (companyError) {
    return NextResponse.json({ error: 'Failed to load companies' }, { status: 500 })
  }

  const companyIds = (companies ?? []).map(c => c.id)
  const scanByCompany = new Map<string, { status: string; matches: number }>()
  let signalCount = 0

  if (companyIds.length > 0) {
    const [{ data: scans }, { count }] = await Promise.all([
      supabase
        .from('scan_results')
        .select('company_id, status, raw_hits, scanned_at')
        .in('company_id', companyIds)
        .order('scanned_at', { ascending: false })
        .limit(companyIds.length * 3),
      supabase
        .from('company_signals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

    for (const scan of scans ?? []) {
      if (scanByCompany.has(scan.company_id)) continue
      const hits = Array.isArray(scan.raw_hits) ? scan.raw_hits as Array<{ is_match?: boolean }> : []
      scanByCompany.set(scan.company_id, {
        status: scan.status ?? 'success',
        matches: hits.filter(h => h?.is_match).length,
      })
    }
    signalCount = count ?? 0
  }

  const results = (companies ?? []).map(company => {
    const scan = scanByCompany.get(company.id)
    return {
      companyId: company.id,
      name: company.name,
      scannable: Boolean(company.career_page_url),
      status: scan ? 'complete' : (company.career_page_url ? 'scanning' : 'queued'),
      matches: scan?.matches ?? 0,
    }
  })

  const scannable = results.filter(r => r.scannable)
  const completed = scannable.filter(r => r.status === 'complete')

  return NextResponse.json({
    ok: true,
    companies: results,
    signalCount,
    progress: {
      total: results.length,
      scannable: scannable.length,
      completed: completed.length,
      done: scannable.length > 0 ? completed.length >= scannable.length : signalCount > 0,
    },
  })
}
