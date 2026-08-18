import type { Metadata } from 'next'
import Link from 'next/link'
import { ProofStoriesModule } from '@/components/channel/ProofStoriesModule'

export const metadata: Metadata = {
  title: 'Starting Monday for Executive Financial Advisors - Partner Guide',
  description: 'How financial advisors help clients execute leadership transitions with clearer timing, prep discipline, and search visibility.',
  alternates: { canonical: 'https://startingmonday.app/for-financial-advisors' },
  openGraph: {
    title: 'Starting Monday for Executive Financial Advisors',
    description: 'Your client is about to start a search. You know the timeline, the runway, and the compensation target. Starting Monday gives them the infrastructure to execute it.',
    url: 'https://startingmonday.app/for-financial-advisors',
  },
}

const FEATURES = [
  {
    name: 'Search Timeline Intelligence',
    forAdvisor: 'How long the search takes has direct financial consequences. The primary cause of search timeline extensions at the senior level is not fit - it is preparation failures in the first round. A candidate who arrives underprepared gets cut. The search extends six to eight weeks. That is runway consumed and income deferred. Starting Monday reduces first-round failures through AI-generated prep briefs, company intelligence, and structured pipeline discipline. A shorter search is a better financial outcome.',
    outcome: 'Your clients consume less runway, reach their next compensation event faster, and spend less time in the psychological cost of an extended search. That is a planning variable you can actually influence.',
  },
  {
    name: 'Pre-Decision Signal Monitoring',
    forAdvisor: 'Most executives start a formal search after a role is posted. At the VP and C-suite level, that is too late. The role was assembled through informal channels three to six weeks before the posting. Starting Monday monitors target companies for the signals that precede a search: executive departures, board changes, PE ownership transitions, 8-K filings, career page activity. Your client reaches out before the field is set. That changes the entire search economics.',
    outcome: 'Clients enter conversations when they are one of two or three candidates instead of one of twenty. The quality of the opportunity and the leverage in negotiations both improve.',
  },
  {
    name: 'Compensation Context',
    forAdvisor: 'The strategy brief generated from your client\'s background and target list covers their competitive positioning, the roles they are most likely to win, and what the market typically pays in those roles. That data is directly useful to your compensation planning work - benchmarking the target, modeling the equity structure, and setting realistic expectations for the negotiation.',
    outcome: 'You arrive at compensation planning conversations with better data. Your client has an informed view of what the next role should pay before the offer comes in.',
  },
  {
    name: 'Transition Readiness Assessment',
    forAdvisor: 'Before your client activates a formal search, the platform generates a full strategy brief: where they are competitive, where the narrative needs work, which sectors are most relevant, and what the search timeline is likely to look like. That assessment informs the runway conversation. If the strategy brief suggests a 12-month search, the financial plan looks different than if it suggests six months.',
    outcome: 'You and your client make the timing decision with real data, not assumptions. The financial plan and the career plan align from the start.',
  },
  {
    name: 'Pipeline Visibility',
    forAdvisor: 'If your client shares pipeline view access with you, you see exactly where the search stands: which companies are in process, which conversations are active, which follow-ups are overdue. You know whether the search is moving before your client tells you it is stalled. That is context for every financial planning conversation during transition.',
    outcome: 'Your conversations during the search are grounded in actual search activity, not self-reported impressions. You can give better advice about runway, spending discipline, and timing.',
  },
]

const FINANCIAL_ADVISOR_PROOF_STORIES = [
  {
    title: 'Runway risk reduction',
    role: 'Advisor with active transition client',
    outcome: 'Earlier signal-based outreach helped reduce search delay risk in runway planning scenarios.',
  },
  {
    title: 'Comp planning clarity',
    role: 'Client entering VP-level process',
    outcome: 'Role and comp expectations were aligned earlier, reducing late-stage negotiation surprises.',
  },
  {
    title: 'Shared operating context',
    role: 'Advisor-client pair',
    outcome: 'Pipeline visibility improved quality of planning calls during the transition period.',
  },
]

export default function ForFinancialAdvisorsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              See a demo
            </Link>
            <Link
              href="/partners"
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* Header */}
        <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              Partner Guide
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              Starting Monday for <span className="whitespace-nowrap">Executive Financial Advisors</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Your client is about to start a search. You know the timeline, the runway, and the compensation target. Starting Monday gives them the infrastructure to execute it.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Why now</p>
              <p className="text-[13px] leading-relaxed text-slate-200">Search delays and weak first rounds directly change runway math. Better prep and timing improve financial outcomes, not just career outcomes.</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">This week</p>
              <ol className="space-y-1 text-[13px] leading-relaxed text-slate-200">
                <li>1. Pick one transition client and set a 30-day operating baseline.</li>
                <li>2. Align role target and comp expectation before active interview loops.</li>
                <li>3. Review weekly motion with shared pipeline context, not anecdotal updates.</li>
              </ol>
            </div>
          </div>
        </header>

        <ProofStoriesModule
          title="Role-specific outcomes for advisor-led transitions"
          stories={FINANCIAL_ADVISOR_PROOF_STORIES}
          sourceNote="Directional partner stories; validate with your own client baseline and 30-day review."
        />

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['30 days', 'Decision window to judge whether the client search becomes more disciplined'],
                ['6-8 weeks', 'Typical extension risk when first-round prep failures compound'],
                ['1 shared view', 'Pipeline visibility that improves runway and compensation planning conversations'],
              ].map(([value, label]) => (
                <div key={value} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <p className="text-[24px] font-bold text-slate-900 mb-1">{value}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{label}</p>
                </div>
              ))}
            </section>

            <section className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-2">Trust and confidentiality</p>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
                The client controls who sees their pipeline. Advisor visibility is shared intentionally, and confidential search materials stay inside the user account rather than being forwarded across email threads.
              </p>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Evidence path: use a 30-day client pilot, compare runway planning confidence before and after, and keep the decision anchored to observed search motion rather than anecdote.
              </p>
            </section>

            {/* What it is */}
            <section id="advisor-fit" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered job search platform built for leadership-level transitions.
                It gives them the intelligence infrastructure that senior searches require: monitoring of
                target companies for pre-search signals, AI-generated prep briefs for every interview,
                a structured pipeline for tracking relationships and conversations, and a daily briefing
                that keeps the search moving.
              </p>
              <p>
                For financial advisors who work with senior technology executives, the platform matters
                because the search timeline and outcome are financial planning variables. How long the
                search takes, what the next role pays, and whether the executive enters conversations
                before or after the short list is assembled - these are outcomes that Starting Monday
                directly improves.
              </p>
            </section>

            {/* Why advisors care */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">Why advisors are positioned to help</h2>
              <p>
                You are often the first person a senior executive calls when they are thinking about a
                career change. Before the search starts, before the coach is hired, before the search
                firm is engaged - you already have the conversation about runway, equity, and what the
                next role needs to accomplish financially.
              </p>
              <p>
                That conversation positions you to recommend the infrastructure your client needs to
                execute the search well. Most executives enter a senior search without the right tools.
                They track 40 companies in a spreadsheet. They prepare for interviews the night before
                with a ten-minute web search. They find out about open roles three weeks after the short
                list was assembled. Those failures have financial consequences that show up in your
                planning models.
              </p>
              <p>
                Starting Monday fills that infrastructure gap. Your recommendation carries weight because
                the relationship already exists and the financial stakes are already understood.
              </p>
            </section>

            {/* How advisors use it */}
            <section id="advisor-playbook" className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">How financial advisors use it</h2>
              <div className="space-y-8">
                {FEATURES.map(f => (
                  <details key={f.name} className="border-l-2 border-orange-500 pl-5 group" open>
                    <summary className="list-none cursor-pointer flex items-center justify-between">
                      <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600">{f.name}</p>
                      <span className="text-slate-500 group-open:rotate-180 transition-transform">v</span>
                    </summary>
                    <div className="mt-2">
                      <p className="text-[15px] text-slate-700 leading-relaxed mb-2">{f.forAdvisor}</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        <span className="font-semibold text-slate-700">Outcome: </span>{f.outcome}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* What it does not do */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What it does not do</h2>
              <p>
                Starting Monday does not replace the financial planning, compensation modeling, or
                equity analysis that you provide. It does not know the specifics of your client's
                vesting schedule, tax situation, or liquidity needs. It does not replace the executive
                coach or the search firm.
              </p>
              <p>
                It handles the research, the tracking, and the search infrastructure. You handle the
                financial strategy that depends on the search outcome.
              </p>
            </section>

            {/* For your practice */}
            <section id="practice" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">For your practice</h2>
              <p>
                The simplest way to start: recommend Starting Monday to your next client who is
                entering or considering a career transition. Ask them to share pipeline view access
                with you so you can see the search activity alongside the financial picture.
              </p>
              <ul className="space-y-2 pl-4">
                {[
                  'Clients get a 30-day free trial, no credit card required',
                  'Active plan ($199/month) includes all AI features: prep briefs, strategy brief, company intelligence',
                  'Executive plan ($499/month) for clients running intensive searches with board-level target roles',
                  'View access: your client controls who can see their pipeline',
                  'Apply to the partner program at startingmonday.app/partners to receive your referral link, commission tracking, and partner resource kit',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-orange-500 font-bold shrink-0 mt-0.5">+</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Apply CTA */}
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-7">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
                Ready to partner?
              </p>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3 leading-snug">
                Apply to the partner program
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                Fill out the application and we will follow up within 2 business days with your referral link, commission tracking, and partner resource kit.
              </p>
              <Link
                href="/partners#apply"
                className="inline-block bg-orange-500 text-slate-900 text-[14px] font-bold px-7 py-3 rounded hover:bg-orange-600 transition-colors"
              >
                Apply now &rarr;
              </Link>
              <p className="text-[13px] text-slate-200 mt-4">
                Want to see the platform first?{' '}
                <Link href="/demo" className="text-slate-600 underline hover:text-slate-900 transition-colors">
                  Walk through a live demo
                </Link>
                .
              </p>
            </section>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-500">
            Questions? contact@startingmonday.app
          </p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>

    </div>
  )
}

