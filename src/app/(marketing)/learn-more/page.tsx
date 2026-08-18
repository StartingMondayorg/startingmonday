import type { Metadata } from 'next'
import Link from 'next/link'

import { LearnMoreBriefShowcase } from '@/components/LearnMoreBriefShowcase'
import {
  BLUF_POINTS,
  COMPARISON_ROWS,
  TARGETED_RELATIONSHIP_CARDS,
  TOP_COMMON_QUESTIONS,
  TOP_OBJECTIONS,
} from './content'
import { CitationSup, LearnMorePageShell, ProofAndCitationsSection } from './shared'

export const metadata: Metadata = {
  title: 'Learn More | Starting Monday',
  description: 'Why Starting Monday is different: comparison, objections, and common questions.',
  alternates: {
    canonical: 'https://startingmonday.app/learn-more',
  },
}

export default function LearnMorePage() {
  return (
    <LearnMorePageShell backHref="/">
      <section className="max-w-5xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Learn more</p>
        <h1 className="mt-3 max-w-4xl font-serif text-[2.2rem] leading-[1.03] tracking-tight text-white sm:text-[3rem]">
          The difference lives in the details.
        </h1>
        <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-slate-200">
          Executive transitions are won before the opportunity becomes obvious. Most leaders feel this in their bones. What they lack is a system that operationalizes this insight: seeing movement earlier, building narrative clarity, staying connected while the market is quiet.
          <CitationSup numbers={[3, 4, 5, 7, 8]} />
        </p>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(2,6,23,0.28)] sm:p-6">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">Overview</p>
          <h2 className="mt-3 text-[1.5rem] font-serif leading-tight text-white sm:text-[1.9rem]">The short answer before the long explanation.</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {BLUF_POINTS.map((point) => (
            <article key={point.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[14px] font-semibold text-white">{point.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-300">
                {point.body}
                <CitationSup numbers={point.citations} />
              </p>
            </article>
          ))}
        </div>
      </section>

      <LearnMoreBriefShowcase />

      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="max-w-4xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-orange-200">System design</p>
          <h2 className="mt-3 text-[1.6rem] font-serif leading-tight text-white sm:text-[2rem]">Built for the moment when everything still moves.</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-slate-300">
            Typical executive-search tools activate after a posting ships. By then, you're competing in the loudest window. Starting Monday is built for the period when the role is still taking shape, the team is still assembling, and a single conversation can still redirect trajectory.
            <CitationSup numbers={[3, 5, 7, 8]} />
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-1 bg-slate-900/35 text-[12px] font-semibold uppercase tracking-[0.08em] sm:grid-cols-[1fr_1.2fr_1.2fr]">
            <p className="px-4 py-3 text-slate-300">Decision area</p>
            <p className="border-t border-white/10 px-4 py-3 text-slate-300 sm:border-l sm:border-t-0">The conventional search</p>
            <p className="border-t border-white/10 px-4 py-3 text-orange-100 sm:border-l sm:border-t-0">Starting Monday</p>
          </div>
          {COMPARISON_ROWS.map((row) => (
            <div key={row.area} className="grid grid-cols-1 border-t border-white/10 sm:grid-cols-[1fr_1.2fr_1.2fr]">
              <p className="px-4 py-3 text-[13px] font-semibold text-white">{row.area}</p>
              <p className="border-t border-white/10 px-4 py-3 text-[13px] text-slate-300 sm:border-l sm:border-t-0">{row.typical}</p>
              <p className="border-t border-white/10 px-4 py-3 text-[13px] text-slate-100 sm:border-l sm:border-t-0">
                {row.startingMonday}
                <CitationSup numbers={row.citations} />
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TARGETED_RELATIONSHIP_CARDS.map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[14px] font-semibold text-white">{card.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                {card.body}
                <CitationSup numbers={card.citations} />
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/learn-more/inside-the-system" className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-600">
            Learn more about the system
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-orange-200">Objections</p>
        <h2 className="mt-3 text-[1.6rem] font-serif leading-tight text-white sm:text-[2rem]">The top objections, answered directly.</h2>
        <div className="mt-3 space-y-3">
          {TOP_OBJECTIONS.map((item) => (
            <article key={item.question} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[14px] font-semibold text-white">{item.question}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                {item.answer}
                <CitationSup numbers={item.citations} />
              </p>
            </article>
          ))}
        </div>
        <div className="mt-5">
          <Link href="/learn-more/objections" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/25 hover:text-white">
            Learn more about objections
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-orange-200">Common questions</p>
        <h2 className="mt-3 text-[1.6rem] font-serif leading-tight text-white sm:text-[2rem]">The questions people usually ask before they commit.</h2>
        <div className="mt-3 space-y-3">
          {TOP_COMMON_QUESTIONS.map((item) => (
            <details key={item.question} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-white">{item.question}</summary>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                {item.answer}
                <CitationSup numbers={item.citations} />
              </p>
            </details>
          ))}
        </div>
        <div className="mt-5">
          <Link href="/learn-more/common-questions" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/25 hover:text-white">
            Learn more questions
          </Link>
        </div>
      </section>

      <ProofAndCitationsSection />
    </LearnMorePageShell>
  )
}
