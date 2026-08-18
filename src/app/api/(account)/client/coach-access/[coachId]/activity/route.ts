import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { coachId } = await params
  const clientId = auth.userId
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coach_access_logs')
    .select('id, table_name, action, created_at')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: 'Failed to load coach activity' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] }, { status: 200, headers: auth.response.headers })
}
