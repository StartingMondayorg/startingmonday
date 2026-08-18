import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('vp-to-c-suite-positioning')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/vp-to-c-suite-positioning',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/vp-to-c-suite-positioning',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function VPToCSuitePositioningPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/vp-to-c-suite-positioning"
      cta={{
        headline: 'Position for enterprise scope before the process starts.',
        body: 'The strongest VP-to-C-suite narratives show business-system impact, board context, and cross-functional leadership range.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          VP-to-C-suite transition success depends on narrative scale. The panel must see enterprise-level scope, not only team-level excellence.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Common positioning gaps</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Operational details dominate, but strategic outcomes are vague.</li>
          <li>Cross-functional influence is implied, not demonstrated.</li>
          <li>Board-level framing is absent from the value narrative.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Enterprise-scope proof model</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Show enterprise risk and value trade-offs you managed.</li>
          <li>Quantify business outcomes beyond technical delivery.</li>
          <li>Demonstrate stakeholder alignment across conflicting priorities.</li>
          <li>Frame leadership decisions in board-level language.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For transition execution and early-role success evidence, review the section below.
          </p>
          <Link href="/evidence-hub#transition-success" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review transition-success evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
