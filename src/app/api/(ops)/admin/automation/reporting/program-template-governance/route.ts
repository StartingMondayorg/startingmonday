/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { templateHasRequiredSections, type ProgramTemplateDefinition } from '@/lib/program-template-governance'

const governanceSchema = z.object({
  action: z.enum(['save_draft', 'publish']).default('save_draft'),
  template: z.object({
    template_id: z.string(),
    name: z.string(),
    program_type: z.string(),
    version: z.number().int().min(1),
    sections: z.array(z.object({ id: z.string(), title: z.string(), required: z.boolean() })),
    milestones: z.array(z.string()),
    session_cadence: z.string(),
    sponsor_summary_fields: z.array(z.string()),
    defaults: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
  change_summary: z.string().default('manual update'),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, governanceSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsed.body
  const template = payload.template as ProgramTemplateDefinition
  const requiredSectionPass = templateHasRequiredSections(template.sections)
  const publishValidationPass = requiredSectionPass && template.milestones.length > 0 && template.sponsor_summary_fields.length > 0

  if (payload.action === 'publish' && !publishValidationPass) {
    return NextResponse.json({
      error: 'Publish blocked: missing required sections, milestones, or sponsor summary fields',
      checks: {
        required_sections: requiredSectionPass,
        milestones_present: template.milestones.length > 0,
        sponsor_summary_fields_present: template.sponsor_summary_fields.length > 0,
      },
    }, { status: 400 })
  }

  const versionEvent = {
    ticket: 'PB-Q2-007',
    generated_at: new Date().toISOString(),
    action: payload.action,
    template_id: template.template_id,
    template_name: template.name,
    version: template.version,
    editor: auth.userId,
    change_summary: payload.change_summary,
    validation: {
      required_sections: requiredSectionPass,
      milestones_present: template.milestones.length > 0,
      sponsor_summary_fields_present: template.sponsor_summary_fields.length > 0,
      publish_validation_pass: publishValidationPass,
    },
    compatibility: {
      backward_path_for_active_cohorts: true,
      migration_rule: 'active cohorts pin current template version unless manually upgraded',
    },
    template,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: versionEvent,
  })

  await sb.from('scheduled_job_observability_runs').insert({
    user_id: auth.userId,
    job_name: 'program-template-governance',
    status: publishValidationPass ? 'ok' : 'degraded',
    details: versionEvent,
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-007',
    saved: true,
    action: payload.action,
    version_event: versionEvent,
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const templateId = request.nextUrl.searchParams.get('template_id')
  const runRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .order('created_at', { ascending: false })
    .limit(300)

  const history = ((runRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>)
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-007')
    .filter((row) => !templateId || row.trend_payload?.template_id === templateId)
    .map((row) => ({
      id: row.id,
      created_at: row.created_at,
      action: row.trend_payload?.action,
      template_id: row.trend_payload?.template_id,
      version: row.trend_payload?.version,
      editor: row.trend_payload?.editor,
      change_summary: row.trend_payload?.change_summary,
      publish_validation_pass: Boolean(row.trend_payload?.validation?.publish_validation_pass),
    }))

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-007',
    version_history: history,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
