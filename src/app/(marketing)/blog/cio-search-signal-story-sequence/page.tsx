import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('cio-search-signal-story-sequence')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/cio-search-signal-story-sequence',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/cio-search-signal-story-sequence',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CioSearchSignalStorySequencePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/cio-search-signal-story-sequence"
      cta={{
        headline: 'Run your CIO campaign with sequence discipline.',
        body: 'Track signals, sharpen your narrative, and execute weekly so momentum compounds before formal posting windows open.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>CIO transitions reward candidates who run an operating sequence: signal detection, story calibration, then relationship-led execution.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Signal layer</h2>
        <p>Watch governance moves, strategy shifts, and leadership changes that indicate role-shaping pressure before broad market visibility.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Story layer</h2>
        <p>Translate your outcomes into enterprise-risk and value language. Hiring panels need business-system impact clarity, not technical detail volume.</p>
        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Sequence layer</h2>
        <p>Use weekly cadence: detect, prioritize, outreach, prep, and review. The sequence matters more than single bursts of effort.</p>
        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">See why early transition signals create strategic timing advantage.</p>
          <Link href="/evidence-hub#early-signals" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">Review early-signals evidence</Link>
        </section>
      </div>
    </BlogPost>
  )
}
