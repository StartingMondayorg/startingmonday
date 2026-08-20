import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for PE Operating Partners - Partner Guide',
  description: 'How PE operating partners use Starting Monday to equip technology executive candidates and reduce search timeline risk on portfolio company mandates.',
  alternates: { canonical: 'https://startingmonday.app/for-pe-partners' },
  openGraph: {
    title: 'Starting Monday for PE Operating Partners',
    description: 'The search timeline is a risk to the value creation plan. Starting Monday compresses it.',
    url: 'https://startingmonday.app/for-pe-partners',
  },
}

const FEATURES = [
  {
    name: 'Pre-Search Signal Intelligence',
    forFirm: 'Your portfolio company needs a new CIO. The mandate goes to a search firm. The firm assembles a long list. Six weeks pass before you see candidates. Starting Monday inverts that sequence. Executives who are already monitoring your portfolio companies - watching for leadership changes, funding activity, technology team signals - are positioned before the mandate is even formalized.',
    outcome: 'The right candidates reach out before the search goes to a firm. That is a shorter timeline, a warmer candidate, and a relationship that started before the formal process. That matters to a value creation schedule.',
  },
  {
    name: 'Candidate Preparation for Your Mandates',
    forFirm: 'When you are evaluating technology executive candidates for a portfolio company, the quality of their preparation signals the quality of their judgment. A candidate who walks in with a clear analysis of the company situation, a specific thesis for the technology function, and informed questions about the operating environment is a different category of candidate. Starting Monday gives executives the platform to build that preparation.',
    outcome: 'The candidates you see are prepared at depth. The first conversation moves faster. Less time explaining the company situation, more time evaluating fit.',
  },
  {
    name: 'Pipeline Visibility for Operating Partners',
    forFirm: 'If you are working with executives who are candidates for multiple portfolio company roles simultaneously, pipeline view access gives you a clear picture of where each candidate\'s attention is, which conversations are active, and where timing may create conflicts. It is the same view the executive has - without requiring a status call.',
    outcome: 'You stay current on candidate activity without additional touchpoints. Scheduling decisions and timing conversations become more informed.',
  },
  {
    name: 'AI Interview Prep for Portfolio Company Interviews',
    forFirm: 'Before any candidate interviews at a portfolio company, the platform generates a full prep brief: company situation from public signals, the operating challenges the technology function likely faces, the questions that demonstrate operational seriousness, and the narrative the candidate should lead with. The brief is assembled from public signals, not from anything proprietary.',
    outcome: 'Candidates arrive at portfolio company interviews with genuine operational depth. That is a better signal for the hiring committee and a faster path to conviction.',
  },
]

export default function ForPePartnersPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo?from=pe-partners" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              See a demo
            </Link>
            <Link
              href="/partners?from=pe-partners"
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
              Starting Monday for <span className="whitespace-nowrap">PE Operating Partners</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              The search timeline for technology executive roles is a risk to the value creation plan. Starting Monday compresses it - from the candidate side.
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            {/* What it is */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered search platform built for VP and C-suite technology
                executives in active career transition. It gives them the intelligence infrastructure
                that senior searches require: monitoring of target companies for pre-search signals,
                AI-generated prep briefs for every interview, structured pipeline tracking, and a
                daily briefing that keeps the search moving.
              </p>
              <p>
                For PE operating partners, the platform serves a specific function: it puts prepared,
                informed technology executive candidates in front of the right opportunities faster -
                including at your portfolio companies, before and during formal search mandates.
              </p>
            </section>

            {/* The gap */}
            <section id="timeline-problem" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">The timeline problem</h2>
              <p>
                A portfolio company technology leadership gap has a direct cost. Every week without
                a CIO or VP of Technology in place is a week the value creation plan slips. The
                retained search process is thorough, but it is slow. Six to twelve weeks from mandate
                to offer is typical. First-round failures extend that.
              </p>
              <p>
                The most common cause of first-round failure at the senior level is not fit - it is
                preparation. A candidate who did not understand the company situation. A candidate
                who had not thought through the technology operating model. A candidate who answered
                questions like a job seeker instead of a peer.
              </p>
              <p>
                Starting Monday does not replace the search firm. It gives the executive the
                preparation infrastructure to show up as the right person when the moment comes.
              </p>
              <p className="text-[13px] text-slate-500">
                Evidence cue: compressing first-round decision quality reduces avoidable mandate resets.
              </p>
            </section>

            {/* How operating partners use it */}
            <section id="partner-usage" className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">How operating partners use it</h2>
              <div className="space-y-8">
                {FEATURES.map(f => (
                  <div key={f.name} className="border-l-2 border-orange-500 pl-5">
                    <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600 mb-2">{f.name}</p>
                    <p className="text-[15px] text-slate-700 leading-relaxed mb-2">{f.forFirm}</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      <span className="font-semibold text-slate-700">Outcome: </span>{f.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* For your network */}
            <section id="network" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">For your executive network</h2>
              <p>
                PE operating partners typically maintain relationships with 20 to 50 senior technology
                executives who may be candidates for portfolio company roles over time. Starting Monday
                gives you something concrete to offer those relationships between mandates: a platform
                that keeps them sharp, informed, and positioned.
              </p>
              <p>
                When a mandate opens, the executives you have referred to Starting Monday are already
                watching the right signals, already prepared to have the right conversation.
              </p>
              <ul className="space-y-2 pl-4">
                {[
                  'Executives get a 30-day free trial, no credit card required',
                  'Active plan ($199/month) includes all AI features: prep briefs, strategy brief, company intelligence',
                  'Executive plan ($499/month) for executives running intensive active searches',
                  'Partner program: apply at startingmonday.app/partners for your referral link and partner resource kit for your executive network',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-orange-500 font-bold shrink-0 mt-0.5">+</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Apply CTA */}
            <section id="partner-cta" className="bg-slate-50 border border-slate-200 rounded-lg p-7">
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
                <Link href="/demo?from=pe-partners" className="text-slate-600 underline hover:text-slate-900 transition-colors">
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

