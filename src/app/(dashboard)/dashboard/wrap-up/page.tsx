import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markPlaced } from '../placed/actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata = { title: 'Search Complete -- Starting Monday' }

export default async function WrapUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('user_profiles').select('full_name, placed_at').eq('user_id', user.id).single(),
    supabase.from('users').select('subscription_status, subscription_tier').eq('id', user.id).single(),
  ])

  if (profile?.placed_at) redirect('/dashboard/placed')

  const isActivePaid = userRow?.subscription_status === 'active'
  const isTrialing = userRow?.subscription_status === 'trialing'
  const tier = userRow?.subscription_tier ?? 'free'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

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
          <p className="text-[13px] text-slate-500 mb-4">Search wrapping up.</p>
          <h1 className="text-[32px] font-bold text-white leading-tight mb-4">
            {firstName}, mark your search as complete.
          </h1>
          <p className="text-[15px] text-slate-300 leading-relaxed mb-8">
            Your companies, contacts, and research stay here. Most executives search again within a few years.
            When you are ready, everything you built will be waiting.
          </p>

          <form action={markPlaced} className="flex flex-col gap-4 mb-8">
            <div>
              <Label htmlFor="company" className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">
                Company you accepted (optional)
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                placeholder="Leave blank if not applicable"
                className="w-full bg-slate-800 border-slate-700 text-white text-[14px] placeholder:text-slate-500 focus-visible:border-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-bold px-7 py-3.5"
            >
              Mark search complete
            </Button>
          </form>

          {(isActivePaid || isTrialing) && tier !== 'free' && (
            <Card className="bg-slate-800 p-5 mb-6 ring-0">
              <p className="text-[13px] text-white font-semibold mb-1">Keep your market intelligence running.</p>
              <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                After you land, the executives who stay sharp are the ones who have options when things change.
                Monitor ($49/mo) keeps your signal monitoring and briefing running with no active search work required.
              </p>
              <Button variant="outline" render={<Link href="/settings/billing" />} className="text-[13px] font-semibold text-slate-300 hover:text-white border-slate-600 hover:border-slate-400">
                Review subscription options
              </Button>
            </Card>
          )}

          <Link
            href="/dashboard"
            className="block text-center text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Not yet -- back to my dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
