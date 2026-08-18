import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Founder Note - Starting Monday',
  description: 'Why Starting Monday exists and what category mistake it is correcting.',
  alternates: {
    canonical: 'https://startingmonday.app/founder-note',
  },
  openGraph: {
    title: 'Founder Note - Starting Monday',
    description: 'Why Starting Monday exists and what category mistake it is correcting.',
    url: 'https://startingmonday.app/founder-note',
    type: 'article',
  },
}

export default function FounderNotePage() {
  return (
    <BlogPost
      title="Founder Note: The Category Mistake We Are Correcting"
      description="Starting Monday exists because executive search is not a resume problem. It is an execution problem with weak signals, timing, and between-session drift."
      date="2026-05-20"
      readTime="4 min read"
      url="https://startingmonday.app/founder-note"
      cta={{
        headline: 'See the system behind the note.',
        body: 'Method, references, pilot findings, and evidence assets are all collected in one place.',
        label: 'Open the Evidence Hub ->',
        href: '/evidence-hub#internal-validation',
      }}
    >
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <h1 className="sr-only">Founder Note: The Category Mistake We Are Correcting</h1>
        <h2 id="category-mistake" className="text-[22px] font-bold text-slate-900">The category mistake</h2>
        <p>
          Starting Monday exists because the market has been telling executives the wrong story for years: that landing the right role is mostly about better resumes, more applications, or more hustle. That is the category mistake.
        </p>
        <p>
          At the senior level, the real problem is execution under uncertainty. Roles are shaped before they are posted. Context changes between conversations. The best candidates are not the ones who move fastest after the listing appears; they are the ones who arrive already informed, already prepared, and already in motion.
        </p>
        <h2 id="what-we-built" className="text-[22px] font-bold text-slate-900 pt-2">What we built</h2>
        <p>
          I built Starting Monday to correct that mismatch. The product is a search operating system, not a content feed. It gives executives and coaches the signal layer, preparation layer, and accountability layer that their campaigns were missing.
        </p>
        <p>
          The goal is not to replace coaching or relationship-building. The goal is to make both more effective by reducing the amount of time spent rebuilding context and increasing the amount of time spent making good decisions.
        </p>

        <h2 id="expected-outcomes" className="text-[22px] font-bold text-slate-900 pt-2">Expected outcomes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="font-semibold text-slate-900">Outcome:</span> More strategic first conversations because preparation happens before the call.</li>
          <li><span className="font-semibold text-slate-900">Outcome:</span> Less between-session drift because next actions are explicit.</li>
          <li><span className="font-semibold text-slate-900">Outcome:</span> Higher coaching leverage because context recovery work is reduced.</li>
        </ul>
        <p>
          Outcome metric: in pilot observations, campaigns with explicit daily next actions reached high-quality first conversations faster than reactive campaigns.
        </p>

        <section id="read-method" className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Read the method behind this note</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For sources, limitations, and methodology details, start with the Evidence Hub.
          </p>
          <p className="text-[12px] text-slate-600 leading-relaxed mb-3">CTA: get started now by reviewing the Evidence Hub and applying the model to your own campaign.</p>
          <Link href="/evidence-hub#internal-validation" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Open Evidence Hub
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}

