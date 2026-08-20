import Link from 'next/link'

export const metadata = {
  title: 'Search-Affiliate Coach Route | Starting Monday',
  description: 'Persona-specific route for retained-search-affiliate coaches with trust boundary, workflow fit, and proof examples.',
}

const TRUST_BOUNDARY = [
  'Not a sourcing replacement for retained-search firms.',
  'Not a recruiter CRM replacement.',
  'Not an auto-outreach engine to external contacts.',
  'Candidate and coach stay in control of messaging decisions.',
]

const WORKFLOW_FIT = [
  {
    stage: 'Pre-interview arc setup',
    detail: 'Map panel-specific arcs by stakeholder type before first-round pressure starts.',
  },
  {
    stage: 'Signal-led prep updates',
    detail: 'Track mandate movement and update prep briefs when role context changes mid-process.',
  },
  {
    stage: 'Negotiation handoff',
    detail: 'Carry interview evidence and risk notes into offer and negotiation coaching.',
  },
]

const PROOF_EXAMPLES = [
  {
    title: 'Sample CFO readiness brief',
    detail: 'Structured role story + interview prompts used in retained-search-adjacent prep cycles.',
    href: '/search-firms/sample-cfo-brief',
    cta: 'Open sample brief',
  },
  {
    title: 'Coach trust pack',
    detail: 'Methodology notes, claims policy, and usage boundaries for board-safe reviews.',
    href: '/for-coaches/trust-pack',
    cta: 'Open trust pack',
  },
  {
    title: 'Coach ROI calculator',
    detail: 'Directional model for acceleration, counselor time savings, and miss-risk reduction.',
    href: '/proof/roi-calculator',
    cta: 'Open ROI calculator',
  },
]

export default function SearchAffiliateCoachPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-4 text-[11px] font-bold tracking-[0.18em] uppercase text-orange-400">Coach persona route</p>
        <h1 className="text-[34px] font-bold leading-[1.06] tracking-tight sm:text-[46px]">
          Search-affiliate transition coach route
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-300 sm:text-[17px]">
          Built for coaches operating inside retained-search timelines where prep windows are short and candidate readiness must be explicit.
        </p>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">Trust boundary</p>
          <ul className="space-y-2 text-[14px] leading-relaxed text-slate-200">
            {TRUST_BOUNDARY.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">Workflow fit</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {WORKFLOW_FIT.map((item) => (
              <article key={item.stage} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-[13px] font-semibold text-white">{item.stage}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">Proof examples</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {PROOF_EXAMPLES.map((asset) => (
              <article key={asset.title} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-[13px] font-semibold text-white">{asset.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{asset.detail}</p>
                <Link href={asset.href} className="mt-4 inline-flex text-[12px] font-semibold text-orange-300 hover:text-orange-200">
                  {asset.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/for-coaches"
            className="inline-flex items-center justify-center rounded bg-orange-500 px-5 py-3 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-orange-600"
          >
            Open coach preview
          </Link>
          <Link
            href="/coaches/personas"
            className="inline-flex items-center justify-center rounded border border-slate-600 px-5 py-3 text-[14px] font-semibold text-slate-100 transition-colors hover:border-slate-300"
          >
            Back to persona list
          </Link>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
