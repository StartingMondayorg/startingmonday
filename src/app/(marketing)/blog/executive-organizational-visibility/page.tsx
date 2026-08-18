import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-organizational-visibility')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-organizational-visibility',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-organizational-visibility',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveOrganizationalVisibilityPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-organizational-visibility"
      cta={{
        headline: 'Build visibility with relevance, not volume.',
        body: 'Use signal-led context and stakeholder-specific narratives to create momentum without overexposure.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Executive visibility is not self-promotion. It is consistent, context-aware communication that helps decision-makers reduce uncertainty.
        </p>
        <p>
          At senior levels, momentum comes from relevance and timing, not message volume.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What creates momentum</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Audience-matched narrative framing for each stakeholder type.</li>
          <li>Cadence discipline so relationships stay warm without noise.</li>
          <li>Evidence-backed updates that make your value legible fast.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A practical cadence</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Tier 1 relationships: monthly high-context touchpoints.</li>
          <li>Tier 2 relationships: quarterly progress and signal updates.</li>
          <li>Tier 3 relationships: semiannual relevance check-ins.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            Review visibility and relationship evidence in the section below.
          </p>
          <Link href="/evidence-hub#organizational-visibility" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See organizational visibility evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
