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

  // Verify coach has access to this client
  const { hasAccess } = await verifyCoachAccess(coachId, clientId)
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this client' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

  // Fetch companies for the client
  const { data, error } = await supabase
    .from('companies')
    .select(
      `
      id,
      name,
      sector,
      stage,
      fit_score,
      alert_threshold,
      notes,
      last_checked_at,
      created_at,
      updated_at,
      archived_at
    `
    )
    .eq('user_id', clientId)
    .is('archived_at', null)
    .order('fit_score', { ascending: false })

  if (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }

  await logCoachAccess(coachId, clientId, 'companies', clientId, 'view')

  return NextResponse.json({ data }, { status: 200, headers: auth.response.headers })
}
