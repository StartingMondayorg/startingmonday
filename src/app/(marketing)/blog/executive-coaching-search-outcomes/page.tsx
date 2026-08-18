import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-coaching-search-outcomes')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-coaching-search-outcomes',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-coaching-search-outcomes',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveCoachingSearchOutcomesPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-coaching-search-outcomes"
      cta={{
        headline: 'Increase coaching leverage with shared operating context.',
        body: 'Use Evidence Hub and campaign workflows so sessions spend less time rebuilding context and more time on decisions.',
        label: 'Start free ->',
        href: '/signup',
        note: 'No credit card required.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Short answer: coaching improves outcomes most when paired with clear commitments, measurable weekly cadence, and role-specific preparation.
        </p>
        <p>
          Coaching alone does not create momentum. Coaching plus execution structure does.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to measure</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Signal-to-action lag after each session.</li>
          <li>Prep brief completion before high-stakes conversations.</li>
          <li>Follow-through rate on agreed commitments.</li>
          <li>Conversation quality progression over time.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Evidence-backed mechanisms</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Goal clarity and implementation intention increase execution probability.</li>
          <li>Feedback loops improve behavioral adjustment quality.</li>
          <li>Structured accountability reduces drift between sessions.</li>
        </ol>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to evaluate coach quality</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Do they define measurable outcomes for each cycle?</li>
          <li>Do they enforce specific next actions and deadlines?</li>
          <li>Do they adjust strategy based on observed data, not intuition alone?</li>
        </ul>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Review full coaching evidence</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
            For source detail, limits, and linked studies, review the coaching effectiveness section in Evidence Hub.
          </p>
          <Link href="/evidence-hub#coaching-effectiveness" className="inline-block bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors">
            See coaching effectiveness evidence
          </Link>
        </section>
      </div>
    </BlogPost>
  )
}
