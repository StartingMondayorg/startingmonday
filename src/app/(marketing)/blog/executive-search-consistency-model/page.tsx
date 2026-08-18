import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-consistency-model')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-consistency-model',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-search-consistency-model',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveSearchConsistencyModelPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-consistency-model"
      cta={{
        headline: 'Replace search drift with a weekly operating cadence.',
        body: 'Move from reactive bursts to consistent execution tied to explicit weekly actions and review loops.',
        label: 'Start free ->',
        href: '/signup',
        note: 'No credit card required.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Short answer: in executive search, consistency outperforms intensity because opportunities emerge over a long and uneven timeline.
        </p>
        <p>
          Short bursts can create activity, but they rarely create reliable momentum unless followed by disciplined weekly execution.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Why intensity fails</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>It front-loads effort without preserving follow-through.</li>
          <li>It creates uneven message quality and preparation depth.</li>
          <li>It increases drift between coaching or advisory sessions.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Consistency model for weekly execution</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Set 3 to 5 high-value actions per week.</li>
          <li>Attach deadlines and explicit success criteria.</li>
          <li>Review completion and quality every Friday.</li>
          <li>Carry forward only priority actions, not the full backlog.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Scorecard starter</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Signal-to-action lag (days)</li>
          <li>Prep completed before key conversations (percent)</li>
          <li>High-value relationship touches per week</li>
          <li>Commitment completion rate (percent)</li>
        </ul>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Review behavior-change evidence</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For implementation intention, feedback loop, and behavior change evidence, review the section below.
          </p>
          <Link href="/evidence-hub#behavior-change" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See behavior-change evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
