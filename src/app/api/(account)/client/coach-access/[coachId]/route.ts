import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { coachId } = await params
  const { userId: clientId } = auth

  const supabase = await createClient()

  const { data: seat } = await supabase
    .from('team_seats')
    .select('id')
    .eq('owner_id', coachId)
    .eq('member_user_id', clientId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!seat) {
    return NextResponse.json({ error: 'Coach relationship not found' }, { status: 404 })
  }

  // Get coach access info
  const { data, error } = await supabase
    .from('coach_client_permissions')
    .select(
      `
      coach_id,
      client_id,
      access_enabled,
      access_level,
      updated_at
    `
    )
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching coach access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach access settings' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: data ?? {
      coach_id: coachId,
      client_id: clientId,
      access_enabled: true,
      access_level: 'read_write',
      updated_at: null,
    },
  }, { status: 200, headers: auth.response.headers })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { coachId } = await params
  const { userId: clientId } = auth

  const body = await request.json()
  const { coach_access_enabled, access_level } = body

  const supabase = await createClient()

  const { data: seat } = await supabase
    .from('team_seats')
    .select('id')
    .eq('owner_id', coachId)
    .eq('member_user_id', clientId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!seat) {
    return NextResponse.json({ error: 'Coach relationship not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('coach_client_permissions')
    .upsert({
      coach_id: coachId,
      client_id: clientId,
      access_enabled: Boolean(coach_access_enabled),
      access_level: access_level || 'read_write',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id,client_id' })

  if (error) {
    console.error('Error updating coach access:', error)
    return NextResponse.json(
      { error: 'Failed to update coach access' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true },
    { status: 200, headers: auth.response.headers }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { coachId } = await params
  const { userId: clientId } = auth

  const supabase = await createClient()

  const { error } = await supabase
    .from('coach_client_permissions')
    .upsert({
      coach_id: coachId,
      client_id: clientId,
      access_enabled: false,
      access_level: 'read_only',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id,client_id' })

  if (error) {
    console.error('Error revoking coach access:', error)
    return NextResponse.json(
      { error: 'Failed to revoke coach access' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true },
    { status: 200, headers: auth.response.headers }
  )
}
