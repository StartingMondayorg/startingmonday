import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Executive Transition Coach Demo | Starting Monday',
  description:
    'A concise walkthrough for executive transition coaches: workflow, outcomes, and what to review in a first session with Starting Monday.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/executive-transition-coach-demo',
  },
}

const walkthrough = [
  {
    step: '1) Set transition thesis quality bar',
    detail: 'Define role narrative, proof stories, and decision risks before outreach starts.',
  },
  {
    step: '2) Run weekly momentum discipline',
    detail: 'Track commitments, stalled actions, and message quality between sessions.',
  },
  {
    step: '3) Time opportunity access',
    detail: 'Use market signals and relationship paths to improve mandate conversion odds.',
  },
]

export default function ExecutiveTransitionCoachDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">Executive transition coach demo</p>
          <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-white sm:text-[52px]">
            What to show in your first 20 minutes with a transition client.
          </h1>
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-slate-200 sm:text-[19px]">
            This is a practical walkthrough for coaches who need clients to leave session one with clarity, momentum, and a better decision narrative.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/coaches/sample-transition-brief"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
            >
              Open sample transition brief
            </Link>
            <Link
              href="/coaches"
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Back to coach page
            </Link>
          </div>

          <div className="mt-10 grid gap-4">
            {walkthrough.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-[22px] font-serif leading-tight text-white">{item.step}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-200">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
