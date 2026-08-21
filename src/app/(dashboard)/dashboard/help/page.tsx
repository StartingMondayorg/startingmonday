import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { FaqAccordion } from '@/app/(dashboard)/dashboard/_components/FaqAccordion'
import { Button, Card } from '@/components/ui'
export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-muted font-sans">

      <header className="dark bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            <Link href="/dashboard/chat" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Contacts</Link>
            <Link href="/dashboard/profile" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{profile?.full_name ?? user.email}</Link>
            <Link href="/settings/billing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Billing</Link>
            <LogoutButton label="Sign out" />
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">

        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Help &amp; Getting Started</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Everything you need to run a disciplined search.</p>
        </div>

        <Link href="/guide" className="group block mb-6">
          <Card className="dark rounded bg-card border-border px-6 py-5 flex items-center justify-between hover:bg-muted transition-colors">
            <div>
              <p className="text-[14px] font-semibold text-foreground">Open the full User Guide + Guide Chat</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Search features, read how-tos, and ask questions with source links.</p>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground shrink-0 ml-4 text-lg">→</span>
          </Card>
        </Link>

        <Card id="how-this-works" className="rounded px-6 py-5 mb-6 scroll-mt-20">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">How this works</p>
          <h2 className="mt-2 text-[20px] font-bold text-foreground">The company, people, angle loop</h2>
          <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            <p>We watch your companies for public signals.</p>
            <p>A signal means a role may be forming before it is posted.</p>
            <p>You reach the approximately three people who could say your name.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-semibold">
            <Link href="/dashboard/companies/new" className="text-foreground hover:text-muted-foreground">Add a company</Link>
            <Link href="/dashboard/signals" className="text-foreground hover:text-muted-foreground">View signals</Link>
            <Link href="/dashboard/contacts" className="text-foreground hover:text-muted-foreground">Review relationships</Link>
          </div>
        </Card>

        {/* Setup checklist */}
        <Link href="/dashboard/start" className="group block mb-6">
          <Card className="rounded px-6 py-5 flex items-center justify-between hover:border-border hover:bg-muted transition-colors">
            <div>
              <p className="text-[14px] font-semibold text-foreground group-hover:text-muted-foreground">New here? Start with the setup checklist.</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Six moves that make everything else work. Takes about 15 minutes.</p>
            </div>
            <span className="text-muted-foreground shrink-0 ml-4 text-lg">→</span>
          </Card>
        </Link>

        {/* FAQ */}
        <Card className="rounded overflow-hidden mb-6 gap-0 p-0">
          <div className="px-6 py-[18px] border-b border-border">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Frequently Asked Questions</span>
          </div>
          <FaqAccordion />
        </Card>

        {/* Contact */}
        <Card className="rounded px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Still have a question?</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">Email and you&apos;ll hear back within one business day.</p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0 text-[13px] font-semibold"
            render={<a href="mailto:rothschild@startingmonday.app" />}
          >
            Email us
          </Button>
        </Card>

      </main>
    </div>
  )
}
