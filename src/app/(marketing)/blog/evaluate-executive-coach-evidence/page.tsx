import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('evaluate-executive-coach-evidence')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/evaluate-executive-coach-evidence',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/evaluate-executive-coach-evidence',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function EvaluateExecutiveCoachEvidencePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/evaluate-executive-coach-evidence"
      cta={{
        headline: 'Choose coaches with method clarity and operating discipline.',
        body: 'Use evidence-linked criteria instead of brand or credential proxies when selecting coaching support.',
        label: 'Start free ->',
        href: '/signup',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Coach selection improves when you score process quality, measurement discipline, and between-session execution support.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Evidence-based evaluation criteria</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Clear outcome definitions per cycle.</li>
          <li>Explicit commitment tracking and review cadence.</li>
          <li>Structured adaptation when signals or constraints change.</li>
          <li>Boundary clarity: strategy, execution, and confidentiality rules.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Interview questions to ask</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>How do you define and measure weekly progress?</li>
          <li>How do you prevent drift between sessions?</li>
          <li>How do you adapt the plan when momentum stalls?</li>
          <li>What evidence do you use to justify your method?</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Evidence path</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For coaching mechanism and outcome evidence, review the section below.
          </p>
          <Link href="/evidence-hub#coaching-effectiveness" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See coaching effectiveness evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
