import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Metric Dictionary | Starting Monday',
  description: 'Canonical source-of-truth metric definitions for outplacement partner pilots and governance reviews.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/metric-dictionary' },
}

const METRICS = [
  {
    name: 'Activation rate',
    numerator: 'Participants with complete setup and target list baseline.',
    denominator: 'Assigned seats for the cohort.',
    window: 'Weekly and day-30 checkpoint.',
    owner: 'Program analytics owner',
  },
  {
    name: 'Signal-driven action rate',
    numerator: 'Active participants with at least one logged signal-driven action in period.',
    denominator: 'Active participants in period.',
    window: 'Weekly and day-30 checkpoint.',
    owner: 'Program lead',
  },
  {
    name: 'Prep-readiness rate',
    numerator: 'High-stakes meetings with prep brief reviewed before meeting.',
    denominator: 'High-stakes meetings in period.',
    window: 'Weekly and day-30/day-60/day-90 reviews.',
    owner: 'Counselor lead',
  },
  {
    name: 'Stall index',
    numerator: 'Participants with 7+ days without meaningful action.',
    denominator: 'Active participants in period.',
    window: 'Weekly operating review.',
    owner: 'Program lead',
  },
  {
    name: 'Session strategy-time ratio',
    numerator: 'Minutes in session on strategic decisions and coaching interventions.',
    denominator: 'Total session minutes.',
    window: 'Biweekly counselor quality review; day-60 and day-90 checkpoints.',
    owner: 'Counselor lead',
  },
]

const GOVERNANCE_RULES = [
  'Do not redefine numerators or denominators mid-cycle without documented sponsor approval.',
  'If a metric definition changes, publish version note and effective date.',
  'Use same dictionary definitions for day-30, day-60, and day-90 decisions unless governance approves an update.',
  'Metric dictionary owner publishes updates and notifies all informed stakeholders.',
]

export default function OutplacementMetricDictionaryPage() {
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">Metric dictionary</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Canonical source of truth for pilot metrics.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-3xl">
            This page locks definitions for partner governance so operations, counselors, sponsors, and client HR evaluate the same evidence with the same math.
          </p>
        </header>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Numerator</th>
                  <th className="px-4 py-3 font-semibold">Denominator</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                  <th className="px-4 py-3 font-semibold">Metric owner</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((row) => (
                  <tr key={row.name} className="border-t border-slate-200 bg-white align-top">
                    <td className="px-4 py-3 text-slate-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.numerator}</td>
                    <td className="px-4 py-3 text-slate-600">{row.denominator}</td>
                    <td className="px-4 py-3 text-slate-600">{row.window}</td>
                    <td className="px-4 py-3 text-slate-700">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Governance rules</p>
          {GOVERNANCE_RULES.map((rule) => (
            <p key={rule} className="text-[14px] text-slate-700 leading-relaxed">+ {rule}</p>
          ))}
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Next step</p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/for-outplacement/operating-scorecard" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open printable operating scorecard
            </Link>
            <Link href="/for-outplacement/economics" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Return to economics
            </Link>
            <Link href="/for-outplacement/runbook" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open runbook
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

