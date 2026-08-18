import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for Fractional C-suite Technology Networks - Partner Guide',
  description: 'How fractional C-suite technology networks use Starting Monday to give members the infrastructure to track engagements, monitor target companies, and move to full-time when the right opportunity surfaces.',
  alternates: { canonical: 'https://startingmonday.app/for-fractional-executives' },
  openGraph: {
    title: 'Starting Monday for Fractional C-suite Technology Networks',
    description: 'Fractional executives are always searching. The question is whether the search is systematic or reactive.',
    url: 'https://startingmonday.app/for-fractional-executives',
  },
}

const FEATURES = [
  {
    name: 'Engagement Pipeline',
    forNetwork: 'Fractional executives track prospective engagements across fifteen to twenty-five target companies at any given time. Most track them in a spreadsheet or their inbox. Follow-ups get missed. Context disappears between conversations. Starting Monday\'s pipeline gives fractional executives a structured system: every prospective engagement logged, every conversation stage tracked, every follow-up scheduled. The same pipeline infrastructure used for full-time search works for fractional engagement tracking.',
    outcome: 'Members stop losing opportunities to follow-up failures and disorganized pipelines. Their engagement business runs like a system, not a memory exercise.',
  },
  {
    name: 'Company Intelligence Scanner',
    forNetwork: 'Fractional opportunities are created by organizational events: a PE acquisition that requires technology transformation, a leadership departure that creates an interim need, a funding event that requires infrastructure scale, a merger that requires integration architecture. Starting Monday monitors every company a member is tracking for exactly these signals. When the event surfaces, the member reaches out before the staffing firm gets the call.',
    outcome: 'Members identify fractional opportunities before they are posted anywhere. They enter the conversation as a known contact, not a cold applicant.',
  },
  {
    name: 'AI Prep Briefs',
    forNetwork: 'A new client meeting is not a job interview, but the preparation requirements are identical. The executive needs to understand the company situation, the technology posture, the operating challenges the technology function is facing, and the questions that demonstrate genuine operational depth. Starting Monday generates a full prep brief in about a minute before any high-stakes client meeting. The brief covers everything a peer would know.',
    outcome: 'Members arrive at new client meetings having done the research that distinguishes a seasoned operator from someone who read the website. That is visible in the first conversation.',
  },
  {
    name: 'Full-Time Transition Support',
    forNetwork: 'When a fractional engagement leads to a full-time conversation, the infrastructure is already built. Every company signal tracked, every conversation logged, the company intelligence assembled over weeks or months. The member does not restart a search from scratch. They accelerate into a full-time process with a head start. Starting Monday operates in both modes simultaneously.',
    outcome: 'The move from fractional to full-time is immediate, not a reset. Members are positioned from day one of the full-time conversation rather than scrambling to prepare.',
  },
  {
    name: 'Market Intelligence',
    forNetwork: 'The daily briefing surfaces new signals across all companies a member is tracking. For fractional executives, that intelligence has two uses: identifying new engagement opportunities and monitoring current clients for escalating situations that might expand the engagement scope. A signal on a current client\'s competitor can become the context for an expanded mandate.',
    outcome: 'Members stay ahead of the market they are working in. Their advice to clients is grounded in current market intelligence, not just the client\'s internal view.',
  },
]

export default function ForFractionalExecutivesPage() {
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
              Starting Monday for <span className="whitespace-nowrap">Fractional C-suite Technology Networks</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Fractional executives are always searching. The question is whether the search is systematic or reactive.
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['15-25', 'Typical prospective engagements a member may track at once'],
                ['1 platform', 'Fractional engagement pipeline and full-time transition support in one place'],
                ['30 days', 'Practical pilot window for member adoption and outcome review'],
              ].map(([value, label]) => (
                <div key={value} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <p className="text-[24px] font-bold text-slate-900 mb-1">{value}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{label}</p>
                </div>
              ))}
            </section>

            <section className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-2">Trust and operating boundary</p>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
                Member pipelines, prep materials, and search notes stay private to each account unless the member intentionally shares access. The network gets a partner program, not a hidden backdoor into confidential deal flow.
              </p>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Verification path: compare follow-through rate, meeting prep quality, and opportunity recovery over one month before expanding seats across the network.
              </p>
            </section>

            {/* What it is */}
            <section id="network-fit" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered platform built for C-suite technology executives.
                It gives them the infrastructure that senior searches require: monitoring of target companies
                for pre-search signals, AI-generated prep briefs, a structured engagement and relationship
                pipeline, and a daily briefing that keeps the search moving.
              </p>
              <p>
                For fractional C-suite technology networks, the platform serves a dual function: it supports the
                ongoing fractional engagement business and supports the eventual full-time search when the
                time is right. Members use one platform for both modes.
              </p>
            </section>

            {/* The gap */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">The gap it fills</h2>
              <p>
                A fractional C-suite executive managing three active engagements and fifteen prospective targets is
                running a business development operation with no infrastructure. They track prospects
                in a spreadsheet, prepare for client meetings the night before, and find out about new
                fractional opportunities when a colleague mentions them or when a posting appears on
                LinkedIn.
              </p>
              <p>
                The executives on your network who do this well are the exception. Most are leaving
                engagement opportunities on the table because the pipeline is disorganized, the signal
                monitoring is manual, and the preparation is inconsistent. That is a network performance
                problem, not just an individual one.
              </p>
              <p>
                Starting Monday replaces the manual infrastructure with a platform built for exactly
                this search profile.
              </p>
            </section>

            {/* How networks use it */}
            <section id="network-playbook" className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">How fractional networks use it</h2>
              <div className="space-y-8">
                {FEATURES.map(f => (
                  <details key={f.name} className="border-l-2 border-orange-500 pl-5 group" open>
                    <summary className="list-none cursor-pointer flex items-center justify-between">
                      <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600">{f.name}</p>
                      <span className="text-slate-500 group-open:rotate-180 transition-transform">v</span>
                    </summary>
                    <div className="mt-2">
                      <p className="text-[15px] text-slate-700 leading-relaxed mb-2">{f.forNetwork}</p>
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
                Starting Monday does not replace the matchmaking, client relationships, or business
                development infrastructure that your network provides. It does not source new clients
                for your members or manage contracts and billing. It does not know the specific client
                dynamics, internal politics, or engagement terms that your members navigate.
              </p>
              <p>
                It handles the research, the tracking, and the intelligence. Your network handles the
                relationships and the placements.
              </p>
            </section>

            {/* For your network */}
            <section id="network-program" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">For your network</h2>
              <p>
                The simplest way to start: make Starting Monday available as a member resource and
                ask a few members to use it for one month. The feedback from members who have been
                manually tracking their pipeline will be immediate.
              </p>
              <ul className="space-y-2 pl-4">
                {[
                  'Members get a 30-day free trial, no credit card required',
                  'Active plan ($199/month) includes all AI features: engagement pipeline, company intelligence, prep briefs',
                  'Executive plan ($499/month) for members running full-time searches alongside fractional work',
                  'Bulk seat pricing available for networks enrolling multiple members',
                  'Apply to the partner program at startingmonday.app/partners to receive your referral link and partner resource kit',
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
                Get started now &rarr;
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

