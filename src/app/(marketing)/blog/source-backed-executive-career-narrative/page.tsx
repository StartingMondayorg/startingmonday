import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('source-backed-executive-career-narrative')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/source-backed-executive-career-narrative',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/source-backed-executive-career-narrative',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function SourceBackedExecutiveCareerNarrativePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/source-backed-executive-career-narrative"
      cta={{
        headline: 'Build narrative credibility with source-linked proof.',
        body: 'The strongest executive stories attach claims to context, evidence, and measurable outcomes before interview pressure starts.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>Executive narrative quality improves when each core claim is supported by context, quantified outcomes, and external validation where possible.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Narrative components</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Mandate context and constraints</li>
          <li>Decision logic and trade-offs</li>
          <li>Business outcomes and system impact</li>
          <li>Leadership influence across stakeholders</li>
        </ul>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Evidence attachment model</h2>
        <p>For each claim, attach one proof artifact or quantified result. This improves credibility and reduces committee ambiguity.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Story testing</h2>
        <p>Test your narrative in low-risk conversations first, then tighten where comprehension or confidence drops.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">See communication and visibility evidence for narrative effectiveness.</p>
          <Link href="/evidence-hub#organizational-visibility" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review organizational-visibility evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
