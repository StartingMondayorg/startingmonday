import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
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
      <div className="min-h-screen bg-background px-4 py-16 sm:py-24 text-foreground">
        <Card variant="glass" className="max-w-2xl mx-auto p-6 shadow-xl">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3">
          Executive Concierge
        </p>
        <h1 className="text-[26px] font-bold text-foreground mb-4 leading-tight">
          One-to-one strategy. Every month.
        </h1>
        <p className="text-[15px] text-foreground leading-relaxed mb-8 max-w-lg">
          Monthly 45-minute sessions with Rich Rothschild. Starting Monday prepares the agenda from your live pipeline before every call. Notes and recommendations are stored after each session. Limited to 10 seats.
        </p>
        <Button
          size="lg"
          className="px-7 text-[14px]"
          render={<a href="mailto:concierge@startingmonday.app?subject=Executive%20Concierge%20%E2%80%94%20Access%20Request" />}
        >
          Apply for access &rarr;
        </Button>
        <p className="text-[12px] text-muted-foreground mt-3">$499/mo or $4,990/yr (2 months free). Currently accepting applications.</p>
        <p className="mt-6">
          <Link href="/concierge" className="text-[13px] text-muted-foreground hover:text-foreground underline transition-colors">
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
    <div className="min-h-screen bg-background px-4 py-10 sm:py-14 text-foreground">
      <div className="max-w-3xl mx-auto">

      <Card variant="glass" className="mb-8 px-5 py-5 shadow-xl flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-1">
            Executive Concierge
          </p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight">
            {profile.full_name ? `${profile.full_name.split(' ')[0]}&rsquo;s strategy hub` : 'Strategy hub'}
          </h2>
        </div>
        <a
          href="mailto:concierge@startingmonday.app?subject=Schedule%20next%20call"
          className="text-[13px] font-semibold text-primary hover:text-foreground transition-colors"
        >
          Schedule next call &rarr;
        </a>
      </Card>

      {/* Next call */}
      {nextCall ? (
        <section className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Upcoming call</p>
          <Card variant="glass" className="border-primary/20 bg-primary/10 p-5 sm:p-6">
            <p className="text-[13px] font-semibold text-foreground mb-1">{formatDate(nextCall.scheduled_at)}</p>
            <p className="text-[12px] text-muted-foreground mb-5">45 minutes with Rich Rothschild</p>

            {nextCall.agenda && nextCall.agenda.length > 0 ? (
              <>
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">
                  AI-prepared agenda
                </p>
                <ol className="space-y-3">
                  {nextCall.agenda.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[11px] font-bold text-primary shrink-0 mt-0.5 w-4">{i + 1}</span>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{item.topic}</p>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Agenda will be prepared the day before your call from your live pipeline.
              </p>
            )}
          </Card>
        </section>
      ) : (
        <section className="mb-10">
          <Card variant="glass" className="p-5 text-center">
            <p className="text-[14px] text-foreground mb-3">No call scheduled yet.</p>
            <a
              href="mailto:concierge@startingmonday.app?subject=Schedule%20next%20call"
              className="text-[13px] font-semibold text-primary hover:text-foreground transition-colors"
            >
              Schedule your next session &rarr;
            </a>
          </Card>
        </section>
      )}

      {/* Past calls */}
      {pastCalls.length > 0 && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Past calls</p>
          <div className="space-y-4">
            {pastCalls.map(call => (
              <Card key={call.id} variant="glass" className="p-5">
                <p className="text-[13px] font-semibold text-foreground mb-3">{formatDate(call.scheduled_at)}</p>
                {call.call_notes ? (
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Notes</p>
                    <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{call.call_notes}</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground">No notes recorded for this session.</p>
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
