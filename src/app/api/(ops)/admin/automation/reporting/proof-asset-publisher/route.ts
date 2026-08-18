import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type JobStatus = 'ok' | 'failed'

type ProofAssetStatus = 'draft' | 'published' | 'archived'

type ProofAssetRow = {
  asset_key: string
  title: string
  status: ProofAssetStatus
  metric_definition: string | null
  denominator: number | null
  timeframe: string | null
  confidence_label: 'high' | 'medium' | 'directional' | null
  source_artifact_path: string | null
  query_owner: string | null
  extraction_date: string | null
  published_at: string | null
  updated_at?: string | null
}

const assetSchema = z.object({
  assetKey: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  metricDefinition: z.string().min(1),
  denominator: z.number().int().positive(),
  timeframe: z.string().min(1),
  confidenceLabel: z.enum(['high', 'medium', 'directional']),
  sourceArtifactPath: z.string().min(1),
  queryOwner: z.string().min(1),
  extractionDate: z.string().date(),
  publishedAt: z.string().datetime().optional(),
})

const publishSchema = z.object({
  assets: z.array(assetSchema).default([]),
})

const JOB_NAME = 'proof-asset-publisher-workflow'

const DEFAULT_ASSETS: Array<z.infer<typeof assetSchema>> = [
  {
    assetKey: 'emi_recovery_velocity_benchmark',
    title: 'EMI Recovery Velocity Benchmark',
    status: 'published',
    metricDefinition: 'day-3 protocol completion and day-7 return relationship',
    denominator: 214,
    timeframe: 'trailing 45 days ending 2026-05-25',
    confidenceLabel: 'medium',
    sourceArtifactPath: 'docs/strategy/emi-sprints/artifacts/sprint-5-proof-asset-01-recovery-velocity.md',
    queryOwner: 'Content and Data',
    extractionDate: '2026-05-25',
    publishedAt: '2026-05-25T00:00:00.000Z',
  },
  {
    assetKey: 'emi_cadence_day7_benchmark',
    title: 'Cadence Adherence and Day-7 Return Benchmark',
    status: 'published',
    metricDefinition: 'first-week action adherence and day-7 return',
    denominator: 389,
    timeframe: 'trailing 60 days ending 2026-05-25',
    confidenceLabel: 'high',
    sourceArtifactPath: 'docs/strategy/emi-sprints/artifacts/sprint-5-proof-asset-02-cadence-day7.md',
    queryOwner: 'Content and Data',
    extractionDate: '2026-05-25',
    publishedAt: '2026-05-25T00:00:00.000Z',
  },
  {
    assetKey: 'emi_coach_uplift_benchmark',
    title: 'Coach-Linked Momentum Uplift Benchmark',
    status: 'published',
    metricDefinition: 'weekly action completion rate',
    denominator: 300,
    timeframe: 'trailing 30 days ending 2026-05-25',
    confidenceLabel: 'directional',
    sourceArtifactPath: 'docs/strategy/emi-sprints/artifacts/sprint-5-proof-asset-03-coach-uplift.md',
    queryOwner: 'Content and Partnerships',
    extractionDate: '2026-05-25',
    publishedAt: '2026-05-25T00:00:00.000Z',
  },
]

function normalizePublishTimestamp(status: ProofAssetStatus, publishedAt?: string): string | null {
  if (status !== 'published') return null
  return publishedAt ?? new Date().toISOString()
}

function toSummary(rows: ProofAssetRow[]) {
  const published = rows.filter((row) => row.status === 'published').length
  const drafts = rows.filter((row) => row.status === 'draft').length
  const archived = rows.filter((row) => row.status === 'archived').length

  return {
    total: rows.length,
    published,
    drafts,
    archived,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsedBody = await parseAutomationBody(request, publishSchema)
    if (!parsedBody.ok) return parsedBody.response

    const sb = asLooseSupabaseClient(auth.supabase)
    const assets = parsedBody.body.assets.length > 0 ? parsedBody.body.assets : DEFAULT_ASSETS
    const normalizedRows = assets.map((asset) => ({
      asset_key: asset.assetKey,
      title: asset.title,
      status: asset.status,
      metric_definition: asset.metricDefinition,
      denominator: asset.denominator,
      timeframe: asset.timeframe,
      confidence_label: asset.confidenceLabel,
      source_artifact_path: asset.sourceArtifactPath,
      query_owner: asset.queryOwner,
      extraction_date: asset.extractionDate,
      published_at: normalizePublishTimestamp(asset.status, asset.publishedAt),
    }))

    const { data, error } = await sb
      .from('proof_assets')
      .upsert(normalizedRows, { onConflict: 'asset_key' })
      .select('asset_key,title,status,metric_definition,denominator,timeframe,confidence_label,source_artifact_path,query_owner,extraction_date,published_at,updated_at')

    if (error) {
      return NextResponse.json({ error: 'Failed to publish proof assets' }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data as ProofAssetRow[] : []
    const summary = toSummary(rows)
    const status: JobStatus = summary.published > 0 ? 'ok' : 'failed'
    const details = {
      published_count: summary.published,
      draft_count: summary.drafts,
      archived_count: summary.archived,
      asset_keys: rows.map((row) => row.asset_key),
    }

    const { data: runData } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details,
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      runId: runData?.id,
      jobName: JOB_NAME,
      status,
      summary,
      assets: rows,
    })
  } catch (error) {
    console.error('[reporting.proof-asset-publisher] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const sb = asLooseSupabaseClient(auth.supabase)
    const { data, error } = await sb
      .from('proof_assets')
      .select('asset_key,title,status,metric_definition,denominator,timeframe,confidence_label,source_artifact_path,query_owner,extraction_date,published_at,updated_at')
      .order('published_at', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: 'Failed to load proof assets' }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data as ProofAssetRow[] : []

    return NextResponse.json({
      ok: true,
      summary: toSummary(rows),
      assets: rows,
    })
  } catch (error) {
    console.error('[reporting.proof-asset-publisher] history failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
