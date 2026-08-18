 
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { fetchOnboardingVideoRunDetails } from '@/lib/onboarding-video-queue'

const runIdSchema = z.string().uuid()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { runId } = await params
  const parsedRunId = runIdSchema.safeParse(runId)
  if (!parsedRunId.success) {
    return NextResponse.json({ error: 'Invalid run id' }, { status: 400 })
  }

  const includeEvents = request.nextUrl.searchParams.get('include_events') !== '0'
  const includeWebhookEvents = request.nextUrl.searchParams.get('include_webhooks') === '1'
  const eventLimitRaw = Number(request.nextUrl.searchParams.get('event_limit') ?? 50)
  const eventLimit = Number.isFinite(eventLimitRaw) ? eventLimitRaw : 50

  try {
    const sb = asLooseSupabaseClient(auth.supabase)
    const details = await fetchOnboardingVideoRunDetails(sb, {
      userId: auth.userId,
      runId: parsedRunId.data,
      eventLimit,
      includeRunEvents: includeEvents,
      includeWebhookEvents,
    })

    if (!details.run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      run: details.run,
      events: details.events,
      webhook_events: details.webhookEvents,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch onboarding video run details' },
      { status: 500 },
    )
  }
}
