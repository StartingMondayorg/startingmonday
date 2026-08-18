'use client'
import Link from 'next/link'
import TrackedCtaLink from '@/app/components/TrackedCtaLink'

const DECISION_BRIEF = [
  {
    title: 'Primary claim',
    detail:
      'Starting Monday is built to convert signals into a repeatable weekly behavior loop for executive search execution.',
  },
  {
    title: 'Why this matters',
    detail:
      'The core risk is not awareness. It is missed timing and weak relationship follow-through during narrow decision windows.',
  },
  {
    title: 'What this review now emphasizes',
    detail:
      'These pages now prioritize product clarity, behavior proof, and specific feedback requests over broad internal narrative.',
  },
  {
    title: 'Feedback requested',
    detail:
      'Name the strongest part, the least credible part, and the single blocking gap to fix first.',
  },
]

const LOOP_CLOSURE_SCORECARD = [
  {
    metric: 'Signals triaged in 24h',
    baseline: 'Not published publicly',
    laneOneTarget: 'Published in weekly readout with denominator',
  },
  {
    metric: 'Outreach actions per week',
    baseline: 'Tracked internally only',
    laneOneTarget: 'One benchmark surfaced in conversion narrative',
  },
  {
    metric: 'Follow-up completion rate',
    baseline: 'No end-to-end readout',
    laneOneTarget: 'Measured and reviewed weekly with guardrails',
  },
  {
    metric: 'Conversations started from tracked signals',
    baseline: 'Directionally discussed',
    laneOneTarget: 'Directional KPI with confidence note',
  },
]

const QA_CHECKLIST = [
  'Momentum Signal language is consistent with main landing narrative.',
  'Every quantitative phrase has source context or is labeled directional.',
  'Mark page CTAs are event tracked for engagement readout.',
  'Lane 1 deploy must be SUCCESS and verified live before close.',
]

export default function MarkSummaryPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mark-review" className="text-[13px] text-slate-400 hover:text-white transition-colors">
              Back to Review
            </Link>
            <TrackedCtaLink
              href="/signup"
              eventName="mark_summary_cta_click"
              eventProps={{ placement: 'top_nav', cta: 'try_free' }}
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Try free
            </TrackedCtaLink>
          </div>
        </div>
      </nav>

      <header className="bg-slate-900 px-4 sm:px-6 pt-14 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">Mark review summary</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.15] tracking-tight mb-5">
            Starting Monday: summary for quick review
          </h1>
          <p className="text-[15px] text-slate-300 leading-relaxed max-w-2xl mb-6">
            This is a short view of what Starting Monday is trying to do, what still needs proof, and where your feedback is most useful.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-20">
<div className="max-w-3xl mx-auto space-y-14">
          <section>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Decision brief in 4 cards</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DECISION_BRIEF.map((card) => (
                <div key={card.title} className="border border-slate-200 rounded p-4 bg-white">
                  <p className="text-[12px] font-semibold text-slate-900 mb-2">{card.title}</p>
                  <p className="text-[12px] text-slate-700 leading-relaxed">{card.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Loop-closure KPI scorecard</p>
            <div className="overflow-x-auto border border-slate-200 rounded bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Metric</th>
                    <th className="py-2 px-3 text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Baseline</th>
                    <th className="py-2 px-3 text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">Lane 1 target</th>
                  </tr>
                </thead>
                <tbody>
                  {LOOP_CLOSURE_SCORECARD.map((row) => (
                    <tr key={row.metric} className="border-b border-slate-100 align-top">
                      <td className="py-3 px-3 text-[13px] font-semibold text-slate-900">{row.metric}</td>
                      <td className="py-3 px-3 text-[13px] text-slate-700">{row.baseline}</td>
                      <td className="py-3 px-3 text-[13px] text-slate-700">{row.laneOneTarget}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-green-600 mb-4">Pre-meeting QA checklist</p>
            <div className="space-y-3">
              {QA_CHECKLIST.map((item) => (
                <div key={item} className="border border-green-300 bg-green-50 rounded p-4">
                  <p className="text-[12px] text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded border border-orange-300 bg-orange-50 p-5">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-600 mb-2">What I'm asking from you</p>
            <p className="text-[13px] text-slate-800 leading-relaxed">
              I am not asking for an endorsement. I am asking for candid product feedback. If it is good enough, would you suggest one or two executives who could review it and share direct feedback?
            </p>
          </section>

          <section className="flex flex-col sm:flex-row gap-4">
            <TrackedCtaLink
              href="/mark-review"
              eventName="mark_summary_cta_click"
              eventProps={{ placement: 'footer_actions', cta: 'back_to_review' }}
              className="inline-block border border-slate-400 hover:border-slate-600 text-slate-800 text-[14px] font-semibold px-6 py-3 rounded transition-colors text-center"
            >
              Back to Full Review
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/references"
              eventName="mark_summary_cta_click"
              eventProps={{ placement: 'footer_actions', cta: 'open_references' }}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-slate-900 text-[14px] font-semibold px-6 py-3 rounded transition-colors text-center"
            >
              Open Evidence and References
            </TrackedCtaLink>
          </section>
        </div>
      </main>

      <footer className="bg-slate-900 px-4 sm:px-6 py-10 border-t border-slate-800">
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] text-slate-400">Mark review lens: clarity, defensibility, conversion friction, and first-week user value.</p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

