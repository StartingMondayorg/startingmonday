import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const [
    { data: profile },
    { data: companies },
    { data: contacts },
    { data: followUps },
    { data: signals },
    { data: briefs },
  ] = await Promise.all([
    supabase.from('user_profiles').select('full_name, current_title, current_company, role_type, search_persona, target_titles, target_sectors, target_locations, positioning_summary, beyond_resume, linkedin_url, resume_text, briefing_time, briefing_days, briefing_email, career_history_json, role_context, updated_at').eq('user_id', user.id).single(),
    supabase.from('companies').select('name, sector, stage, notes, interview_notes, created_at').eq('user_id', user.id).is('archived_at', null).order('created_at', { ascending: false }),
    supabase.from('contacts').select('name, title, firm, channel, email, linkedin_url, notes, contacted_at, created_at').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('follow_ups').select('action, due_date, status, created_at').eq('user_id', user.id).order('due_date', { ascending: true }),
    supabase.from('company_signals').select('signal_type, signal_summary, signal_date').eq('user_id', user.id).order('signal_date', { ascending: false }).limit(100),
    supabase.from('briefs').select('type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: { email: user.email },
    profile: profile ?? null,
    companies: companies ?? [],
    contacts: contacts ?? [],
    follow_ups: followUps ?? [],
    company_signals: signals ?? [],
    briefs: briefs ?? [],
  }

  const filename = `startingmonday-export-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
