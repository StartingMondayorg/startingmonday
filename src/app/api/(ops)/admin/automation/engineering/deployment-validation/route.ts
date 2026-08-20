import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const deploymentValidationSchema = z.object({
  environment: z.string().trim().toLowerCase().default('production'),
  apiHealth: z.boolean().optional(),
  dbHealth: z.boolean().optional(),
  jobsHealth: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, deploymentValidationSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const environment = body.environment
    const checks = {
      api_health: body.apiHealth !== false,
      db_health: body.dbHealth !== false,
      background_jobs: body.jobsHealth !== false,
    }
    const failureCount = Object.values(checks).filter(v => !v).length
    const status = failureCount === 0 ? 'healthy' : failureCount === 1 ? 'degraded' : 'unknown'

    const { data } = await sb
      .from('deployment_validation_runs')
      .insert({ user_id: userId, environment, status, details: checks })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, environment, status, checks })
  } catch (error) {
    console.error('[engineering.deployment-validation] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
