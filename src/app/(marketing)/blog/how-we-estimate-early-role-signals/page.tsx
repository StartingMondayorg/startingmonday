import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('how-we-estimate-early-role-signals')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/how-we-estimate-early-role-signals',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/how-we-estimate-early-role-signals',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function EarlyRoleSignalsMethodPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/how-we-estimate-early-role-signals"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">

        <p>
          Every product decision at Starting Monday is grounded in one question: what is the earliest reliable signal that
          a C-suite search is forming? This post explains the evidence basis for that claim - without exposing the exact
          detection methods we use.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What the claim means</h2>

        <p>
          The claim does <strong>not</strong> mean every company publishes a role 1–3 weeks after an internal decision.
          Executive hiring does not work that consistently. It means we frequently detect meaningful context before
          broad-market posting channels catch up.
        </p>

        <p>
          In practice, &ldquo;broad-market posting&rdquo; means LinkedIn and major job boards. Observable company-level
          changes often surface earlier context for executives paying attention.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The timing model</h2>

        <p>
          We separate timing into three measurable intervals so we do not overstate precision:
          internal trigger to first public signal, first signal to company career page posting, and career page to
          broad-market distribution. The 1–3 week figure applies primarily to the third interval.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Evidence basis</h2>

        <p>
          Our claims are grounded in regulatory disclosure timelines, HR process documentation, and industry benchmarks
          used directionally, not as precise predictions. We separate high-confidence sources from contextual support.
          Primary sources are cited in the{' '}
          <Link href="/references" className="text-slate-900 underline hover:text-slate-600">references page</Link>.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Current limitations</h2>

        <ul className="list-disc pl-5 space-y-2">
          <li>Private companies disclose less, so event dates are harder to validate.</li>
          <li>Some executive searches never become public postings.</li>
          <li>Role confidentiality, geography, and industry materially change lag timing.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to use this as a candidate</h2>

        <p>
          Treat timing as probability, not certainty. The practical advantage is knowing where to focus outreach while
          most candidates are still waiting for the listing.
        </p>

        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-[14px] font-semibold text-slate-900 mb-2">See the full signal model inside the platform</p>
          <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
            The detailed detection methodology, evidence tiers, and timing calibration data are available to Starting Monday members.
          </p>
          <Link
            href="/signup?from=blog"
            className="inline-block bg-orange-500 text-white text-[13px] font-semibold px-5 py-2.5 rounded hover:bg-orange-600 transition-colors"
          >
            Start free - 30 days, no card
          </Link>
        </div>

        <p className="mt-8">
          For the execution side, read{' '}
          <Link href="/blog/target-company-list" className="text-slate-900 underline hover:text-slate-600">
            how to build a target-company list
          </Link>
          {' '}and{' '}
          <Link href="/blog/cio-job-market-2026" className="text-slate-900 underline hover:text-slate-600">
            our market scan write-up
          </Link>
          .
        </p>
      </div>
    </BlogPost>
  )
}
