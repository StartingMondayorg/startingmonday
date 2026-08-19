import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { FaqAccordion } from '@/app/(dashboard)/dashboard/_components/FaqAccordion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 hover:text-slate-300 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            <Link href="/dashboard/chat" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Chat</Link>
            <Link href="/dashboard/contacts" className="text-[12px] font-semibold text-slate-300 hover:text-white transition-colors">Contacts</Link>
            <Link href="/dashboard/profile" className="text-[13px] text-slate-300 hover:text-white transition-colors">{profile?.full_name ?? user.email}</Link>
            <Link href="/settings/billing" className="text-[13px] text-slate-300 hover:text-white transition-colors">Billing</Link>
            <LogoutButton label="Sign out" />
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-md border border-slate-700 px-3 text-[12px] font-semibold text-slate-200 hover:text-white hover:border-slate-500"
            >
              Dashboard
            </Link>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-10">

        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Help &amp; Getting Started</h1>
          <p className="text-[13px] text-slate-600 mt-1.5">Everything you need to run a disciplined search.</p>
        </div>

        <Link href="/guide" className="group block mb-6">
          <Card className="rounded bg-slate-900 border-slate-800 px-6 py-5 flex items-center justify-between hover:bg-slate-800 transition-colors">
            <div>
              <p className="text-[14px] font-semibold text-white">Open the full User Guide + Guide Chat</p>
              <p className="text-[12px] text-slate-300 mt-0.5">Search features, read how-tos, and ask questions with source links.</p>
            </div>
            <span className="text-slate-400 group-hover:text-white shrink-0 ml-4 text-lg">→</span>
          </Card>
        </Link>

        {/* Setup checklist */}
        <Link href="/dashboard/start" className="group block mb-6">
          <Card className="rounded px-6 py-5 flex items-center justify-between hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-[14px] font-semibold text-slate-900 group-hover:text-slate-700">New here? Start with the setup checklist.</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Six moves that make everything else work. Takes about 15 minutes.</p>
            </div>
            <span className="text-slate-300 group-hover:text-slate-500 shrink-0 ml-4 text-lg">→</span>
          </Card>
        </Link>

        {/* FAQ */}
        <Card className="rounded overflow-hidden mb-6 gap-0 p-0">
          <div className="px-6 py-[18px] border-b border-slate-200">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">Frequently Asked Questions</span>
          </div>
          <FaqAccordion />
        </Card>

        {/* Contact */}
        <Card className="rounded px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Still have a question?</p>
            <p className="text-[13px] text-slate-500 mt-0.5">Email and you&apos;ll hear back within one business day.</p>
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
