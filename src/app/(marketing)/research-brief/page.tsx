import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Research Brief - Starting Monday',
  description: 'A print-friendly internal memo on the evidence behind Starting Monday.',
  alternates: {
    canonical: 'https://startingmonday.app/research-brief',
  },
  openGraph: {
    title: 'Research Brief - Starting Monday',
    description: 'A print-friendly internal memo on the evidence behind Starting Monday.',
    url: 'https://startingmonday.app/research-brief',
    type: 'website',
  },
}

const bullets = [
  'Peer-reviewed coaching research supports the existence of measurable outcomes, but only when the mechanism is clear.',
  'Goal-setting and implementation-intention research justify the product\'s focus on specific next actions, not vague encouragement.',
  'Transition literature supports the idea that role entry needs structure, especially when ambiguity is high.',
  'Weak-signal research supports the timing thesis: the market often becomes visible before it is broadly public.',
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How should this research brief be used?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use this brief as a synthesis memo for advisors, investors, and operators, then link readers to source-level references for verification.',
      },
    },
    {
      '@type': 'Question',
      name: 'What evidence categories inform Starting Monday?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The model combines coaching effectiveness research, behavior-change literature, transition and onboarding studies, and weak-signal timing evidence.',
      },
    },
    {
      '@type': 'Question',
      name: 'How should confidentiality be handled when sharing this brief?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cite public sources directly and avoid sharing private operator details or internal-only operating notes.',
      },
    },
  ],
}

export default function ResearchBriefPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <JsonLd data={faqJsonLd} />
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-200 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/evidence-hub" className="text-[13px] text-slate-200 hover:text-white transition-colors">Evidence Hub</Link>
            <Link href="/references" className="text-[13px] text-slate-200 hover:text-white transition-colors">References</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <header className="mb-10 max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Research brief</p>
          <h1 className="text-[34px] sm:text-[44px] font-bold text-slate-900 leading-tight mb-4">A memo-style evidence brief for advisors, investors, and operators.</h1>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            This page is intentionally written like an internal advisory memo: short, direct, and structured for decision-makers who want the point fast.
          </p>
        </header>

        <section id="executive-summary" className="border border-slate-200 rounded-lg bg-slate-50 p-6 mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Executive summary</h2>
          <p className="text-[15px] text-slate-700 leading-relaxed mb-4">
            Starting Monday is justified by a consistent body of research: better signals improve timing, concrete plans improve follow-through, and structured transitions improve outcomes. The product exists to turn that research into operating discipline.
          </p>
          <ul className="space-y-2 text-[14px] text-slate-700 leading-relaxed list-disc pl-5">
            {bullets.map(item => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section id="primary-uses" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="border border-slate-200 rounded-lg p-5">
            <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Primary uses</h2>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-3">This brief can be used in investor conversations, partner outreach, coach sales, and external writing.</p>
            <p className="text-[13px] text-slate-600 leading-relaxed">It should read like an internal research memo, not a marketing asset.</p>
            <p className="text-[13px] text-slate-600 leading-relaxed mt-2">Outcome metric: shared evidence language shortens alignment cycles across investor and partner reviews.</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-5">
            <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">How to cite it</h2>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-3">Use it as a synthesis document that points readers to the references page for source-level detail.</p>
            <Link href="/references" className="text-[13px] font-semibold text-slate-900 underline underline-offset-2 hover:text-orange-600">Open references {"->"}</Link>
            <p className="text-[12px] text-slate-500 mt-2">Trust and confidentiality: cite sources directly and avoid sharing private operator details.</p>
          </div>
        </section>

        <section id="print-note" className="border-t border-slate-100 pt-8">
          <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Print note</h2>
          <p className="text-[13px] text-slate-600 leading-relaxed max-w-3xl">
            This page is designed to be print-friendly and memo-like. If you need a true PDF export, this is the content to print to PDF from the browser.
          </p>
          <p className="text-[12px] text-slate-600 leading-relaxed max-w-3xl mt-2">CTA: get started now by sharing this brief with your advisor or investment review group.</p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}


