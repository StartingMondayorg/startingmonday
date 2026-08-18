import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'

// GET: export speakers as CSV formatted for LinkedIn Sales Navigator import.
// Excludes speakers with status 'converted' or 'not_interested' or 'skip'.
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('conference_speakers')
    .select('full_name, first_name, last_name, title, company, linkedin_url, sector, outreach_status, priority, outreach_notes, conference_appearances(conference_name, conference_year)')
    .not('outreach_status', 'in', '(converted,not_interested,skip)')
    .order('priority', { ascending: true })
    .order('full_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const speakers = data ?? []

  // Sales Navigator CSV format: First Name, Last Name, Company, LinkedIn URL
  // Plus our enrichment columns for context
  const csvRows = [
    ['First Name', 'Last Name', 'Title', 'Company', 'LinkedIn URL', 'Sector', 'Priority', 'Status', 'Last Conferences', 'Outreach Notes'],
  ]

  for (const s of speakers) {
    const firstName = s.first_name ?? s.full_name?.split(' ')[0] ?? ''
    const lastName  = s.last_name  ?? s.full_name?.split(' ').slice(1).join(' ') ?? ''
    const conferences = (s.conference_appearances ?? [])
      .sort((a: { conference_year: number }, b: { conference_year: number }) => b.conference_year - a.conference_year)
      .slice(0, 3)
      .map((a: { conference_name: string; conference_year: number }) => `${a.conference_name} ${a.conference_year}`)
      .join('; ')

    csvRows.push([
      firstName,
      lastName,
      s.title ?? '',
      s.company ?? '',
      s.linkedin_url ?? '',
      s.sector ?? '',
      String(s.priority),
      s.outreach_status,
      conferences,
      s.outreach_notes ?? '',
    ])
  }

  const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const date = new Date().toISOString().split('T')[0]

  return withAuthCookies(new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="speakers-export-${date}.csv"`,
    },
  }), auth)
}
