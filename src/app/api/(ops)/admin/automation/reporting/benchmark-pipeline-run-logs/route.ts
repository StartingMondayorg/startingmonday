import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type JobStatus = 'ok' | 'late' | 'failed'

type ProofAssetRow = {
  asset_key: string
  status: 'draft' | 'published' | 'archived'
  metric_definition: string | null
  denominator: number | null
  timeframe: string | null
  confidence_label: 'high' | 'medium' | 'directional' | null
  extraction_date: string | null
}

type Tier1ClaimRow = {
  claim_key: string
  status: 'draft' | 'active' | 'archived'
  metric_definition: string | null
  denominator: number | null
  timeframe: string | null
  confidence_label: 'high' | 'medium' | 'directional' | null
  audit_status: 'pending' | 'compliant' | 'non_compliant'
}

const benchmarkRunLogSchema = z.object({
  freshnessSlaHours: z.number().min(1).max(168).optional(),
})

const JOB_NAME = 'emi-benchmark-pipeline'

function computeFreshnessHours(latestExtractionDate: string | null): number | null {
  if (!latestExtractionDate) return null
  const extractedAt = new Date(`${latestExtractionDate}T00:00:00.000Z`)
  return Math.round(((Date.now() - extractedAt.getTime()) / (1000 * 60 * 60)) * 100) / 100
}

function toStatus(opts: {
  freshnessHours: number | null
  freshnessSlaHours: number
  invalidProofAssets: number
  invalidClaims: number
  publishedProofAssets: number
  activeClaims: number
}): JobStatus {
  if (opts.invalidProofAssets > 0 || opts.invalidClaims > 0 || opts.publishedProofAssets === 0 || opts.activeClaims === 0) {
    return 'failed'
  }
  if (opts.freshnessHours === null || opts.freshnessHours > opts.freshnessSlaHours) {
    return 'late'
  }
  return 'ok'
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, benchmarkRunLogSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const freshnessSlaHours = Number(body.freshnessSlaHours ?? 24)
    const [{ data: proofAssetRows, error: proofAssetError }, { data: tier1ClaimRows, error: tier1ClaimError }] = await Promise.all([
      sb.from('proof_assets').select('asset_key,status,metric_definition,denominator,timeframe,confidence_label,extraction_date').limit(1000),
      sb.from('tier1_claims').select('claim_key,status,metric_definition,denominator,timeframe,confidence_label,audit_status').limit(1000),
    ])

    if (proofAssetError || tier1ClaimError) {
      return NextResponse.json({ error: 'Failed to load benchmark pipeline records' }, { status: 500 })
    }

    const proofAssets = Array.isArray(proofAssetRows) ? proofAssetRows as ProofAssetRow[] : []
    const tier1Claims = Array.isArray(tier1ClaimRows) ? tier1ClaimRows as Tier1ClaimRow[] : []

    const publishedProofAssets = proofAssets.filter((row) => row.status === 'published')
    const activeClaims = tier1Claims.filter((row) => row.status === 'active')

    const invalidProofAssets = publishedProofAssets.filter((row) => (
      !row.metric_definition || row.denominator === null || !row.timeframe || !row.confidence_label
    ))
    const invalidClaims = activeClaims.filter((row) => (
      !row.metric_definition || row.denominator === null || !row.timeframe || !row.confidence_label || row.audit_status !== 'compliant'
    ))

    const latestExtractionDate = publishedProofAssets
      .map((row) => row.extraction_date)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null

    const freshnessHours = computeFreshnessHours(latestExtractionDate)
    const status = toStatus({
      freshnessHours,
      freshnessSlaHours,
      invalidProofAssets: invalidProofAssets.length,
      invalidClaims: invalidClaims.length,
      publishedProofAssets: publishedProofAssets.length,
      activeClaims: activeClaims.length,
    })

    const details = {
      freshness_sla_hours: freshnessSlaHours,
      latest_extraction_date: latestExtractionDate,
      freshness_hours: freshnessHours,
      published_proof_assets: publishedProofAssets.length,
      active_tier1_claims: activeClaims.length,
      invalid_proof_asset_count: invalidProofAssets.length,
      invalid_claim_count: invalidClaims.length,
      invalid_proof_asset_keys: invalidProofAssets.map((row) => row.asset_key),
      invalid_claim_keys: invalidClaims.map((row) => row.claim_key),
    }

    const { data } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: userId,
        job_name: JOB_NAME,
        status,
        details,
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      runId: data?.id,
      jobName: JOB_NAME,
      status,
      details,
    })
  } catch (error) {
    console.error('[reporting.benchmark-pipeline-run-logs] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
