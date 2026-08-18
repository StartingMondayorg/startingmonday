import type { Metadata } from 'next'
import Link from 'next/link'
import { ProofStoriesModule } from '@/components/channel/ProofStoriesModule'

export const metadata: Metadata = {
  title: 'Starting Monday for Relocation Firms - Partner Guide',
  description: 'How relocation firms use Starting Monday to give relocated executives and trailing spouses a search advantage in their new market.',
  alternates: { canonical: 'https://startingmonday.app/for-relocation' },
  openGraph: {
    title: 'Starting Monday for Relocation Firms',
    description: 'You know the moment an executive lands in a new market. That window is brief. We help them act on it.',
    url: 'https://startingmonday.app/for-relocation',
  },
}

const FEATURES = [
  {
    name: 'New Market Target List',
    forFirm: 'An executive who just relocated to a new city does not know which companies are worth pursuing, which teams are growing, or which leadership vacancies are about to surface. Starting Monday builds a target list for the new market - monitoring companies the executive adds for executive changes, funding, career page signals, and organizational patterns that precede senior executive searches.',
    outcome: 'Executives identify the right companies in the new market faster. They are reaching out to the right people before the role is posted.',
  },
  {
    name: 'Relationship Pipeline',
    forFirm: 'A relocated executive is rebuilding their professional network from scratch. Starting Monday gives them a structured pipeline to track every new relationship: who they have met, what was discussed, what the follow-up is, and when. Without structure, the networking effort becomes ad hoc and stalls within weeks.',
    outcome: 'Executives stay in motion after the move. The network-building effort is trackable, not just aspirational.',
  },
  {
    name: 'AI Interview Prep Briefs',
    forFirm: 'In the new market, executives are interviewing at companies they do not know well. Before every interview, Starting Monday generates a full prep brief: company situation, the technology function context, the narrative to lead with, likely objections, and the questions that demonstrate genuine preparation. It draws from everything the executive has tracked.',
    outcome: 'Executives interview at unfamiliar companies with depth preparation. They arrive as peers, not outsiders.',
  },
  {
    name: 'Daily Search Discipline',
    forFirm: 'Relocation is disruptive. The executive is settling a new home, finding schools, rebuilding a social network. The job search competes with everything else and often loses. The daily briefing from Starting Monday installs a rhythm: new signals on tracked companies, pending follow-ups, pipeline actions overdue. The search stays active through the disruption.',
    outcome: 'Executives who would otherwise drift during relocation stay engaged with their search. Your program outcomes improve.',
  },
  {
    name: 'Trailing Executive Career Services',
    forFirm: 'Many corporate relocations involve a dual-career couple. When one executive moves for their employer, their spouse or partner often needs to find a new role in the destination city. Starting Monday gives trailing executives the same search infrastructure: target list, pipeline, prep briefs, daily briefing. No separate enrollment process.',
    outcome: 'Your relocation program solves the dual-career problem with a concrete tool, not just a list of local recruiters. That is a meaningful differentiator for corporate clients evaluating relocation providers.',
  },
]

const RELOCATION_PROOF_STORIES = [
  {
    title: 'First-30-day market entry',
    role: 'Relocated technology leader',
    outcome: 'Reached relevant local conversations earlier by prioritizing signal-backed target companies.',
  },
  {
    title: 'Dual-career support case',
    role: 'Relocation program lead',
    outcome: 'Program retained momentum by supporting both relocated executive and partner transition workflows.',
  },
  {
    title: 'Counselor handoff quality',
    role: 'Relocation advisor',
    outcome: 'Shared operating context reduced repeated onboarding friction in early weeks post-move.',
  },
]

export default function ForRelocationPage() {
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
              Starting Monday for <span className="whitespace-nowrap">Relocation Firms</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              You know the moment an executive lands in a new market. That window is brief. Starting Monday gives them the search infrastructure to act on it.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Why now</p>
              <p className="text-[13px] leading-relaxed text-slate-200">The first month after relocation shapes search momentum. Waiting until the market is familiar usually means missing the highest-leverage openings.</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">This week</p>
              <ol className="space-y-1 text-[13px] leading-relaxed text-slate-200">
                <li>1. Build a destination-city target list with 10 to 15 companies.</li>
                <li>2. Trigger one signal-based outreach action per active participant.</li>
                <li>3. Review dual-career risk and intervention priorities in one weekly check-in.</li>
              </ol>
            </div>
          </div>
        </header>

        <ProofStoriesModule
          title="Role-specific outcomes for relocation programs"
          stories={RELOCATION_PROOF_STORIES}
          sourceNote="Directional outcomes from relocation-aligned use cases; validate in your own cohort baseline."
        />

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['30 days', 'Critical early window after relocation before the market goes cold'],
                ['2 careers', 'Dual-career support for the relocated executive and trailing spouse'],
                ['1 daily briefing', 'Lightweight cadence that protects search momentum during a disruptive move'],
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
                Relocation searches are often confidential, time-bound, and emotionally loaded. Search notes, prep materials, and pipeline activity stay private to the executive unless they choose to share access.
              </p>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Evidence path: run a pilot with one relocated cohort, compare speed to first targeted outreach and interview readiness after 30 days, then decide whether broader inclusion improves program outcomes.
              </p>
            </section>

            {/* What it is */}
            <section id="relocation-fit" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered job search platform built for leadership-level transitions.
                It gives them the intelligence infrastructure that senior searches require: monitoring of
                target companies for pre-search signals, AI-generated prep briefs for every interview,
                a structured pipeline for tracking relationships and conversations, and a daily briefing
                that keeps the search moving.
              </p>
              <p>
                For relocation firms, the platform serves a specific function: it gives newly relocated
                executives a systematic way to enter a new market and build the relationships that lead
                to senior roles - before searches are posted and before the moment passes.
              </p>
            </section>

            {/* The gap */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">The gap it fills</h2>
              <p>
                An executive who relocates to a new city faces a compounding problem. They are disrupted
                personally at the exact moment they need to be most effective professionally. They do not
                know the local market, the local relationships, or which companies are worth pursuing.
                They have no intelligence infrastructure to monitor the new market for signals.
              </p>
              <p>
                Most relocated executives rely on LinkedIn searches, a few cold introductions, and
                whatever local recruiters happen to reach out. That is not a campaign. That is waiting.
                At the VP and C-suite level, the window to establish yourself in a new market before
                the good opportunities are filled is shorter than most executives expect.
              </p>
              <p>
                Starting Monday replaces the manual effort with infrastructure. The executive builds
                a target list for the new market, monitors it for signals, tracks every relationship
                they are building, and prepares for every conversation.
              </p>
            </section>

            {/* How relocation firms use it */}
            <section id="relocation-playbook" className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">How relocation firms use it</h2>
              <div className="space-y-8">
                {FEATURES.map(f => (
                  <details key={f.name} className="border-l-2 border-orange-500 pl-5 group" open>
                    <summary className="list-none cursor-pointer flex items-center justify-between">
                      <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600">{f.name}</p>
                      <span className="text-slate-500 group-open:rotate-180 transition-transform">v</span>
                    </summary>
                    <div className="mt-2">
                      <p className="text-[15px] text-slate-700 leading-relaxed mb-2">{f.forFirm}</p>
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
                Starting Monday does not replace the destination services your firm provides:
                the community introductions, the local market orientation, the housing and school
                placement services. It does not know the informal reputation dynamics in a local
                market or which local executives can make a warm introduction at a target company.
              </p>
              <p>
                It handles the research, the pipeline tracking, and the daily search discipline.
                Your team handles everything else.
              </p>
            </section>

            {/* For your program */}
            <section id="relocation-program" className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">For your program</h2>
              <p>
                The simplest way to start: include Starting Monday as a destination services resource
                for the next VP or C-suite executive in your program. For corporate relocation programs,
                we offer bulk seat pricing with activation tracking.
              </p>
              <ul className="space-y-2 pl-4">
                {[
                  'Executives get a 30-day free trial, no credit card required',
                  'Active plan ($199/month) includes all AI features: prep briefs, strategy brief, company intelligence',
                  'Monitor plan ($49/month) for executives building a target list before active search mode',
                  'Bulk seat pricing available for corporate relocation programs',
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

