import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackLink } from '@/components/TrackLink'
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
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_30%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(10,15,28,0.96)_60%,_rgba(10,15,28,1)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo/wedge-30s" className="text-[13px] text-slate-200 transition-colors hover:text-white">
              30-second demo
            </Link>
            <Link href="/handshake-review" className="text-[13px] text-slate-200 transition-colors hover:text-white">
              Handshake demo
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-white/10 bg-[linear-gradient(150deg,rgba(26,22,20,0.72),rgba(10,14,24,0.92))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.24)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Paid entry offer</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-white sm:text-[46px]">
            7-Day Shortlist Sprint
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-200 sm:text-[18px]">
            If you are in transition now, this is the fastest way to test wedge value: likely-to-open roles, decision-path contacts, and the next actions that create warm conversations.
          </p>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">What you get in 7 days</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-200">
                {DELIVERABLES.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="font-bold text-orange-300">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">Offer terms</p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-200">
                {TERMS.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="font-bold text-orange-300">+</span>
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
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
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
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Review wedge demo first
            </TrackLink>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">Funnel instrumentation</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-200">
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
                className="mt-3 inline-flex rounded-full border border-white/20 px-4 py-2 text-[12px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
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

