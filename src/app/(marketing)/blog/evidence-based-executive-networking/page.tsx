import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('evidence-based-executive-networking')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/evidence-based-executive-networking',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/evidence-based-executive-networking',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function EvidenceBasedExecutiveNetworkingPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/evidence-based-executive-networking"
      cta={{
        headline: 'Network with cadence, not random bursts.',
        body: 'Use contact tiers and weekly message objectives to keep relevance high without over-communicating.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Executive networking improves when it is treated as an operating cadence with explicit goals by contact tier.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Contact-tier model</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Tier 1: direct decision influence and active mandate context.</li>
          <li>Tier 2: strong connectors and market-shaping operators.</li>
          <li>Tier 3: long-horizon relationships for optionality maintenance.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Weekly cadence</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Tier 1: one high-context update every 2-3 weeks.</li>
          <li>Tier 2: one useful signal or perspective each month.</li>
          <li>Tier 3: one value-led touchpoint each quarter.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Message objective by tier</h2>
        <p>
          Match each message to one objective: context update, perspective exchange, or explicit next step. Avoid mixed-message outreach.
        </p>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For organizational positioning and communication evidence, use this section.
          </p>
          <Link href="/evidence-hub#organizational-visibility" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            Review organizational visibility evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
