/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const admin = createAdminClient() as any

  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: latestRun }, { count: sourceCount }, { count: failureCount }, { data: recentFailures }] = await Promise.all([
    admin
      .from('executive_research_refresh_runs')
      .select('id, run_started_at, run_finished_at, checked_count, changed_count, failed_count, notes')
      .order('run_started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('executive_research_library').select('id', { count: 'exact', head: true }),
    admin.from('executive_research_library').select('id', { count: 'exact', head: true }).not('fetch_error', 'is', null),
    admin
      .from('executive_research_library')
      .select('source_key, source_title, fetch_error, last_checked_at')
      .not('fetch_error', 'is', null)
      .order('last_checked_at', { ascending: false })
      .limit(5),
  ])

  const lastRunHoursAgo = latestRun?.run_started_at
    ? Math.round((Date.now() - new Date(latestRun.run_started_at).getTime()) / 3_600_000)
    : null

  const status = !latestRun
    ? 'missing'
    : latestRun.failed_count > 0
      ? 'degraded'
      : lastRunHoursAgo !== null && lastRunHoursAgo > 8 * 24
        ? 'stale'
        : 'healthy'

  return NextResponse.json({
    ok: true,
    status,
    sourceCount: sourceCount ?? 0,
    failureCount: failureCount ?? 0,
    lastRunHoursAgo,
    latestRun,
    recentFailures: recentFailures ?? [],
  })
}
