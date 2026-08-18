import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type ProofAssetRow = {
  asset_key: string
  title: string
  status: 'draft' | 'published' | 'archived'
  confidence_label: 'high' | 'medium' | 'directional' | null
  published_at: string | null
}

type ProspectRow = {
  id: string
  stage: 'identified' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost'
  archived_at: string | null
}

const payloadSchema = z.object({
  trailingDays: z.number().int().min(7).max(180).optional(),
  referenceDate: z.string().date().optional(),
})

const JOB_NAME = 'emi-gtm-proof-sequence'
const TICKET = 'DEV-EMI-407'

function isoWindow(referenceDate?: string, trailingDays = 30) {
  const end = referenceDate ? new Date(`${referenceDate}T23:59:59.999Z`) : new Date()
  const start = new Date(end.getTime())
  start.setUTCDate(start.getUTCDate() - (trailingDays - 1))
  start.setUTCHours(0, 0, 0, 0)
  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  }
}

function stageBucket(stage: ProspectRow['stage']): 'late_stage' | 'mid_stage' {
  if (stage === 'proposal_sent' || stage === 'negotiating' || stage === 'closed_won' || stage === 'closed_lost') {
    return 'late_stage'
  }
  return 'mid_stage'
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsed = await parseAutomationBody(request, payloadSchema)
    if (!parsed.ok) return parsed.response

    const trailingDays = parsed.body.trailingDays ?? 30
    const { windowStart, windowEnd } = isoWindow(parsed.body.referenceDate, trailingDays)
    const sb = asLooseSupabaseClient(auth.supabase)

    const [{ data: assetRows, error: assetError }, { data: prospectRows, error: prospectError }] = await Promise.all([
      sb
        .from('proof_assets')
        .select('asset_key,title,status,confidence_label,published_at')
        .eq('status', 'published')
        .gte('published_at', windowStart)
        .lte('published_at', windowEnd)
        .order('published_at', { ascending: false })
        .limit(100),
      sb
        .from('b2b_prospects')
        .select('id,stage,archived_at')
        .is('archived_at', null)
        .in('stage', ['demo_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'])
        .limit(10000),
    ])

    if (assetError || prospectError) {
      return NextResponse.json({ error: 'Failed to load GTM proof sequence inputs' }, { status: 500 })
    }

    const assets = Array.isArray(assetRows) ? assetRows as ProofAssetRow[] : []
    const prospects = Array.isArray(prospectRows) ? prospectRows as ProspectRow[] : []

    const byConfidence = {
      high: assets.filter((row) => row.confidence_label === 'high').map((row) => row.asset_key),
      medium: assets.filter((row) => row.confidence_label === 'medium').map((row) => row.asset_key),
      directional: assets.filter((row) => row.confidence_label === 'directional').map((row) => row.asset_key),
    }

    const sequenceAssignments = prospects.map((prospect) => ({
      prospect_id: prospect.id,
      stage: prospect.stage,
      sequence: stageBucket(prospect.stage) === 'late_stage' ? 'proof_close_sequence' : 'proof_nurture_sequence',
      recommended_assets: stageBucket(prospect.stage) === 'late_stage'
        ? [...byConfidence.high, ...byConfidence.medium].slice(0, 3)
        : [...byConfidence.medium, ...byConfidence.directional].slice(0, 3),
    }))

    const runPayload = {
      ticket: TICKET,
      generated_at: new Date().toISOString(),
      trailing_days: trailingDays,
      window_start: windowStart,
      window_end: windowEnd,
      published_asset_count: assets.length,
      prospect_count: prospects.length,
      assignments_count: sequenceAssignments.length,
      confidence_distribution: {
        high: byConfidence.high.length,
        medium: byConfidence.medium.length,
        directional: byConfidence.directional.length,
      },
      assignments_preview: sequenceAssignments.slice(0, 25),
    }

    const { data: trendRun } = await sb
      .from('trend_report_runs')
      .insert({
        user_id: auth.userId,
        trend_payload: runPayload,
      })
      .select('id')
      .single()

    const status = assets.length > 0 && sequenceAssignments.length > 0 ? 'ok' : 'failed'
    const { data: obsRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          ticket: TICKET,
          trend_run_id: trendRun?.id ?? null,
          published_asset_count: assets.length,
          assignments_count: sequenceAssignments.length,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: status === 'ok',
      ticket: TICKET,
      trendRunId: trendRun?.id ?? null,
      runId: obsRun?.id ?? null,
      status,
      summary: {
        publishedAssetCount: assets.length,
        prospectCount: prospects.length,
        assignmentsCount: sequenceAssignments.length,
      },
    })
  } catch (error) {
    console.error('[reporting.gtm-proof-sequence] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
