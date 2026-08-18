import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const payloadSchema = z.object({
  weekEnding: z.string().date().optional(),
  ownerMap: z.record(z.string(), z.string()).optional(),
})

const SPRINT_KEY = 'sprint_6_q4_operating_cadence'
const JOB_NAME = 'emi-q4-cadence-automation'
const REQUIRED_RITUALS = [
  'weekly_scorecard_review',
  'weekly_objection_panel_review',
  'weekly_reliability_pulse',
  'monthly_operating_review',
] as const

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsed = await parseAutomationBody(request, payloadSchema)
    if (!parsed.ok) return parsed.response

    const body = parsed.body
    const sb = asLooseSupabaseClient(auth.supabase)
    const ownerMap = body.ownerMap ?? {
      weekly_scorecard_review: 'Founder Office',
      weekly_objection_panel_review: 'GTM Ops',
      weekly_reliability_pulse: 'Engineering + SRE',
      monthly_operating_review: 'PMO',
    }

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      week_ending: body.weekEnding ?? null,
      rituals: REQUIRED_RITUALS.map((ritual) => ({
        key: ritual,
        owner: ownerMap[ritual] ?? 'Unassigned',
        status: 'scheduled',
      })),
      owner_map: ownerMap,
    }

    const { data: exportRun } = await sb
      .from('emi_sprint_export_runs')
      .insert({
        user_id: auth.userId,
        sprint_key: SPRINT_KEY,
        export_payload: payload,
      })
      .select('id')
      .single()

    const status = payload.rituals.every((ritual) => ritual.owner !== 'Unassigned') ? 'ok' : 'failed'

    const { data: obsRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          sprint_key: SPRINT_KEY,
          ritual_count: payload.rituals.length,
          assigned_ritual_count: payload.rituals.filter((ritual) => ritual.owner !== 'Unassigned').length,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: status === 'ok',
      sprintKey: SPRINT_KEY,
      runId: obsRun?.id ?? null,
      exportRunId: exportRun?.id ?? null,
      status,
      payload,
    })
  } catch (error) {
    console.error('[reporting.q4-cadence-automation] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
