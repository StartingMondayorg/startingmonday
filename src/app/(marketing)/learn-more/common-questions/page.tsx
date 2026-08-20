import type { Metadata } from 'next'

import { COMMON_QUESTIONS } from '../content'
import { CitationSup, LearnMorePageShell } from '../shared'

export const metadata: Metadata = {
  title: 'Common Questions | Starting Monday',
  description: 'Twenty common questions about how Starting Monday works and when it matters.',
  alternates: {
    canonical: 'https://startingmonday.app/learn-more/common-questions',
  },
}

export default function LearnMoreCommonQuestionsPage() {
  return (
    <LearnMorePageShell backHref="/learn-more">
      <section className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Common questions</p>
        <h1 className="mt-3 font-serif text-[2.2rem] leading-[1.03] tracking-tight text-white sm:text-[3rem]">
          Twenty common questions, answered in one place.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-slate-200">
          These are the questions people ask when they want to understand the operating model, the evidence, and the practical fit before they decide whether Starting Monday belongs in their search.
          <CitationSup numbers={[1, 2, 3, 4, 5, 8]} />
        </p>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        {COMMON_QUESTIONS.map((item, index) => (
          <details key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <summary className="cursor-pointer list-none text-[15px] font-semibold text-white">
              {index + 1}. {item.question}
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
              {item.answer}
              <CitationSup numbers={item.citations} />
            </p>
          </details>
        ))}
      </section>
    </LearnMorePageShell>
  )
}