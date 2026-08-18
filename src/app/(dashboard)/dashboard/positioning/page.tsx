import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { LogoutButton } from '../logout-button'
import { PositioningCoach } from './positioning-coach'

export default async function PositioningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type PositioningProfile = {
    full_name: string | null
    current_title: string | null
    current_company: string | null
    target_titles: string[] | null
    resume_text: string | null
    positioning_summary: string | null
    beyond_resume: string | null
  }

  const [{ data: rawProfile }, sub] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, current_title, current_company, target_titles, resume_text, positioning_summary, beyond_resume')
      .eq('user_id', user.id)
      .single(),
    getUserSubscription(user.id),
  ])
  const profile = rawProfile as PositioningProfile | null

  const canAccess = canAccessFeature(sub, 'positioning_coach')

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 hover:text-slate-300 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[12px] text-slate-300 hover:text-white transition-colors">
              Back to dashboard
            </Link>
            <div className="hidden sm:block">
              <LogoutButton label="Sign out" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">Positioning Coach</p>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Refine your executive story.</h1>
          <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
            Multi-turn coaching session for pivot framing, level jumps, and gap coaching. Your positioning statement is used in every prep brief, briefing, and outreach draft.
          </p>
        </div>

        {!canAccess ? (
          <div className="bg-slate-900 rounded p-6 sm:p-8 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Search plan required</p>
            <h2 className="text-[20px] font-bold text-white leading-tight mb-3">
              Positioning Coach is a Search feature.
            </h2>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              Upgrade to Search to work with a coach on your positioning statement, pivot framing, and executive narrative.
            </p>
            <Link
              href="/settings/billing"
              className="inline-block text-[14px] font-semibold text-slate-900 bg-white hover:bg-slate-100 px-6 py-3 rounded transition-colors"
            >
              Upgrade to Search
            </Link>
          </div>
        ) : (
          <PositioningCoach
            currentPositioning={profile?.positioning_summary ?? ''}
            context={{
              currentTitle:        profile?.current_title ?? '',
              currentCompany:      profile?.current_company ?? '',
              targetTitles:        (profile?.target_titles as string[] | null) ?? [],
              resumeText:          profile?.resume_text ?? '',
              positioningSummary:  profile?.positioning_summary ?? '',
              beyondResume:        profile?.beyond_resume ?? '',
            }}
          />
        )}
      </main>
    </div>
  )
}

