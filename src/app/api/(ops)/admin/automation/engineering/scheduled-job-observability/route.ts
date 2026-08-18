import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type JobStatus = 'ok' | 'late' | 'failed'

function toStatus(lastRunMinutesAgo: number, failed: boolean): JobStatus {
  if (failed) return 'failed'
  if (lastRunMinutesAgo > 20) return 'late'
  return 'ok'
}

const scheduledJobSchema = z.object({
  jobName: z.string().optional(),
  lastRunMinutesAgo: z.number().optional(),
  failed: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, scheduledJobSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const jobName = (body.jobName ?? 'automation-worker').toString().trim().slice(0, 120)
    const lastRunMinutesAgo = Math.max(0, Number(body.lastRunMinutesAgo ?? 0))
    const failed = body.failed === true
    const status = toStatus(lastRunMinutesAgo, failed)

    const { data } = await sb
      .from('scheduled_job_observability_runs')
      .insert({ user_id: userId, job_name: jobName, status, details: { last_run_minutes_ago: lastRunMinutesAgo, failed } })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, jobName, status })
  } catch (error) {
    console.error('[engineering.scheduled-job-observability] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
