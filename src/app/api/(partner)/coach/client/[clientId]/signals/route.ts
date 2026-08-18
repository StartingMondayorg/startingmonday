import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { verifyCoachAccess, logCoachAccess } from '@/lib/coach-access'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { clientId } = await params
  const { userId: coachId } = auth

  // Verify coach has access
  const { hasAccess } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this client' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

  // Fetch signals
  const { data, error } = await supabase
    .from('company_signals')
    .select(
      `
      id,
      company_id,
      companies(name),
      signal_type,
      signal_summary,
      signal_date,
      source_url,
      created_at
    `
    )
    .eq('user_id', clientId)
    .order('signal_date', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }

  await logCoachAccess(coachId, clientId, 'company_signals', clientId, 'view')

  return NextResponse.json({ data }, { status: 200, headers: auth.response.headers })
}
