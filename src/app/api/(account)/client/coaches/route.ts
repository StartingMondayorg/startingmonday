import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()

  const { data: seats, error } = await supabase
    .from('team_seats')
    .select(
      `
      id,
      owner_id,
      member_email,
      access_level,
      access_granted_at,
      last_accessed_at,
      status
    `
    )
    .eq('member_user_id', userId)
    .eq('status', 'accepted')

  if (error) {
    console.error('Error fetching coaches:', error)
    return NextResponse.json({ data: [], degraded: true }, { status: 200, headers: auth.response.headers })
  }

  const coachIds = (seats ?? []).map((s) => s.owner_id)
  const { data: permissions } = await supabase
    .from('coach_client_permissions')
    .select('coach_id, access_enabled, access_level, updated_at')
    .eq('client_id', userId)
    .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000'])

  const { data: coachProfiles } = await supabase
    .from('coach_profiles')
    .select('coach_id, display_name')
    .in('coach_id', coachIds.length ? coachIds : ['00000000-0000-0000-0000-000000000000'])

  const permissionMap = new Map((permissions ?? []).map((p) => [p.coach_id, p]))
  const profileMap = new Map((coachProfiles ?? []).map((p) => [p.coach_id, p]))
  const data = (seats ?? []).map((seat) => {
    const permission = permissionMap.get(seat.owner_id)
    const profile = profileMap.get(seat.owner_id)
    return {
      id: seat.id,
      coach_id: seat.owner_id,
      member_email: profile?.display_name || 'Coach account',
      coach_name: profile?.display_name || null,
      coach_access_enabled: permission ? permission.access_enabled : true,
      access_level: permission?.access_level ?? seat.access_level ?? 'read_write',
      access_granted_at: permission?.updated_at ?? seat.access_granted_at,
      last_accessed_at: seat.last_accessed_at,
      status: seat.status,
    }
  })

  return NextResponse.json({ data }, { status: 200, headers: auth.response.headers })
}
