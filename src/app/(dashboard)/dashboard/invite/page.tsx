import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { InviteClient } from './invite-client'
import { Card } from '@/components/ui'
export const metadata = { title: 'Invite - Starting Monday' }

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, invite_code')
    .eq('user_id', user.id)
    .single()

  // Count referrals
  let referralCount = 0
  if (profile?.invite_code) {
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.invite_code)
    referralCount = count ?? 0
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
  const inviteUrl = profile?.invite_code
    ? `${appUrl}/invite/${profile.invite_code}`
    : null

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-[26px] font-bold text-foreground mb-1">Invite colleagues</h1>
        <p className="text-[13px] text-muted-foreground mb-8">
          Share your personal link. Anyone who signs up through it starts with a 30-day free trial.
        </p>

        <InviteClient
          userId={user.id}
          existingUrl={inviteUrl}
          referralCount={referralCount}
          firstName={profile?.full_name?.split(' ')[0] ?? null}
        />

        <Card className="mt-10 p-6">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Why invite people?</p>
          <div className="flex flex-col gap-3">
            {[
              'The best searches are run in community - peers share intel, warm intros, and honest feedback.',
              'When someone in your network lands through your referral, that relationship compounds.',
              'The platform gets better as more of your actual peer group uses it.',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[11px] font-bold text-muted-foreground shrink-0 w-4 mt-0.5">{i + 1}</span>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
