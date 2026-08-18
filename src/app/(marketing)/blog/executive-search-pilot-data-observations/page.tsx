import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-pilot-data-observations')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-pilot-data-observations',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-search-pilot-data-observations',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveSearchPilotDataObservationsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-pilot-data-observations"
      cta={{
        headline: 'Interpret pilot outcomes with discipline.',
        body: 'Use cohort context, variance patterns, and limits to decide where to scale execution and where to adapt.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>Pilot data is useful when you evaluate both outcomes and constraints. It should guide decisions, not replace judgment.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What improved</h2>
        <p>Observed cohorts showed stronger setup speed, outreach consistency, and first-conversation pace when weekly cadence stayed intact.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Where results varied</h2>
        <p>Variance was highest across role level, market segment, and campaign discipline. Results should be read through those factors.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to use this data</h2>
        <p>Treat pilot findings as directional operating evidence: useful for prioritization, insufficient for absolute forecasting.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">Review full internal validation details, sample context, and limitations.</p>
          <Link href="/evidence-hub#internal-validation" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review internal-validation evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
