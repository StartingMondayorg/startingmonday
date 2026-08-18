import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const lintTypecheckSchema = z.object({
  lintStatus: z.enum(['failed', 'success']).optional(),
  typecheckStatus: z.enum(['failed', 'success']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, lintTypecheckSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const lintStatus = body.lintStatus === 'failed' ? 'failed' : 'success'
    const typecheckStatus = body.typecheckStatus === 'failed' ? 'failed' : 'success'

    const { data } = await sb
      .from('lint_typecheck_runs')
      .insert({
        user_id: userId,
        lint_status: lintStatus,
        typecheck_status: typecheckStatus,
        details: {
          lint_command: 'npm run lint',
          typecheck_command: 'npx tsc --noEmit',
          source: 'ticket44',
        },
      })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, lintStatus, typecheckStatus })
  } catch (error) {
    console.error('[engineering.lint-typecheck] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
