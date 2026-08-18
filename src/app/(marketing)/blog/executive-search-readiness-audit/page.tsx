import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-readiness-audit')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-readiness-audit',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-search-readiness-audit',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveSearchReadinessAuditPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-readiness-audit"
      cta={{
        headline: 'Audit readiness before launch to avoid avoidable drag.',
        body: 'Use one scoring rubric to identify campaign gaps and run a two-week remediation sprint before going active.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Search readiness determines whether your first month creates momentum or noise. A short audit usually prevents expensive resets.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">15-question audit dimensions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Target clarity: role, scope, and mandate quality.</li>
          <li>Narrative readiness: business-impact proof and positioning consistency.</li>
          <li>Operating readiness: weekly cadence, metrics, and accountability.</li>
          <li>Relationship readiness: contact tiers and outreach relevance.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Scoring model</h2>
        <p>
          Score each dimension from 1 to 5, then prioritize gaps below 3.0 for immediate remediation before scaling outreach.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Two-week remediation sprint</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Week 1: rebuild narrative, target map, and prep baseline.</li>
          <li>Week 2: launch controlled outreach with a weekly review loop.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For transition-readiness and onboarding evidence, review this section.
          </p>
          <Link href="/evidence-hub#transition-success" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review transition-success evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
