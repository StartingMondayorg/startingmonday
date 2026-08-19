import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlacedProofActions } from '@/lib/placed-proof-architecture'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Congratulations - Starting Monday' }

export default async function PlacedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('user_profiles').select('full_name, placement_company').eq('user_id', user.id).single(),
    supabase.from('users').select('subscription_status, subscription_tier').eq('id', user.id).single(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const company = profile?.placement_company
  const isTrialing = userRow?.subscription_status === 'trialing'
  const isActive = userRow?.subscription_status === 'active'
  const tier = userRow?.subscription_tier ?? 'free'
  const proofActions = getPlacedProofActions()

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <header className="px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
          <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
        </Link>
        <Link href="/dashboard" className="text-[12px] text-slate-400 hover:text-slate-200 transition-colors">
          Back to dashboard
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">

          <p className="text-[13px] text-slate-500 mb-4">You did it.</p>
          <h1 className="text-[36px] font-bold text-white leading-tight mb-4">
            Congratulations, {firstName}.
          </h1>

          {company ? (
            <p className="text-[16px] text-slate-300 leading-relaxed mb-6">
              The offer from <span className="text-white font-semibold">{company}</span> is a real accomplishment.
              Running a senior-level search well takes discipline. You ran yours.
            </p>
          ) : (
            <p className="text-[16px] text-slate-300 leading-relaxed mb-6">
              Accepting an offer at this level takes discipline and persistence.
              You earned this.
            </p>
          )}

          <p className="text-[14px] text-slate-400 leading-relaxed mb-8">
            Your account, companies, contacts, and research history are all still here.
            Most executives search again within three years. When you are ready, everything you built will be waiting.
          </p>

          {/* Stay in the market quietly */}
          {isActive && tier !== 'free' && (
            <Card variant="glass" className="px-5 py-5 mb-8">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-2">Stay in the market</p>
              <p className="text-[15px] font-semibold text-white mb-2 leading-snug">
                Most executives keep one eye on the market after they land.
              </p>
              <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                Monitor ($49/month) keeps your target companies under surveillance without the pipeline and prep features.
                No active search required. Just signal monitoring, delivered weekly.
              </p>
              <Button render={<Link href="/settings/billing" />} className="text-[13px]">
                Switch to Monitor →
              </Button>
            </Card>
          )}

          {/* What to do next */}
          <div className="flex flex-col gap-3 mb-10">
            {isTrialing && tier === 'free' && (
              <Button render={<Link href="/settings/billing" />} className="w-full justify-center text-[14px] py-3.5 h-auto">
                Stay sharp - upgrade to Monitor ($49/mo)
              </Button>
            )}
            <Button render={<Link href="/dashboard" />} variant="outline" className="w-full justify-center text-[14px] py-3.5 h-auto">
              Go to my dashboard
            </Button>
          </div>

          <p className="text-[12px] text-slate-600 leading-relaxed">
            Questions? Reply to the congratulations email or reach Rich directly at
            {' '}<a href="mailto:richard@startingmonday.app" className="text-slate-400 hover:text-slate-200">richard@startingmonday.app</a>.
          </p>

          <Card variant="glass" id="peer-referral" className="mt-10 px-5 py-5">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-2">Sprint 7 scaffold</p>
            <p className="text-[14px] text-slate-300 mb-4">Placed proof architecture checkpoints</p>
            <ul className="space-y-3">
              {proofActions.map((action) => (
                <li key={action.id}>
                  <Card variant="glass" className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-slate-100 mb-1">{action.title}</p>
                    <p className="text-[12px] text-slate-400 mb-2">{action.description}</p>
                    {action.isEnabled ? (
                      <Button render={<Link href={action.href} />} variant="link" className="text-[12px] h-auto p-0">
                        Open action →
                      </Button>
                    ) : (
                      <p className="text-[12px] text-slate-500">{action.disabledReason}</p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </Card>

        </div>
      </main>
    </div>
  )
}
