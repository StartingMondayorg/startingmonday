import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-transition-success-factors')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-transition-success-factors',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-transition-success-factors',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveTransitionSuccessFactorsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-transition-success-factors"
      cta={{
        headline: 'Run a transition campaign with fewer avoidable resets.',
        body: 'Use source-backed frameworks for timing, prep depth, and relationship execution before each decision gate.',
        label: 'Start free ->',
        href: '/signup',
        note: 'No credit card required.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Short answer: better transition outcomes are strongly associated with preparation depth, timing discipline, and consistent follow-through.
        </p>
        <p>
          Most failed campaigns are not caused by capability gaps. They are caused by execution drift in the weeks between key conversations.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Define success before the search starts</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Target role and mandate clarity.</li>
          <li>Fit criteria by company stage and operating context.</li>
          <li>Weekly pipeline and preparation quality benchmarks.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Risk factors in the first 90 days</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Late preparation for critical conversations.</li>
          <li>Inconsistent relationship cadence with high-value contacts.</li>
          <li>No explicit decision framework for opportunity selection.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Operating model that improves outcomes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Weekly signal review and priority reset.</li>
          <li>Conversation-specific preparation packets.</li>
          <li>Post-conversation debrief and next-action deadlines.</li>
        </ul>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence and limitations</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For onboarding and transition evidence, including boundary conditions and limitations, review the section below.
          </p>
          <Link href="/evidence-hub#transition-success" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See transition success evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
