import type { Metadata } from 'next'
import Link from 'next/link'
import TrackedCtaLink from '@/components/TrackedCtaLink'

export const metadata: Metadata = {
  title: 'Starting Monday | Mark Horstman Meeting Flow',
  description:
    'Simple Mark meeting flow: what Starting Monday is, why it is different, and live Michael Torres strategy and interview demos.',
  alternates: { canonical: 'https://startingmonday.app/mark-review' },
  openGraph: {
    title: 'Starting Monday | Mark Horstman Meeting Flow',
    description:
      'Simple Mark meeting flow: what Starting Monday is, why it is different, and live Michael Torres strategy and interview demos.',
    url: 'https://startingmonday.app/mark-review',
  },
}

const STRATEGY_BRIEF_LINK = '/demo/michael-strategy-brief'
const INTERVIEW_BRIEF_LINK = '/demo/executive-brief'
const MICHAEL_DASHBOARD_LINK = '/demo/michael-dashboard'
const BUSINESS_PLAN_LINK = '/mark-review/business-plan'

const WHY_DIFFERENT = [
  'Behavior focused: it creates a weekly execution loop, not one-off content.',
  'Signal to action: detects movement, maps the right person, and drives timed outreach.',
  'Conversation quality: strategy and interview briefs are generated before the call, not during scramble time.',
  'Loop closure: follow-up ownership is explicit so momentum does not reset each week.',
]

const FLOW_STEPS = [
  {
    title: '1. 90-second framing',
    body: 'Starting Monday is an execution system for executive search. The differentiator is behavior: it turns signal, outreach, prep, and follow-up into a repeatable weekly operating loop.',
  },
  {
    title: '2. Live demos with Michael Torres',
    body: 'Run the strategy brief first, then run the live interview brief for Michael Torres at Salesforce.',
  },
  {
    title: '3. Show operating view',
    body: 'Open the prefilled Michael Torres dashboard to show everything in one place: target company context, contacts, actions, and next-step ownership.',
  },
]
export default function MarkReviewPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase" aria-label="Go to Starting Monday homepage">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[13px] text-slate-400 hover:text-white transition-colors">
              Main site
            </Link>
            <Link href={BUSINESS_PLAN_LINK} className="text-[13px] text-slate-300 hover:text-white transition-colors">
              Business plan
            </Link>
            <TrackedCtaLink
              href="/signup"
              eventName="mark_review_cta_click"
              eventProps={{ placement: 'top_nav', cta: 'try_free' }}
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Try free
            </TrackedCtaLink>
          </div>
        </div>
      </nav>

      <header className="bg-slate-900 px-4 sm:px-6 pt-14 pb-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-4">Mark meeting flow</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.12] tracking-tight mb-5">
            Simple walkthrough for today's review
          </h1>
          <p className="text-[16px] text-slate-300 leading-relaxed max-w-3xl">
            Keep this conversation tight: what Starting Monday is, why it is different, then the Michael Torres strategy brief, interview brief, and dashboard.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-18">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">What Starting Monday is and why it is different</p>
            <ul className="space-y-2.5">
              {WHY_DIFFERENT.map((item) => (
                <li key={item} className="text-[14px] text-slate-800 leading-relaxed flex items-start gap-2.5">
                  <span className="text-orange-500 mt-0.5">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Simple flow</p>
            <div className="space-y-4">
              {FLOW_STEPS.map((step) => (
                <article key={step.title} className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-[13px] font-semibold text-slate-900 mb-1.5">{step.title}</p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{step.body}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Live demo buttons</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <TrackedCtaLink
                href={STRATEGY_BRIEF_LINK}
                eventName="mark_review_navigation_click"
                eventProps={{ placement: 'meeting_flow', target: 'strategy_brief_michael' }}
                className="inline-flex items-center justify-center rounded bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 hover:bg-slate-800 transition-colors"
              >
                Open strategy brief (Michael Torres)
              </TrackedCtaLink>
              <TrackedCtaLink
                href={MICHAEL_DASHBOARD_LINK}
                eventName="mark_review_navigation_click"
                eventProps={{ placement: 'meeting_flow', target: 'dashboard_michael' }}
                className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
              >
                Open dashboard (Michael Torres)
              </TrackedCtaLink>
              <TrackedCtaLink
                href="/learn-more"
                eventName="mark_review_navigation_click"
                eventProps={{ placement: 'meeting_flow', target: 'external_guide' }}
                className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
              >
                Open external guide
              </TrackedCtaLink>
              <TrackedCtaLink
                href={INTERVIEW_BRIEF_LINK}
                eventName="mark_review_navigation_click"
                eventProps={{ placement: 'meeting_flow', target: 'interview_brief_michael' }}
                className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
              >
                Open live interview brief (Michael Torres)
              </TrackedCtaLink>
            </div>
            <p className="text-[12px] text-slate-500 mt-3">
              Demo materials use generated sample data for evaluation only.
            </p>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

