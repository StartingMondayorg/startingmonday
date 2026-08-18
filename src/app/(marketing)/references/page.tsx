import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence and References - Starting Monday',
  description: 'Claim-to-source references for Starting Monday, including methods, source tiers, and update history.',
  alternates: {
    canonical: 'https://startingmonday.app/references',
  },
  openGraph: {
    title: 'Evidence and References - Starting Monday',
    description: 'Claim-to-source references for Starting Monday, including methods, source tiers, and update history.',
    url: 'https://startingmonday.app/references',
    type: 'website',
  },
}

const CLAIM_ROWS = [
  {
    claim: 'Often 1-3 weeks before broad-market posting channels',
    basis: 'Internal lag model: event-to-signal, signal-to-career-page posting, and posting-to-broad-market channel lag.',
    sourceType: 'Internal method + primary external context',
    confidence: 'Medium',
    links: [
      { label: 'Timing method and sources', href: '/blog/how-we-estimate-early-role-signals', external: false },
      { label: 'SEC Form 8-K C&DIs', href: 'https://www.sec.gov/rules-regulations/staff-guidance/compliance-disclosure-interpretations/exchange-act-form-8-k', external: true },
      { label: '17 CFR 240.13a-11', href: 'https://www.ecfr.gov/current/title-17/chapter-II/part-240/section-240.13a-11', external: true },
    ],
  },
]

const SOURCE_TIERS = [
  {
    tier: 'Tier 1 (highest confidence)',
    body: 'Primary and regulatory sources, first-party disclosures, and direct platform measurements with explicit definitions.',
  },
  {
    tier: 'Tier 2 (supporting context)',
    body: 'Independent benchmark reports and process studies that provide market context but do not directly prove product outcomes.',
  },
  {
    tier: 'Tier 3 (directional only)',
    body: 'Vendor-authored case studies and opinion content. Useful for framing, not for core performance proof.',
  },
]

const CONTEXT_LINKS = [
  {
    label: 'Keystone Partners case study (vendor-authored)',
    href: 'https://www.keystonepartners.com/resources/case-studies/executive-development/',
  },
  {
    label: 'Scion retained search case study (vendor-authored)',
    href: 'https://www.scionexecutivesearch.com/case-study-retained-search/',
  },
  {
    label: 'ICF research portal (industry research index)',
    href: 'https://coachingfederation.org/research',
  },
]

export default function ReferencesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-200 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/security" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Security
            </Link>
            <Link href="/privacy" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/signup" className="text-[13px] font-semibold text-slate-900 bg-white px-4 py-1.5 rounded hover:bg-slate-100 transition-colors">
              Try free
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
<header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Evidence and references</p>
          <h1 className="text-[32px] sm:text-[40px] font-bold text-slate-900 leading-tight mb-4">
            Every quantified claim, mapped to source.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-3xl">
            See each claim, source type, confidence level, and update history in one place.
          </p>
        </header>

        <section className="mb-12 border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">Claim-to-source map</p>
          </div>
          <div className="divide-y divide-slate-100">
            {CLAIM_ROWS.map((row) => (
              <div key={row.claim} className="px-5 py-5">
                <p className="text-[14px] font-semibold text-slate-900 mb-2">{row.claim}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{row.basis}</p>
                <p className="text-[12px] text-slate-500 mb-3">
                  Source type: <span className="font-medium text-slate-700">{row.sourceType}</span>  -  Confidence: <span className="font-medium text-slate-700">{row.confidence}</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {row.links.map(link => (
                    link.external ? (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-700 underline hover:text-slate-900 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.href} href={link.href} className="text-[12px] text-slate-700 underline hover:text-slate-900 transition-colors">
                        {link.label}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="mb-4">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange-500 mb-2">What this evidence means</p>
            <h2 className="text-[22px] font-bold text-slate-900 leading-snug mb-2">How the research shapes Starting Monday</h2>
            <p className="text-[13px] text-slate-600 leading-relaxed max-w-3xl">
              Core thesis: coaching and transition outcomes improve when leaders have better signals, preparation, and between-session structure.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">What we know</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">What it means for Starting Monday</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">Best source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Coaching works best when the mechanism is clear and the context is right.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">The product should support a visible between-session operating layer, not just another conversation tool.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Ely et al. (2010)</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Concrete plans improve follow-through more than vague intent.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Prep briefs and accountability loops should convert intention into a specific next action.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Gollwitzer (1999)</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Onboarding and transition outcomes improve when structure reduces ambiguity.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Starting Monday should make early role transitions, executive searches, and first 90 days easier to navigate.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Bauer et al. (2007)</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Weak signals can appear before formal market visibility.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Signal tracking is the product's edge: it helps users act before the search is obvious to everyone else.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Ansoff (1975)</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Coaching effectiveness is affected by multiple factors, not just effort inside the session.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Coaches need shared visibility into client progress between sessions so time can shift from status updates to strategy.</td>
                  <td className="px-5 py-4 text-[13px] text-slate-700 leading-relaxed">Bozer and Jones (2018)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-4">Source tiers</p>
          <div className="space-y-3">
            {SOURCE_TIERS.map(item => (
              <div key={item.tier} className="border border-slate-200 rounded-lg p-4">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{item.tier}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 border border-slate-200 rounded-lg p-5 sm:p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Method notes</p>
          <ul className="space-y-2 text-[13px] text-slate-600 leading-relaxed">
            <li>- Internal pilot metrics use cohort windows and explicit denominators.</li>
            <li>- Event and posting lag metrics vary by sector, confidentiality level, and company process maturity.</li>
            <li>- External benchmark sources are treated as context, not direct proof of product outcomes.</li>
            <li>- Claim language is revised when evidence quality changes or sample coverage improves.</li>
          </ul>
        </section>

        <section className="mb-12">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Directional context links</p>
          <p className="text-[13px] text-slate-600 mb-4">
            These sources can support market context but are not used as primary proof for Starting Monday performance claims.
          </p>
          <div className="space-y-2">
            {CONTEXT_LINKS.map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-slate-700 underline hover:text-slate-900 transition-colors break-words">
                {link.label}
              </a>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-8">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Recent updates</p>
          <div className="space-y-2 text-[13px] text-slate-600">
            <p><span className="font-medium text-slate-800">May 13, 2026:</span> Timing claim updated from 2-4 weeks to often 1-3 weeks and linked to methodology.</p>
            <p><span className="font-medium text-slate-800">May 13, 2026:</span> Added claim-to-source map, tiered evidence model, and directional context section.</p>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

