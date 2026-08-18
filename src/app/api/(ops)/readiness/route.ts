import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'

export const dynamic = 'force-dynamic'

type Check = {
  ok: boolean
  detail?: string
  latencyMs?: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const checks: Record<string, Check> = {
    env_supabase_url: { ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    env_supabase_service_key: { ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
  }

  if (checks.env_supabase_url.ok && checks.env_supabase_service_key.ok) {
    try {
      const admin = createAdminClient()
      const start = Date.now()
      const probe = await admin.from('users').select('id', { count: 'exact', head: true }).limit(1)
      const latencyMs = Date.now() - start

      checks.supabase = {
        ok: !probe.error,
        detail: probe.error?.message,
        latencyMs,
      }
    } catch (error) {
      checks.supabase = {
        ok: false,
        detail: error instanceof Error ? error.message : 'supabase_probe_failed',
      }
    }
  } else {
    checks.supabase = {
      ok: false,
      detail: 'missing_supabase_env',
    }
  }

  const failing = Object.entries(checks)
    .filter(([, check]) => !check.ok)
    .map(([name]) => name)

  const ready = failing.length === 0

  return NextResponse.json(
    {
      kind: 'readiness',
      ready,
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
      failing,
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
