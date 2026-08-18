import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('confidential-executive-search-pipeline')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/confidential-executive-search-pipeline',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/confidential-executive-search-pipeline',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ConfidentialExecutiveSearchPipelinePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/confidential-executive-search-pipeline"
      cta={{
        headline: 'Protect confidentiality while building real momentum.',
        body: 'Use private signal tracking and segmented outreach to move forward without broadcasting search intent.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          A confidential executive search needs two things at once: velocity and discretion. Most campaigns get one and lose the other.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Core constraints</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>No broad-market signaling that exposes intent.</li>
          <li>No uncontrolled message forwarding risk.</li>
          <li>No ad hoc contact strategy that leaks pattern changes.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Pipeline architecture</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Segment contacts into trusted, monitored, and deferred tiers.</li>
          <li>Use low-leak language templates with role-relevant context.</li>
          <li>Attach each outreach action to a specific signal trigger.</li>
          <li>Review risk weekly and remove weak opportunities fast.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For execution consistency and confidentiality-compatible operating models, review the behavior section below.
          </p>
          <Link href="/evidence-hub#behavior-change" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See behavior-change evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
