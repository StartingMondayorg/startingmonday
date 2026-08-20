import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const ciChecksSchema = z.object({
  simulateFailure: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, ciChecksSchema)
    if (!parsedBody.ok) return parsedBody.response
    const simulateFailure = parsedBody.body.simulateFailure === true

    const details = {
      checks: ['build', 'lint', 'test'],
      queued_at: new Date().toISOString(),
      source: 'ticket43',
    }

    const { data } = await sb
      .from('ci_check_runs')
      .insert({
        user_id: userId,
        status: simulateFailure ? 'failed' : 'success',
        details,
      })
      .select('id, status')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, status: data?.status })
  } catch (error) {
    console.error('[engineering.ci-checks] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
