import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { LogoutButton } from '../logout-button'
import { PositioningCoach } from './positioning-coach'
import { Button, Card } from '@/components/ui'
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
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
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
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Positioning Coach</p>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Refine your executive story.</h1>
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
            Multi-turn coaching session for pivot framing, level jumps, and gap coaching. Your positioning statement is used in every prep brief, briefing, and outreach draft.
          </p>
        </div>

        {!canAccess ? (
          <Card className="bg-card p-6 sm:p-8 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Search plan required</p>
            <h2 className="text-[20px] font-bold text-foreground leading-tight mb-3">
              Positioning Coach is a Search feature.
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
              Upgrade to Search to work with a coach on your positioning statement, pivot framing, and executive narrative.
            </p>
            <Button render={<Link href="/settings/billing" />} variant="secondary">
              Upgrade to Search
            </Button>
          </Card>
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

