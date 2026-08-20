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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_32%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.96)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <nav className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] text-white transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link
            href="/coaches/executive-transition-coach-demo"
            className="rounded bg-orange-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
          >
            Coach outcomes
          </Link>
        </div>
      </nav>

      <main>
        <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">
              For executive transition coaches
            </p>
            <h1 className="max-w-4xl font-serif text-[38px] leading-[1.04] tracking-tight text-white sm:text-[54px]">
              Your client reaches transition-ready confidence before interview pressure begins.
            </h1>
            <p className="mt-6 max-w-3xl text-[19px] leading-relaxed text-slate-200/92 sm:text-[20px]">
              Starting Monday gives coaches one operating brief across the transition: narrative thesis, proof stories, commitment discipline, and opportunity timing in one place.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <TrackLink
                href="/coaches/sample-transition-brief"
                event={EVENT_NAMES.channelEntryClicked}
                logToUserEvents
                properties={{ channel: 'coaches', cta_label: 'View sample transition brief', source_page: '/coaches' }}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
              >
                View sample transition brief
              </TrackLink>
              <Link
                href="/coaches/federal-it-transition-demo"
                className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
              >
                Send federal IT demo
              </Link>
              <Link
                href="/demo/search-strategy-intake"
                className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
              >
                See the intake preview
              </Link>
            </div>

            <p className="mt-6 text-[12px] tracking-[0.14em] text-slate-400">
              One client. One brief. One transition path.
            </p>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Executive summary</p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-200">
              {summaryPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(155deg,rgba(26,22,20,0.82),rgba(10,14,24,0.9))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">Coach workflow</p>
              <h2 className="font-serif text-[30px] leading-[1.15] text-white sm:text-[36px]">How transition coaches run from clarity to conversion.</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-200">
                Keep the sequence tight: build the thesis, protect momentum, then convert readiness into better opportunities.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coachingWorkflow.map((lane) => (
                <article key={lane.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <h3 className="text-[17px] font-semibold text-white">{lane.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200">{lane.body}</p>
                  <Link
                    href={lane.href}
                    className="mt-4 inline-flex rounded-full border border-white/18 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
                  >
                    {lane.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(17,21,35,0.86),rgba(13,16,28,0.92))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">What makes Starting Monday different</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-white sm:text-[32px]">
              Key differences executive transition coaches feel in real client work.
            </h2>
            <div className="mt-6 space-y-4">
              {differentiators.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-[17px] font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <TransitionCoachDashboardPanel />

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Transition pain points</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-white sm:text-[32px]">What breaks executive transitions and how this prevents it.</h2>
            <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-slate-200">
              {painPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/coaches/objections"
                className="rounded-full bg-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-300"
              >
                Review coach objections
              </Link>
              <Link
                href="/coaches/executive-transition-coach-demo"
                className="rounded-full border border-white/18 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
              >
                Walk through coach outcomes
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(27,20,17,0.68),rgba(11,14,24,0.94))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Common objections</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-white sm:text-[32px]">
              Short answers for the objections executive coaches hear most.
            </h2>
            <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-slate-200">
              <li>Will this add administration and dilute coaching quality?</li>
              <li>How is this different from notes, templates, and generic career platforms?</li>
              <li>How do we prove transition impact beyond activity volume?</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/coaches/objections"
                className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
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
