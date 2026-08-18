import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { EvidenceProofCard } from '@/components/EvidenceProofCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'What We Observed in Executive Search in 2026 - Starting Monday',
  description: 'A tiny annual report on executive search behavior, timing, and execution discipline in 2026.',
  alternates: {
    canonical: 'https://startingmonday.app/annual-report-2026',
  },
  openGraph: {
    title: 'What We Observed in Executive Search in 2026 - Starting Monday',
    description: 'A tiny annual report on executive search behavior, timing, and execution discipline in 2026.',
    url: 'https://startingmonday.app/annual-report-2026',
    type: 'article',
  },
}

const THEMES = [
  { label: 'Searches start before postings', value: 84, widthClass: 'w-[84%]' },
  { label: 'Prep quality beats volume', value: 91, widthClass: 'w-[91%]' },
  { label: 'Coach value increases with shared context', value: 86, widthClass: 'w-[86%]' },
  { label: 'Weak-signal tracking creates advantage', value: 88, widthClass: 'w-[88%]' },
]

export default function AnnualReport2026Page() {
  return (
    <>
      <section className="bg-slate-950 px-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <EvidenceProofCard
            claim="Observed pilot cohorts reached first qualified conversation faster when search execution included signal monitoring and weekly prep discipline."
            sourceLabel="Pilot summary + method notes"
            sourceHref="/pilot-findings"
            evidenceHref="/evidence-hub#internal-validation"
            disclaimer="Results vary by market, role level, and campaign consistency."
          />
        </div>
      </section>
      <BlogPost
        title="What We Observed in Executive Search in 2026"
        description="A tiny annual report on the patterns that seemed to separate disciplined campaigns from reactive ones."
        date="2026-05-20"
        readTime="5 min read"
        url="https://startingmonday.app/annual-report-2026"
        cta={{
          headline: 'See how the observations shape the product.',
          body: 'The annual report is meant to support the Evidence Hub and the method page, not replace them.',
          label: 'Open the Evidence Hub ->',
          href: '/evidence-hub#internal-validation',
        }}
      >
        <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <h1 className="sr-only">What We Observed in Executive Search in 2026</h1>
        <p>
          This is a small annual report, not a press release. It summarizes the recurring patterns we observed across executive search conversations, pilot behavior, and the broader literature we reviewed.
        </p>

        <section className="border border-orange-200 rounded-lg p-5 bg-orange-50">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-orange-700 mb-2">New public edition</p>
          <h2 className="text-[20px] font-bold text-slate-900 mb-2 leading-snug">
            Executive Search, AI, and Confidentiality: 2026 Public Edition
          </h2>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
            Read the expanded report with operating guidance, confidentiality controls, and downloadable PDF formats.
          </p>
          <Link
            href="/annual-report-2026/executive-search-ai-confidentiality"
            className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors"
          >
            Read public edition
          </Link>
        </section>

        <section id="pattern-strength" className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Observed pattern strength</h2>
          <div className="space-y-4">
            {THEMES.map(theme => (
              <div key={theme.label}>
                <div className="flex items-end justify-between gap-3 mb-2">
                  <p className="text-[13px] font-semibold text-slate-900">{theme.label}</p>
                  <p className="text-[12px] text-slate-500 font-semibold">{theme.value}%</p>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full bg-slate-900 ${theme.widthClass}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-500 mt-4">Outcome metric: across pilot observations, pattern-strength indicators clustered in the 84% to 91% range.</p>
        </section>

        <h2 id="observations" className="text-[22px] font-bold text-slate-900 pt-4">Three observations</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Timing advantage compounds before the formal search exists.</li>
          <li>Campaign discipline is more predictive than raw activity volume.</li>
          <li>Coaches become more valuable when the administrative layer is handled elsewhere.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Outcome snapshot</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="font-semibold text-slate-900">Outcome:</span> Executives who act on weak signals earlier create more first-conversation options.</li>
          <li><span className="font-semibold text-slate-900">Outcome:</span> Higher prep quality reduces avoidable early-round resets.</li>
          <li><span className="font-semibold text-slate-900">Outcome:</span> Coach session time shifts toward strategy when context rebuild is reduced.</li>
        </ul>

        <h2 id="measurement-plan" className="text-[22px] font-bold text-slate-900 pt-4">What we will keep measuring</h2>
        <p>
          We will keep measuring signal-to-action timing, prep brief usage, relationship maintenance, and the difference between session time spent on strategy versus context recovery.
        </p>

        <section id="next-step" className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Next step</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            If you want the supporting methods and references, use the Evidence Hub as the primary source.
          </p>
          <p className="text-[12px] text-slate-500 mb-3">CTA: get started now by reviewing the Evidence Hub and applying the measurement model to your own campaign.</p>
          <Link href="/evidence-hub#internal-validation" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Open Evidence Hub
          </Link>
        </section>
        </div>
      </BlogPost>
    </>
  )
}

