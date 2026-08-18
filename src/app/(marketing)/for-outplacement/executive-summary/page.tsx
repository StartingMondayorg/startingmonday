import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Executive Summary | Starting Monday',
  description: 'One-page committee summary for procurement, legal, and program sponsors evaluating outplacement pilot rollout.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/executive-summary' },
}

const SUCCESS_DEFINITION = [
  'Partner and client HR agree baseline, metric definitions, and day-30 pass/fail criteria before launch.',
  'Pilot succeeds only if adoption, signal-response, and prep-readiness thresholds are met in agreed measurement window.',
  'Expansion requires sponsor sign-off on day-30 evidence and governance notes, not narrative-only confidence.',
]

const NO_REGRET_SCOPE = [
  'One cohort, fixed decision window, and explicit pass/fail criteria in contract scope.',
  'Parallel legal/security track during kickoff week to reduce approval delay risk.',
  'If pilot criteria are missed, close without expansion commitment and retain artifacts for future decisions.',
]

const IMPLEMENTATION_BURDEN = [
  {
    owner: 'Starting Monday',
    owns: 'Platform setup, scorecard framework, runbook templates, and weekly review packet structure.',
  },
  {
    owner: 'Partner program lead',
    owns: 'Cohort nomination, governance ownership, and intervention accountability assignment.',
  },
  {
    owner: 'Counselor leads',
    owns: 'Session integration, participant adherence coaching, and red-flag intervention execution.',
  },
]

const CLAIMS_POLICY = [
  'Use observed cohort outcomes and disclose measurement window.',
  'Avoid guaranteed placement claims from directional pilot indicators.',
  'Separate partner-observed outcomes from historical market benchmarks.',
]

export default function OutplacementExecutiveSummaryPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to outplacement page
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
<header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">Executive summary</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Committee one-pager for pilot approval decisions.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            Use this page in procurement, legal, and sponsor conversations when deciding whether to run a 30-day outplacement cohort pilot.
          </p>
        </header>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">What this solves</p>
          <p className="text-[14px] text-slate-700 leading-relaxed">
            Outplacement teams already provide coaching and workshops. The operating-layer gap is between-session execution consistency: signal timing, prep discipline, and cohort-level visibility. Starting Monday addresses that operating gap while preserving counselor judgment.
          </p>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Success definition partner and client HR can share</p>
          <ul className="space-y-2">
            {SUCCESS_DEFINITION.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">No-regret pilot scope and contract shape</p>
          <ul className="space-y-2">
            {NO_REGRET_SCOPE.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Implementation burden split</p>
          <div className="space-y-3">
            {IMPLEMENTATION_BURDEN.map((item) => (
              <div key={item.owner} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{item.owner}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.owns}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Board-safe claims policy</p>
          <ul className="space-y-2">
            {CLAIMS_POLICY.map((item) => (
              <li key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</li>
            ))}
          </ul>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Next step</p>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Would it be unreasonable to approve one 30-day cohort with explicit pass/fail criteria before deciding on broader rollout?
          </p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/partners#apply" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Apply to partner program
            </Link>
            <Link href="/for-outplacement/economics" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              View economics and commercial examples
            </Link>
            <Link href="/for-outplacement/runbook" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open pilot runbook and templates
            </Link>
          </div>
          <p className="text-[12px] text-slate-500 mt-4 leading-relaxed">
            Clean no path: if criteria are not met, close without expansion commitment.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

