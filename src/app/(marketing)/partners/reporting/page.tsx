import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Partner Reporting Packet - Starting Monday',
  description: 'Partner reporting template with closeout, renewal, and expansion packet structures across day-30/day-60/day-90 decision gates.',
  alternates: { canonical: 'https://startingmonday.app/partners/reporting' },
}

const REPORTING_TEMPLATE = [
  'Partner summary and account scope',
  'KPI performance snapshot with trend notes',
  'Execution quality findings and coaching actions',
  'Risk flags, stalled campaigns, and recommended interventions',
  'Next-month commitments and owner map',
]

const RENEWAL_PACKET = [
  'Contract period performance narrative and cohort outcomes',
  'KPI trend appendix with source notes',
  'Program-level wins, losses, and confidence statement',
  'Renewal options with plan economics and support levels',
  'Decision checklist and timeline',
]

const CLOSEOUT_PACKET = [
  'Day-30 pass/tune/stop decision outcome with rationale',
  'Execution delta versus baseline plus unresolved risks',
  'Trust and data confidence review for sponsor signoff',
  'Commercial closeout position and next checkpoint owner',
]

const EXPANSION_PACKET = [
  'Day-60 scale-readiness review across activation and variance',
  'Day-90 stability and renewal-confidence review',
  'Expansion economics, support options, and contract path',
  'Operating commitments for governance and reporting cadence',
]

const REPORT_VARIANTS = [
  {
    name: 'Enterprise board review',
    focus: 'Governance, risk visibility, and board-ready KPI framing.',
    sections: 'Cohort breakdown, weekly trend, narrative summary',
  },
  {
    name: 'Growth operations',
    focus: 'Operator-facing trend interpretation and intervention planning.',
    sections: 'Cohort breakdown, weekly trend, action narrative',
  },
  {
    name: 'Pilot compact',
    focus: 'Fast executive readout for pilot proof and renewal checkpoints.',
    sections: 'Cohort breakdown, concise narrative, renewal summary',
  },
]

export default function PartnerReportingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/partners" className="text-[13px] text-slate-200 hover:text-white transition-colors">Back to partners</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <header className="mb-9">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-orange-500 mb-3">Partner operations</p>
          <h1 className="text-[34px] sm:text-[42px] font-bold text-slate-900 leading-tight mb-4">Partner reporting and renewal packet</h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-3xl">
            Standardized structure for monthly partner reporting, closeout, renewal, and expansion decisions.
          </p>
        </header>

        <section className="mb-8 border border-slate-200 rounded-lg p-5 sm:p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Monthly partner report template</p>
          <ul className="space-y-2">
            {REPORTING_TEMPLATE.map((item) => (
              <li key={item} className="text-[13px] text-slate-700">- {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 border border-slate-200 rounded-lg p-5 sm:p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Pilot closeout packet template (day-30)</p>
          <ul className="space-y-2 mb-5">
            {CLOSEOUT_PACKET.map((item) => (
              <li key={item} className="text-[13px] text-slate-700">- {item}</li>
            ))}
          </ul>

          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Renewal decision packet template</p>
          <ul className="space-y-2 mb-5">
            {RENEWAL_PACKET.map((item) => (
              <li key={item} className="text-[13px] text-slate-700">- {item}</li>
            ))}
          </ul>

          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Expansion packet template (day-60/day-90)</p>
          <ul className="space-y-2">
            {EXPANSION_PACKET.map((item) => (
              <li key={item} className="text-[13px] text-slate-700">- {item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 border border-slate-200 rounded-lg p-5 sm:p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Report template variants</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REPORT_VARIANTS.map((variant) => (
              <article key={variant.name} className="rounded border border-slate-200 bg-white p-4">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{variant.name}</p>
                <p className="text-[12px] text-slate-600 leading-relaxed mb-2">{variant.focus}</p>
                <p className="text-[12px] text-slate-500"><span className="font-semibold text-slate-700">Default sections:</span> {variant.sections}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-slate-600">
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900 mb-1">Monthly report template artifact</p>
              <p>docs/partners/monthly-partner-report-template.md</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900 mb-1">Renewal packet template artifact</p>
              <p>docs/partners/renewal-decision-packet-template.md</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900 mb-1">Pilot closeout packet template artifact</p>
              <p>docs/partners/pilot-closeout-packet-template.md</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900 mb-1">Expansion packet template artifact</p>
              <p>docs/partners/expansion-packet-template.md</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-3 sm:col-span-2">
              <p className="font-semibold text-slate-900 mb-1">First issued report artifact</p>
              <p>docs/partners/reports/2026-06-pilot-partner-report.md</p>
            </div>
          </div>
        </section>

        <section className="border border-emerald-200 rounded-lg p-5 sm:p-6 bg-emerald-50">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-emerald-700 mb-2">First issued report</p>
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Pilot partner monthly report issued for June 2026</h2>
          <p className="text-[13px] text-slate-700 leading-relaxed">
            Initial packet includes performance summary, KPI trends, stalled campaign analysis, intervention plan, and renewal recommendation framing.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

