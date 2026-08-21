import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markPlaced } from '../placed/actions'
import { Button, Card, Input, Label } from '@/components/ui'
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
    <div className="min-h-screen bg-card font-sans flex flex-col">
      <header className="px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
          <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
        </Link>
        <Link href="/dashboard" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          Back to dashboard
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">
          <p className="text-[13px] text-muted-foreground mb-4">Search wrapping up.</p>
          <h1 className="text-[32px] font-bold text-foreground leading-tight mb-4">
            {firstName}, mark your search as complete.
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
            Your companies, contacts, and research stay here. Most executives search again within a few years.
            When you are ready, everything you built will be waiting.
          </p>

          <form action={markPlaced} className="flex flex-col gap-4 mb-8">
            <div>
              <Label htmlFor="company" className="block text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
                Company you accepted (optional)
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                placeholder="Leave blank if not applicable"
                className="w-full bg-muted border-border text-foreground text-[14px] placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-[14px] font-bold px-7 py-3.5"
            >
              Mark search complete
            </Button>
          </form>

          {(isActivePaid || isTrialing) && tier !== 'free' && (
            <Card className="bg-muted p-5 mb-6 ring-0">
              <p className="text-[13px] text-foreground font-semibold mb-1">Keep your market intelligence running.</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                After you land, the executives who stay sharp are the ones who have options when things change.
                Monitor ($49/mo) keeps your signal monitoring and briefing running with no active search work required.
              </p>
              <Button variant="outline" render={<Link href="/settings/billing" />} className="text-[13px] font-semibold text-muted-foreground hover:text-foreground border-border">
                Review subscription options
              </Button>
            </Card>
          )}

          <Link
            href="/dashboard"
            className="block text-center text-[13px] text-muted-foreground transition-colors"
          >
            Not yet -- back to my dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
