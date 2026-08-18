import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const emails = (Array.isArray(body?.emails) ? body.emails : [])
    .map((e: unknown) => (e ?? '').toString().trim().toLowerCase())
    .filter((e: string) => e.includes('@'))

  if (emails.length === 0) {
    return NextResponse.json({ error: 'At least one valid email is required.' }, { status: 400 })
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('email, outreach_status, contacted_at, name')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching contact statuses:', error)
    return NextResponse.json({ error: 'Database query failed.' }, { status: 500 })
  }

  const emailSet = new Set(emails)
  const statusByEmail = new Map<string, { outreach_status: string | null; contacted_at: string | null; name: string | null }>()
  for (const contact of contacts ?? []) {
    const normalized = contact.email?.toLowerCase()
    if (normalized && emailSet.has(normalized)) {
      statusByEmail.set(normalized, {
        outreach_status: contact.outreach_status,
        contacted_at: contact.contacted_at,
        name: contact.name,
      })
    }
  }

  return NextResponse.json({ statusByEmail: Object.fromEntries(statusByEmail) })
}
