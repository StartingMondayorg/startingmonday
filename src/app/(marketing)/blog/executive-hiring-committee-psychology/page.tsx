import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-hiring-committee-psychology')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-hiring-committee-psychology',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-hiring-committee-psychology',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveHiringCommitteePsychologyPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-hiring-committee-psychology"
      cta={{
        headline: 'Anticipate committee uncertainty before interviews.',
        body: 'Stronger outcomes come from reducing decision ambiguity with signal quality, role-fit proof, and mandate-level context.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>Senior hiring committees optimize for uncertainty reduction, not just candidate quality. Your strategy should reflect that reality.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Decision dynamics</h2>
        <p>Committee members often hold different risk assumptions. Candidates who surface trade-offs clearly help the group converge faster.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Information asymmetry</h2>
        <p>Committees rarely have full context. High-quality signals and role-specific proof reduce perceived hiring risk.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Interview implication</h2>
        <p>Use mandate-level framing, anticipated objections, and decision-path clarity in every high-stakes conversation.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">See why early signal quality reduces uncertainty before formal decisions.</p>
          <Link href="/evidence-hub#early-signals" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review early-signals evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
