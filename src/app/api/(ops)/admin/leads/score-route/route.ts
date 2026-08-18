import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { runLeadScoringPass } from '@/lib/lead-scoring-runner'

type ScoreRequest = {
  limit?: number
  userId?: string
  dryRun?: boolean
}

async function parsePayload(request: NextRequest): Promise<ScoreRequest> {
  if (request.method !== 'POST') return {}
  try {
    const body = (await request.json()) as ScoreRequest
    return body ?? {}
  } catch {
    return {}
  }
}

async function runScoring(request: NextRequest) {
  const isCronRequest = validateCronRequest(request)
  const auth = await requireAuth(request)

  if (!auth.ok && !isCronRequest) {
    return auth.response
  }

  if (auth.ok && !isCronRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const staff = await getStaffMember(user.email ?? '')
    if (!staff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const payload = await parsePayload(request)
  const queryLimit = Number(request.nextUrl.searchParams.get('limit') ?? payload.limit ?? 500)
  const limit = Number.isFinite(queryLimit) ? Math.max(1, Math.min(queryLimit, 5000)) : 500
  const userId = request.nextUrl.searchParams.get('userId') ?? payload.userId
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1' || payload.dryRun === true

  try {
    const result = await runLeadScoringPass({
      limit,
      userId,
      dryRun,
      trigger: isCronRequest ? 'cron' : 'admin',
      initiatedByUserId: auth.ok ? auth.userId : null,
    })
    const success = NextResponse.json({
      ok: true,
      ...result,
      trigger: isCronRequest ? 'cron' : 'admin',
    })

    return auth.ok ? withAuthCookies(success, auth) : success
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to run scoring'
    const failure = NextResponse.json({ error: message }, { status: 500 })
    return auth.ok ? withAuthCookies(failure, auth) : failure
  }
}

export async function GET(request: NextRequest) {
  return runScoring(request)
}

export async function POST(request: NextRequest) {
  return runScoring(request)
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
