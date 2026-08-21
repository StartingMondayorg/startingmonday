import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackLink } from '@/app/components/TrackLink'
import { SiteFooter } from '@/app/components/SiteFooter'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { TransitionCoachDashboardPanel } from './TransitionCoachDashboardPanel'

export const metadata: Metadata = {
  title: 'Starting Monday for Executive Transition Coaches',
  description:
    'Starting Monday helps executive transition coaches move clients to decision-ready confidence with one operating brief, weekly momentum discipline, and market timing signals.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches',
  },
  openGraph: {
    title: 'Starting Monday for Executive Transition Coaches',
    description:
      'One transition brief. Better interview readiness. Stronger decision confidence for executive coaching clients.',
    url: 'https://startingmonday.app/coaches',
  },
}

const summaryPoints = [
  'Session one starts with decision-grade narrative instead of recap and guesswork.',
  'Between-session commitments stay visible, so momentum does not disappear between calls.',
  'Client messaging is pressure-tested before high-stakes recruiter and board conversations.',
  'Opportunity timing is guided by signals, not reactive outreach bursts.',
]

const coachingWorkflow = [
  {
    title: '1) Set the transition thesis before outreach',
    body: 'Define role narrative, proof stories, and likely objections in one brief before client conversations scale.',
    href: '/coaches/workflow/set-transition-thesis-demo',
    cta: 'View thesis demo',
  },
  {
    title: '2) Run weekly momentum discipline',
    body: 'Track commitments, blocked actions, and confidence risk so coaching sessions stay strategic.',
    href: '/coaches/workflow/weekly-momentum-demo',
    cta: 'View momentum demo',
  },
  {
    title: '3) Convert readiness into opportunity access',
    body: 'Use relationship paths and market signals to improve mandate access and interview conversion quality.',
    href: '/coaches/workflow/opportunity-access-demo',
    cta: 'View opportunity demo',
  },
]

const differentiators = [
  {
    title: 'Clients arrive more prepared, so coaching time moves up-market.',
    body: 'Sessions start with a decision-ready brief and pressure-tested narrative, not recap and reactive edits.',
  },
  {
    title: 'The product experience reflects well on the coach.',
    body: 'Premium flow, clear structure, and disciplined outputs reinforce coach credibility with senior clients.',
  },
  {
    title: 'It highlights companies with higher near-term role probability.',
    body: 'Signal-based targeting helps coaches focus client energy where executive openings are more likely to emerge soon.',
  },
  {
    title: 'It prioritizes which relationships to activate first.',
    body: 'Beyond the coach\'s existing network, it surfaces relationship paths most likely to improve access and conversion.',
  },
  {
    title: 'It turns advice into a behavior-focused operating plan.',
    body: 'Weekly commitments, intervention triggers, and execution cadence keep momentum measurable between sessions.',
  },
]

const painPoints = [
  'When clients present a generic story, interview confidence drops even with strong experience.',
  'When session commitments are not operationalized, momentum leaks between calls.',
  'When opportunity timing is reactive, transition outcomes depend on luck instead of discipline.',
]

export default function CoachesChannelPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] text-foreground transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link
            href="/coaches/executive-transition-coach-demo"
            className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coach outcomes
          </Link>
        </div>
      </nav>

      <main>
        <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              For executive transition coaches
            </p>
            <h1 className="max-w-4xl font-serif text-[38px] leading-[1.04] tracking-tight text-foreground sm:text-[54px]">
              Your client reaches transition-ready confidence before interview pressure begins.
            </h1>
            <p className="mt-6 max-w-3xl text-[19px] leading-relaxed text-foreground/92 sm:text-[20px]">
              Starting Monday gives coaches one operating brief across the transition: narrative thesis, proof stories, commitment discipline, and opportunity timing in one place.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <TrackLink
                href="/coaches/sample-transition-brief"
                event={EVENT_NAMES.channelEntryClicked}
                logToUserEvents
                properties={{ channel: 'coaches', cta_label: 'View sample transition brief', source_page: '/coaches' }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View sample transition brief
              </TrackLink>
              <Link
                href="/coaches/federal-it-transition-demo"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                Send federal IT demo
              </Link>
              <Link
                href="/demo/search-strategy-intake"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                See the intake preview
              </Link>
            </div>

            <p className="mt-6 text-[12px] tracking-[0.14em] text-muted-foreground">
              One client. One brief. One transition path.
            </p>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-muted/[0.03] p-6 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Executive summary</p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground">
              {summaryPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-primary">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Coach workflow</p>
              <h2 className="font-serif text-[30px] leading-[1.15] text-foreground sm:text-[36px]">How transition coaches run from clarity to conversion.</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-foreground">
                Keep the sequence tight: build the thesis, protect momentum, then convert readiness into better opportunities.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coachingWorkflow.map((lane) => (
                <article key={lane.title} className="rounded-2xl border border-border bg-muted/[0.05] p-5">
                  <h3 className="text-[17px] font-semibold text-foreground">{lane.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">{lane.body}</p>
                  <Link
                    href={lane.href}
                    className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
                  >
                    {lane.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">What makes Starting Monday different</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">
              Key differences executive transition coaches feel in real client work.
            </h2>
            <div className="mt-6 space-y-4">
              {differentiators.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-muted/[0.04] p-5">
                  <h3 className="text-[17px] font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <TransitionCoachDashboardPanel />

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Transition pain points</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">What breaks executive transitions and how this prevents it.</h2>
            <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
              {painPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-primary">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/coaches/objections"
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Review coach objections
              </Link>
              <Link
                href="/coaches/executive-transition-coach-demo"
                className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                Walk through coach outcomes
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Common objections</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">
              Short answers for the objections executive coaches hear most.
            </h2>
            <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-foreground">
              <li>Will this add administration and dilute coaching quality?</li>
              <li>How is this different from notes, templates, and generic career platforms?</li>
              <li>How do we prove transition impact beyond activity volume?</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/coaches/objections"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Read full objections and how we overcome them
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
