import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { processOutreachSendJobs } from '@/lib/outreach/send-queue'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitRaw = request.nextUrl.searchParams.get('limit')
  const limit = limitRaw ? Number(limitRaw) : 10
  const result = await processOutreachSendJobs({
    limit: Number.isFinite(limit) ? limit : 10,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Worker failed', result }, { status: 500 })
  }

  return NextResponse.json({ ok: true, result })
}
