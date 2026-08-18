import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-risk-register')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-risk-register',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-search-risk-register',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveSearchRiskRegisterPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-risk-register"
      cta={{
        headline: 'Prevent avoidable campaign failures early.',
        body: 'Use one risk register with weekly signals, mitigation owners, and review cadence to keep execution stable.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>Most executive campaigns fail through recognizable patterns. A risk register makes those patterns visible before they become expensive.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">10 failure modes to watch</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Signal detection drift</li>
          <li>Outreach inconsistency</li>
          <li>Narrative mismatch by stakeholder</li>
          <li>Preparation shortcuts before key conversations</li>
          <li>No weekly operating review</li>
        </ul>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Mitigation process</h2>
        <p>Assign owner, trigger threshold, and weekly review action per risk. If a threshold is crossed, intervene within one operating cycle.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">See behavior consistency and implementation evidence that supports risk controls.</p>
          <Link href="/evidence-hub#behavior-change" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review behavior-change evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
