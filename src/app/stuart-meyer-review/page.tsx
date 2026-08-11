import type { Metadata } from 'next'
import Link from 'next/link'
import TrackedCtaLink from '@/components/TrackedCtaLink'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { BlogChat } from '../blog/blog-chat'

export const metadata: Metadata = {
  title: 'Starting Monday | Stuart, Coach Overview',
  description:
    'A direct coach-facing overview for Stuart: what Starting Monday does, how it helps coaches and groups, expected outcomes, objections, pricing, executive pain points, and demo briefs.',
  alternates: { canonical: 'https://startingmonday.app/stuart-meyer-review' },
  openGraph: {
    title: 'Starting Monday | Stuart, Coach Overview',
    description:
      'A direct coach-facing overview for Stuart: what Starting Monday does, how it helps coaches and groups, expected outcomes, objections, pricing, executive pain points, and demo briefs.',
    url: 'https://startingmonday.app/stuart-meyer-review',
  },
}

const STRATEGY_BRIEF_LINK = '/demo/michael-strategy-brief'
const INTERVIEW_BRIEF_LINK = '/demo/executive-brief'
const MICHAEL_DASHBOARD_LINK = '/demo/michael-dashboard'

const TEN_SECOND_VALUE = [
  'You and your client share one view for signals, outreach, prep, and follow-through.',
  'Prep briefs are ready before key calls, so sessions stay strategy-first.',
  'Weekly momentum stays visible across clients without extra admin.',
]

const COACH_VALUE_INDIVIDUAL = [
  'You see where each client is stuck before each session.',
  'You coach on decisions and narrative quality, not spreadsheet cleanup.',
  'You assign one clear next action and confirm follow-through weekly.',
]

const COACH_VALUE_GROUP = [
  'You run a consistent cadence across a cohort without flattening your style.',
  'You get shared structure for signal review, brief prep, and accountability.',
  'You preserve quality as client volume grows because context stays in one system.',
]

const OUTCOMES = [
  'Higher-quality sessions: less status recap, more decision-grade discussion.',
  'Better timing: clients act on role signals before windows close.',
  'Stronger conversations: briefs sharpen positioning, questions, and focus.',
  'Measurable weekly progress: each thread has an owner and next action.',
]

const OBJECTIONS = [
  {
    objection: '"I do not want another tool to manage."',
    response: 'You are not adding busywork. You are replacing notes, email threads, and trackers with one layer.',
  },
  {
    objection: '"Will this replace the coaching relationship?"',
    response: 'No. It strengthens your relationship by making sessions strategic, not administrative.',
  },
  {
    objection: '"Can my clients actually use this consistently?"',
    response: 'Yes. The workflow uses one weekly rhythm: signal review, prep, outreach, follow-through.',
  },
  {
    objection: '"Is this only for one-on-one coaching?"',
    response: 'No. It works for individual coaches and coaching groups at scale.',
  },
]

const EXEC_PAIN_POINTS = [
  {
    pain: '"I am doing activity, but I cannot tell what is working."',
    resolution: 'Starting Monday makes momentum and bottlenecks visible so you can pick the next move faster.',
  },
  {
    pain: '"I walk into high-stakes calls underprepared."',
    resolution: 'Briefs are generated before calls with company context, positioning angles, and prompts.',
  },
  {
    pain: '"My outreach cadence breaks between coaching sessions."',
    resolution: 'The operating loop keeps outreach and follow-through active between sessions.',
  },
]

const EXEC_KEY_VALUES = [
  'Earlier signal visibility so timing improves before roles are widely visible.',
  'Decision-ready prep briefs before high-stakes conversations.',
  'Weekly execution rhythm that reduces stall risk between coaching sessions.',
  'Cleaner relationship follow-through with explicit next actions and ownership.',
]

const COACH_QUICK_PROOF = {
  scenario:
    'Monday morning: your client is stalled. Starting Monday shows the signal change, priority contact, and next move before your session.',
  before:
    'Without this: first 15-20 minutes go to recap and status reconstruction.',
  after:
    'With this: you can start in 3-5 minutes at decision quality and next action.',
  confidentiality:
    'Confidentiality is client-controlled: access can be granted or revoked at any time.',
  proof:
    'Proof by method: the signal timing model is documented with sources at /references, and the workflow is verifiable in a live demo.',
}

export default function StuartMeyerReviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <nav className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase" aria-label="Go to Starting Monday homepage">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/for-coaches" className="text-[13px] text-slate-100 hover:text-white transition-colors">
              Coach page
            </Link>
            <TrackedCtaLink
              href="/signup"
              eventName="stuart_review_cta_click"
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
          <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-300 mb-4">For you, Stuart</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.12] tracking-tight mb-5">
            What Starting Monday does for your coaching practice
          </h1>
          <p className="text-[16px] text-slate-100 leading-relaxed max-w-3xl">
            You get one operating layer that helps your executives move with better timing, stronger prep, and consistent follow-through.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedCtaLink
              href="/for-coaches/economics"
              eventName="stuart_review_navigation_click"
              eventProps={{ placement: 'hero', target: 'coach_pricing' }}
              className="inline-flex items-center justify-center rounded bg-orange-500 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:bg-orange-400 transition-colors"
            >
              View pricing
            </TrackedCtaLink>
            <TrackedCtaLink
              href={STRATEGY_BRIEF_LINK}
              eventName="stuart_review_navigation_click"
              eventProps={{ placement: 'hero', target: 'strategy_brief_michael' }}
              className="inline-flex items-center justify-center rounded border border-slate-500 text-slate-100 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-300 transition-colors"
            >
              See a strategy brief
            </TrackedCtaLink>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-18">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="border border-orange-200 rounded-lg p-6 bg-orange-50/50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-600 mb-4">Coach quick proof</p>
            <div className="rounded border border-orange-200 bg-white p-4 mb-4">
              <p className="text-[14px] font-semibold text-slate-900 mb-1">60-second coach scenario</p>
              <p className="text-[14px] text-slate-700 leading-relaxed">{COACH_QUICK_PROOF.scenario}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <article className="rounded border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">Before</p>
                <p className="text-[14px] text-slate-700 leading-relaxed">{COACH_QUICK_PROOF.before}</p>
              </article>
              <article className="rounded border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">After</p>
                <p className="text-[14px] text-slate-700 leading-relaxed">{COACH_QUICK_PROOF.after}</p>
              </article>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 mb-4">
              <p className="text-[13px] font-semibold text-slate-900 mb-1">Best pricing fit</p>
              <p className="text-[14px] text-slate-700 leading-relaxed">Solo coach: Starter Coach. Coaching group: Studio or Team Coach.</p>
            </div>
            <p className="text-[13px] text-slate-700 leading-relaxed mb-1">{COACH_QUICK_PROOF.confidentiality}</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{COACH_QUICK_PROOF.proof}</p>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">10-second summary</p>
            <div className="space-y-3">
              {TEN_SECOND_VALUE.map((item) => (
                <div key={item} className="rounded border border-slate-200 bg-white p-4 text-[14px] text-slate-800 leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">How this helps you as an individual coach</p>
            <div className="space-y-3">
              {COACH_VALUE_INDIVIDUAL.map((item) => (
                <div key={item} className="rounded border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-800 leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">How this helps coaching groups</p>
            <div className="space-y-3">
              {COACH_VALUE_GROUP.map((item) => (
                <article key={item} className="rounded border border-slate-200 bg-white p-4 text-[14px] text-slate-800 leading-relaxed">
                  {item}
                </article>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Expected outcomes</p>
            <div className="space-y-4">
              {OUTCOMES.map((item) => (
                <article key={item} className="rounded border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-800 leading-relaxed">
                  {item}
                </article>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Likely objections and direct answers</p>
            <div className="space-y-3">
              {OBJECTIONS.map((item) => (
                <article key={item.objection} className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-[14px] font-semibold text-slate-900">{item.objection}</p>
                  <p className="text-[14px] text-slate-700 leading-relaxed mt-1.5">{item.response}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Pricing</p>
            <p className="text-[14px] text-slate-800 leading-relaxed mb-4">
              Open pricing for details. For coach-group packaging, we can scope together.
            </p>
            <TrackedCtaLink
              href="/for-coaches/economics"
              eventName="stuart_review_navigation_click"
              eventProps={{ placement: 'pricing', target: 'coach_pricing_page' }}
              className="inline-flex items-center justify-center rounded bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 hover:bg-slate-800 transition-colors"
            >
              Open coach pricing page
            </TrackedCtaLink>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">How this helps your executives solve pain points</p>
            <details className="mb-4 rounded border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-[14px] font-semibold text-slate-900 underline underline-offset-2">
                See how Starting Monday helps executives
              </summary>
              <ul className="mt-3 space-y-2.5">
                {EXEC_KEY_VALUES.map((item) => (
                  <li key={item} className="text-[14px] text-slate-800 leading-relaxed flex items-start gap-2.5">
                    <span className="text-orange-500 mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
            <div className="space-y-3">
              {EXEC_PAIN_POINTS.map((item) => (
                <article key={item.pain} className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-[14px] font-semibold text-slate-900">{item.pain}</p>
                  <p className="text-[14px] text-slate-700 leading-relaxed mt-1.5">{item.resolution}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Demo briefs and operating example</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <TrackedCtaLink
                href={STRATEGY_BRIEF_LINK}
                eventName="stuart_review_navigation_click"
                eventProps={{ placement: 'examples', target: 'strategy_brief_michael' }}
                className="inline-flex items-center justify-center rounded bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 hover:bg-slate-800 transition-colors"
              >
                Open strategy brief example
              </TrackedCtaLink>
              <TrackedCtaLink
                href={INTERVIEW_BRIEF_LINK}
                eventName="stuart_review_navigation_click"
                eventProps={{ placement: 'examples', target: 'interview_brief_michael' }}
                className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
              >
                Open interview brief example
              </TrackedCtaLink>
              <TrackedCtaLink
                href={MICHAEL_DASHBOARD_LINK}
                eventName="stuart_review_navigation_click"
                eventProps={{ placement: 'examples', target: 'dashboard_michael' }}
                className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
              >
                Open operating dashboard example
              </TrackedCtaLink>
            </div>
            <p className="text-[12px] text-slate-500 mt-3">
              Demo materials use sample data.
            </p>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Ask anything about the product</p>
            <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
              Enter any question and use search to get an answer on how Starting Monday works.
            </p>
            <div className="mb-5">
              <BlogChat
                posts={BLOG_POSTS}
                title="Ask a question"
                description="Use the search field to get a direct answer."
                placeholder="e.g. How does this help executives?"
                answerMode
                showResultLinks={false}
                showGuideCta
                guideCtaHref="/learn-more"
                guideCtaLabel="Open guide"
              />
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-4">Public page link</p>
            <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
              Direct link:
            </p>
            <a
              href="https://startingmonday.app/stuart-meyer-review"
              className="text-[14px] font-semibold text-slate-900 underline hover:text-slate-700"
            >
              https://startingmonday.app/stuart-meyer-review
            </a>
          </section>

          <section className="rounded border border-orange-300 bg-orange-50 p-6">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-orange-600 mb-3">Contact Richard</p>
            <p className="text-[14px] text-slate-800 leading-relaxed mb-2">
              Email: <a href="mailto:richard@startingmonday.app" className="underline text-slate-900">richard@startingmonday.app</a>
            </p>
            <p className="text-[14px] text-slate-800 leading-relaxed">
              Cell: <a href="tel:+14086054832" className="underline text-slate-900">408-605-4832</a>
            </p>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

