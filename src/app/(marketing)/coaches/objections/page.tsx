import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Coach Objections | Starting Monday',
  description:
    'Common objections from executive transition coaches and concise responses: adoption, differentiation, security, and measurable outcomes.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/objections',
  },
}

const objections = [
  {
    title: 'I already have coaching notes and templates. Why change?',
    answer:
      'Starting Monday is not another note repository. It is a decision-grade transition layer that aligns narrative quality, momentum, and market timing in one operating view.',
  },
  {
    title: 'Will this make sessions feel mechanical?',
    answer:
      'The structure removes recap friction so sessions can focus on judgment, confidence, and strategic message quality.',
  },
  {
    title: 'How is this different from career platforms?',
    answer:
      'Career tools optimize volume activity. Starting Monday optimizes high-stakes executive transition decisions with coach-grade context and risk framing.',
  },
  {
    title: 'How do I prove impact to clients?',
    answer:
      'Track outcomes that matter: narrative readiness, commitment follow-through, and conversion quality at each interview stage.',
  },
  {
    title: 'What about confidentiality?',
    answer:
      'Visibility is role-scoped and revocable. Coaches and clients can collaborate without exposing sensitive transition context broadly.',
  },
]

export default function CoachObjectionsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">Coach objections guide</p>
          <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-white sm:text-[52px]">
            The objections transition coaches hear, answered without fluff.
          </h1>
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-slate-200 sm:text-[19px]">
            Concise responses designed for client conversations where credibility and calm matter more than feature tours.
          </p>

          <div className="mt-8 grid gap-4">
            {objections.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-[22px] font-serif leading-tight text-white">{item.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-200">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/coaches"
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Back to coach page
            </Link>
            <Link
              href="/coaches/sample-transition-brief"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
            >
              View sample transition brief
            </Link>
          </div>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
