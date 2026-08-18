import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-timing-signals')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-timing-signals',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-search-timing-signals',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveSearchTimingSignalsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-timing-signals"
      cta={{
        headline: 'Turn weak signals into a repeatable operating rhythm.',
        body: 'Use Evidence Hub methods and Starting Monday workflows to decide where to focus each week before roles are posted.',
        label: 'Start free ->',
        href: '/signup',
        note: 'No credit card required.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Short answer: executive opportunities often surface through organizational and leadership signals before a role appears on public boards.
        </p>
        <p>
          The practical edge is not seeing every signal. It is separating meaningful timing shifts from noise and acting with consistency.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Signal classes to monitor weekly</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Leadership movement: departures, interim appointments, succession hints.</li>
          <li>Strategic reset signals: board pressure, transformation mandates, budget shifts.</li>
          <li>Capability demand signals: repeated hiring themes and public roadmap language.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Where false positives come from</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Single-source interpretation without corroborating evidence.</li>
          <li>Confusing broad hiring growth with role-specific urgency.</li>
          <li>Mistaking internal reshuffles for external search readiness.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A practical weekly checklist</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Review target-company signal deltas across the last 7 days.</li>
          <li>Tag each change as weak, medium, or high confidence.</li>
          <li>Trigger one relationship action for each high-confidence signal.</li>
          <li>Track signal-to-action lag and tighten it each week.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Method and evidence</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For timing methodology, confidence limits, and source rationale, review the Evidence Hub section below.
          </p>
          <Link href="/evidence-hub#early-signals" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See early signal evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
