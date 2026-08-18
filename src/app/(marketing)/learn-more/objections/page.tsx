import type { Metadata } from 'next'

import { OBJECTIONS } from '../content'
import { CitationSup, LearnMorePageShell } from '../shared'

export const metadata: Metadata = {
  title: 'Objections | Starting Monday',
  description: 'Direct answers to the most common objections about Starting Monday.',
  alternates: {
    canonical: 'https://startingmonday.app/learn-more/objections',
  },
}

export default function LearnMoreObjectionsPage() {
  return (
    <LearnMorePageShell backHref="/learn-more">
      <section className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Objections</p>
        <h1 className="mt-3 font-serif text-[2.2rem] leading-[1.03] tracking-tight text-white sm:text-[3rem]">
          Ten objections people raise, with direct answers.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-slate-200">
          The right objection handling should clarify scope, not pressure the reader. These answers are written to reduce ambiguity about what Starting Monday is and what it is not.
          <CitationSup numbers={[1, 2, 3, 4, 8]} />
        </p>
      </section>

      <section className="mt-8 space-y-4">
        {OBJECTIONS.map((item, index) => (
          <article key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">Objection {index + 1}</p>
            <h2 className="mt-2 text-[1.25rem] font-serif leading-tight text-white">{item.question}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
              {item.answer}
              <CitationSup numbers={item.citations} />
            </p>
          </article>
        ))}
      </section>
    </LearnMorePageShell>
  )
}