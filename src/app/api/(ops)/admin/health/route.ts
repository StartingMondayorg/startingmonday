import { createClient as createServiceClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { validateInternalRouteRequest } from '@/lib/internal-route-auth'

export async function GET(request: NextRequest) {
  if (!validateInternalRouteRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: pingError } = await supabase.from('users').select('id').limit(1)
  if (pingError) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'health_check', ok: false, db: 'unreachable', error: pingError.message }))
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
