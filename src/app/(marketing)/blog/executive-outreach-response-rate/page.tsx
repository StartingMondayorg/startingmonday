import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-outreach-response-rate')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-outreach-response-rate',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-outreach-response-rate',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveOutreachResponseRatePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-outreach-response-rate"
      cta={{
        headline: 'Improve response rates with context-first framing.',
        body: 'Most outreach improves when message context and stakeholder relevance are explicit before the ask.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Executive outreach is usually ignored for structural reasons: low context, generic value framing, or poor timing relative to role pressure.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Why messages fail</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>The first sentence is about the sender, not the receiver's mandate.</li>
          <li>The message does not prove relevance to current organizational pressure.</li>
          <li>The ask appears before trust or context is established.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A better structure</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Start with role-relevant context from a current signal.</li>
          <li>Show one concise proof point tied to similar constraints.</li>
          <li>Close with a low-friction next step, not a broad ask.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Follow-up sequence</h2>
        <p>
          Use a 3-touch sequence over 10 business days with each follow-up adding useful context rather than repeating the same request.
        </p>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For relationship positioning and communication evidence, review this section.
          </p>
          <Link href="/evidence-hub#organizational-visibility" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review organizational visibility evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
