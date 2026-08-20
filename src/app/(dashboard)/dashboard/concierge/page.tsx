import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AgendaItem {
  topic: string
  detail: string
  priority?: string
}

interface ConciergeCall {
  id: string
  scheduled_at: string
  status: string
  agenda: AgendaItem[]
  call_notes: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export default async function ConciergeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_concierge, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_concierge) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_26%),linear-gradient(180deg,_#0b1220_0%,_#0a1020_46%,_#0b1324_100%)] px-4 py-16 sm:py-24 text-slate-100">
        <Card variant="glass" className="max-w-2xl mx-auto p-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-300 mb-3">
          Executive Concierge
        </p>
        <h1 className="text-[26px] font-bold text-white mb-4 leading-tight">
          One-to-one strategy. Every month.
        </h1>
        <p className="text-[15px] text-slate-200 leading-relaxed mb-8 max-w-lg">
          Monthly 45-minute sessions with Rich Rothschild. Starting Monday prepares the agenda from your live pipeline before every call. Notes and recommendations are stored after each session. Limited to 10 seats.
        </p>
        <Button
          size="lg"
          className="px-7 text-[14px]"
          render={<a href="mailto:concierge@startingmonday.app?subject=Executive%20Concierge%20%E2%80%94%20Access%20Request" />}
        >
          Apply for access &rarr;
        </Button>
        <p className="text-[12px] text-slate-300 mt-3">$499/mo or $4,990/yr (2 months free). Currently accepting applications.</p>
        <p className="mt-6">
          <Link href="/concierge" className="text-[13px] text-slate-300 hover:text-white underline transition-colors">
            Learn more about Executive Concierge &rarr;
          </Link>
        </p>
        </Card>
      </div>
    )
  }

  const now = new Date().toISOString()
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('concierge_calls')
      .select('id, scheduled_at, status, agenda, call_notes')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(3),
    supabase
      .from('concierge_calls')
      .select('id, scheduled_at, status, agenda, call_notes')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(5),
  ])

  const nextCall = upcoming?.[0] as ConciergeCall | undefined
  const pastCalls = (past ?? []) as ConciergeCall[]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_26%),linear-gradient(180deg,_#0b1220_0%,_#0a1020_46%,_#0b1324_100%)] px-4 py-10 sm:py-14 text-slate-100">
      <div className="max-w-3xl mx-auto">

      <Card variant="glass" className="mb-8 px-5 py-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-300 mb-1">
            Executive Concierge
          </p>
          <h2 className="text-[24px] font-bold text-white leading-tight">
            {profile.full_name ? `${profile.full_name.split(' ')[0]}&rsquo;s strategy hub` : 'Strategy hub'}
          </h2>
        </div>
        <a
          href="mailto:concierge@startingmonday.app?subject=Schedule%20next%20call"
          className="text-[13px] font-semibold text-orange-200 hover:text-white transition-colors"
        >
          Schedule next call &rarr;
        </a>
      </Card>

      {/* Next call */}
      {nextCall ? (
        <section className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-3">Upcoming call</p>
          <Card variant="glass" className="border-orange-300/20 bg-orange-500/10 p-5 sm:p-6">
            <p className="text-[13px] font-semibold text-white mb-1">{formatDate(nextCall.scheduled_at)}</p>
            <p className="text-[12px] text-slate-300 mb-5">45 minutes with Rich Rothschild</p>

            {nextCall.agenda && nextCall.agenda.length > 0 ? (
              <>
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-3">
                  AI-prepared agenda
                </p>
                <ol className="space-y-3">
                  {nextCall.agenda.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[11px] font-bold text-orange-200 shrink-0 mt-0.5 w-4">{i + 1}</span>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{item.topic}</p>
                        <p className="text-[12px] text-slate-300 leading-relaxed">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-[13px] text-slate-300">
                Agenda will be prepared the day before your call from your live pipeline.
              </p>
            )}
          </Card>
        </section>
      ) : (
        <section className="mb-10">
          <Card variant="glass" className="p-5 text-center">
            <p className="text-[14px] text-slate-200 mb-3">No call scheduled yet.</p>
            <a
              href="mailto:concierge@startingmonday.app?subject=Schedule%20next%20call"
              className="text-[13px] font-semibold text-orange-200 hover:text-white transition-colors"
            >
              Schedule your next session &rarr;
            </a>
          </Card>
        </section>
      )}

      {/* Past calls */}
      {pastCalls.length > 0 && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-300 mb-3">Past calls</p>
          <div className="space-y-4">
            {pastCalls.map(call => (
              <Card key={call.id} variant="glass" className="p-5">
                <p className="text-[13px] font-semibold text-white mb-3">{formatDate(call.scheduled_at)}</p>
                {call.call_notes ? (
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-400 mb-2">Notes</p>
                    <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-line">{call.call_notes}</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">No notes recorded for this session.</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      </div>
    </div>
  )
}
