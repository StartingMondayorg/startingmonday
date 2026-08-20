import { createClient } from '@/lib/supabase/server'

export interface ActivationStatus {
  a1_resume: boolean      // resume_text >= 200 chars OR positioning_summary >= 100 chars
  a2_company: boolean     // at least one active company in pipeline
  a3_prep_brief: boolean  // at least one prep brief generated (type='prep')
  a4_contact: boolean     // at least one contact added
  a5_briefing: boolean    // briefing_time configured
  a6_follow_up: boolean   // at least one follow-up reminder set
  completedCount: number
  isComplete: boolean
}

export async function getActivationStatus(userId: string): Promise<ActivationStatus> {
  const supabase = await createClient()

  const [
    { data: profile },
    { count: companyCount },
    { count: prepBriefCount },
    { count: contactCount },
    { count: followUpCount },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('resume_text, positioning_summary, briefing_time')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('archived_at', null),
    supabase
      .from('briefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'prep'),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const a1 = (profile?.resume_text?.length ?? 0) >= 200
    || (profile?.positioning_summary?.length ?? 0) >= 100
  const a2 = (companyCount ?? 0) >= 1
  const a3 = (prepBriefCount ?? 0) >= 1
  const a4 = (contactCount ?? 0) >= 1
  const a5 = !!profile?.briefing_time
  const a6 = (followUpCount ?? 0) >= 1

  const flags = [a1, a2, a3, a4, a5, a6]
  const completedCount = flags.filter(Boolean).length

  return {
    a1_resume: a1,
    a2_company: a2,
    a3_prep_brief: a3,
    a4_contact: a4,
    a5_briefing: a5,
    a6_follow_up: a6,
    completedCount,
    isComplete: completedCount === 6,
  }
}
