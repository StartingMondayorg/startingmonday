import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-interview-prep-7-day-system')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-interview-prep-7-day-system',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-interview-prep-7-day-system',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveInterviewPrep7DaySystemPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-interview-prep-7-day-system"
      cta={{
        headline: 'Walk into senior interviews with mandate-level context.',
        body: 'Use a one-week briefing cadence to align story, risk framing, and decision-level questions before each conversation.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Executive interview performance is mostly determined before the interview starts. The biggest differentiator is preparation depth, not improvisation skill.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">7-day prep cadence</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Day 7-6: company context and mandate signal review.</li>
          <li>Day 5-4: value narrative and role-fit proof alignment.</li>
          <li>Day 3-2: objection and risk-response rehearsal.</li>
          <li>Day 1: decision-level question set and conversation map.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to validate before the call</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Can you state your win thesis in under 90 seconds?</li>
          <li>Can you tie your past outcomes to this mandate's constraints?</li>
          <li>Can you surface trade-offs the panel has not articulated yet?</li>
        </ul>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For transition and preparation evidence, review the section below.
          </p>
          <Link href="/evidence-hub#transition-success" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See transition-success evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
