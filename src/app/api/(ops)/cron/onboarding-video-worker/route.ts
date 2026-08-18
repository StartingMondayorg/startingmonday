import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { processOnboardingVideoRuns } from '@/lib/onboarding-video-queue'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitRaw = request.nextUrl.searchParams.get('limit')
  const limit = limitRaw ? Number(limitRaw) : 10
  const result = await processOnboardingVideoRuns({
    limit: Number.isFinite(limit) ? limit : 10,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Worker failed', result }, { status: 500 })
  }

  const admin = createAdminClient() as any
  for (const userMetrics of result.byUser ?? []) {
    const status = userMetrics.failed > 0 && userMetrics.completed === 0 ? 'failed' : 'ok'
    await admin
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: userMetrics.userId,
        job_name: 'onboarding-video-worker',
        status,
        details: {
          worker_id: result.workerId,
          processed: userMetrics.processed,
          completed: userMetrics.completed,
          failed: userMetrics.failed,
          retried: userMetrics.retried,
          limit: Number.isFinite(limit) ? limit : 10,
        },
      })
  }

  return NextResponse.json({ ok: true, result })
}
