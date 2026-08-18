import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('c-suite-search-weekly-metrics')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/c-suite-search-weekly-metrics',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/c-suite-search-weekly-metrics',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CSuiteSearchWeeklyMetricsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/c-suite-search-weekly-metrics"
      cta={{
        headline: 'Run your campaign with measurable weekly decisions.',
        body: 'Use one scorecard for signal, outreach, prep, and conversion so you can intervene before momentum drops.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Short answer: senior campaigns improve when candidates track a small weekly set of leading and lagging indicators instead of only tracking interviews.
        </p>
        <p>
          For VP and C-suite transitions, the highest-leverage metrics are signal-to-action time, qualified outreach completion, and conversation quality indicators.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Weekly metrics that matter</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Leading: number of new weak-signal opportunities reviewed.</li>
          <li>Leading: number of qualified outreaches sent within 48 hours of signal review.</li>
          <li>Lagging: first-conversation volume and conversion by target tier.</li>
          <li>Lagging: interview progression quality by conversation type.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Intervention thresholds</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>If outreach completion falls below 70%, simplify templates and reduce contact scope.</li>
          <li>If signal-to-action time exceeds 3 days, tighten weekly planning windows.</li>
          <li>If first-conversation quality drops, upgrade prep brief depth before adding volume.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            See pilot validation and benchmark context in the internal evidence section.
          </p>
          <Link href="/evidence-hub#internal-validation" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review internal validation evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
