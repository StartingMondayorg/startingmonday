import type { Metadata } from 'next'
import Link from 'next/link'

import { SYSTEM_ARTICLE_SECTIONS } from '../content'
import { CitationSup, LearnMorePageShell, ProofAndCitationsSection } from '../shared'

export const metadata: Metadata = {
  title: 'Inside the Starting Monday System | Starting Monday',
  description: 'An in-depth look at the intelligence scanner, pattern-recognition engine, relationship momentum algorithm, and behavior-first model behind Starting Monday.',
  alternates: {
    canonical: 'https://startingmonday.app/learn-more/inside-the-system',
  },
}

export default function LearnMoreInsideTheSystemPage() {
  return (
    <LearnMorePageShell backHref="/learn-more">
      <section className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">In-depth article</p>
        <h1 className="mt-3 font-serif text-[2.2rem] leading-[1.03] tracking-tight text-white sm:text-[3rem]">
          Inside the system that makes Starting Monday different.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-slate-200">
          Senior transitions are not won by doing more. They are won by noticing the right change sooner, building the right story faster, and taking the next relationship step with discipline.
          <CitationSup numbers={[3, 4, 5, 7, 8]} />
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
          The system has several layers: a proprietary intelligence scanner, a proprietary pattern-recognition engine, a relationship momentum algorithm, a behavior-first operating model, and a proof discipline that keeps marketing claims tied to visible evidence.
          <CitationSup numbers={[1, 2, 3, 5, 8]} />
        </p>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-24 lg:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">What the article covers</p>
          <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-slate-300">
            {SYSTEM_ARTICLE_SECTIONS.map((section) => (
              <li key={section.title}>{section.title}</li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
            <p className="text-[13px] font-semibold text-white">The practical takeaway</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200">
              The product is designed to reduce wasted motion. Every layer is there to improve timing, confidence, and the quality of the next decision.
            </p>
          </div>
        </aside>

        <div className="space-y-5">
          {SYSTEM_ARTICLE_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h2 className="text-[1.35rem] font-serif leading-tight text-white">{section.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
                {section.body}
                <CitationSup numbers={section.citations} />
              </p>
              {section.title === 'Proprietary intelligence scanner' ? (
                <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                  This matters because executive transitions often begin with small signs: leadership exits, budget shifts, acquisition integration, board movement, or capability gaps that make a new role more likely before a recruiting process is announced.
                  <CitationSup numbers={[3, 7]} />
                </p>
              ) : null}
              {section.title === 'Relationship momentum algorithm' ? (
                <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                  The point is not to maximize touches. The point is to move the specific relationships that can open a path, sharpen a thesis, or create a timely introduction.
                  <CitationSup numbers={[5, 8]} />
                </p>
              ) : null}
              {section.title === 'Behavior-first operating model' ? (
                <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                  That is why the system emphasizes weekly loops, explicit next steps, and preparation habits instead of endless content generation. The product is intentionally opinionated about follow-through.
                  <CitationSup numbers={[4, 5, 8]} />
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">What else is different</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[14px] font-semibold text-white">Executive-grade language</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              The product tries to sound like a serious operating environment, not a gamified job-search assistant. That matters because trust is partly built through language.
              <CitationSup numbers={[4, 8]} />
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-[14px] font-semibold text-white">Decision-quality focus</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              The experience is optimized for better decisions under uncertainty, not just more visible activity. That keeps the product aligned with how senior transitions actually work.
              <CitationSup numbers={[5, 7, 8]} />
            </p>
          </article>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/learn-more/objections" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/25 hover:text-white">
            Read the objections page
          </Link>
          <Link href="/learn-more/common-questions" className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-600">
            Open the full questions page
          </Link>
        </div>
      </section>

      <ProofAndCitationsSection />
    </LearnMorePageShell>
  )
}