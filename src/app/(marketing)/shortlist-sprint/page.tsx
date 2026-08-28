import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackLink } from '@/app/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import ShortlistSprintStatusCard from './ShortlistSprintStatusCard'

export const metadata: Metadata = {
  title: '7-Day Shortlist Sprint | Starting Monday',
  description:
    'Small-fee wedge offer: get five likely-to-open executive roles, decision-path contacts, and a one-week relationship action plan.',
  alternates: { canonical: 'https://startingmonday.app/shortlist-sprint' },
}

const DELIVERABLES = [
  'Five likely-to-open executive role targets matched to your role lane.',
  'Decision-path map for each target: who influences shortlist formation.',
  'Weekly relationship action queue with timing and ownership guidance.',
  'Confidence and why-now rationale for every target recommendation.',
]

const TERMS = [
  'Price: $199 one-time for the 7-day sprint.',
  'Credit-forward: full $199 credit toward first monthly subscription.',
  'Guarantee: if no clear shortlist + decision-path map is delivered, full refund.',
]

export default function ShortlistSprintPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      <header className="sticky top-0 z-20 border-b border-border bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo/wedge-30s" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              30-second demo
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Paid entry offer</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[46px]">
            7-Day Shortlist Sprint
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-foreground sm:text-[18px]">
            If you are in transition now, this is the fastest way to test wedge value: likely-to-open roles, decision-path contacts, and the next actions that create warm conversations.
          </p>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-muted/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">What you get in 7 days</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-foreground">
                {DELIVERABLES.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="font-bold text-primary">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-border bg-muted/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Offer terms</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-foreground">
                {TERMS.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="font-bold text-primary">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <div className="mt-7 flex flex-wrap gap-3">
            <TrackLink
              href="/signup?offer=shortlist_sprint"
              event={EVENT_NAMES.shortlistSprintCheckoutStarted}
              logToUserEvents
              properties={{
                route: '/shortlist-sprint',
                cta_label: 'start_7_day_sprint',
                destination: '/signup?offer=shortlist_sprint',
                offer_code: 'shortlist_sprint',
                amount_usd: 199,
              }}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start 7-day sprint
            </TrackLink>
            <TrackLink
              href="/demo/wedge-30s"
              event={EVENT_NAMES.shortlistSprintCtaClicked}
              logToUserEvents
              properties={{
                route: '/shortlist-sprint',
                cta_label: 'review_wedge_demo_first',
                destination: '/demo/wedge-30s',
                offer_code: 'shortlist_sprint',
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Review wedge demo first
            </TrackLink>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-muted/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Funnel instrumentation</p>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                This page now emits canonical shortlist funnel events to user_events so cohort reporting can track CTA clicks, checkout starts, purchases, delivery, and credit-forward conversion.
              </p>
              <TrackLink
                href="/api/admin/automation/reporting/shortlist-sprint-funnel"
                event={EVENT_NAMES.shortlistSprintCtaClicked}
                logToUserEvents
                properties={{
                  route: '/shortlist-sprint',
                  cta_label: 'open_shortlist_funnel_report_api',
                  destination: '/api/admin/automation/reporting/shortlist-sprint-funnel',
                  offer_code: 'shortlist_sprint',
                }}
                className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                View funnel report endpoint
              </TrackLink>
            </article>

            <ShortlistSprintStatusCard />
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

