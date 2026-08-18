import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('why-starting-monday-exists')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/why-starting-monday-exists',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/why-starting-monday-exists',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function WhyStartingMondayExistsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/why-starting-monday-exists"
      cta={{
        headline: 'Run your search with role-specific infrastructure.',
        body: 'Daily signal monitoring, prep briefs, outreach drafting, and campaign tracking built for C-suite and VP transitions.',
        label: 'Start your 30-day trial ->',
        href: '/signup',
        note: 'No credit card required to start.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">

        <p>
          Starting Monday exists because executive search is usually treated like a documents problem when it is actually an execution problem.
        </p>

        <p>
          Senior candidates do not fail because they cannot write a resume. They lose momentum because the search has no operating system:
          no structured signal monitoring, no outreach cadence, no prep discipline, and no reliable way to measure pipeline health.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What we kept seeing</h2>

        <p>
          Across C-suite and VP transitions, the same breakdown repeats:
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Outreach goes out without enough context to stand out.</li>
          <li>Interview prep is done late and inconsistently.</li>
          <li>High-potential target companies are tracked loosely or not at all.</li>
          <li>Follow-up quality drops after week three.</li>
          <li>Candidates feel busy but cannot explain pipeline progress clearly.</li>
        </ul>

        <p>
          None of this is a motivation issue. It is an infrastructure issue.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What we built instead</h2>

        <p>
          We designed Starting Monday to support the work between the big moments, because that is where executive searches are won.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">Signal layer</h3>

        <p>
          Monitor target companies for leadership changes, hiring patterns, organizational events, and role formation signals before broad
          posting channels catch up.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">Preparation layer</h3>

        <p>
          Build role-specific prep briefs that connect your background to the business context of each conversation.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">Outreach layer</h3>

        <p>
          Draft context-aware outreach that reflects company signals and your positioning, rather than generic executive messaging.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">Campaign layer</h3>

        <p>
          Track pipeline movement, follow-ups, and conversation quality so you can diagnose stalls early and adjust quickly.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Who this is for</h2>

        <p>
          We built this for executives navigating real transitions: CFOs, CTOs, CIOs, COOs, CHROs, Chief Strategy Officers,
          and VP-level leaders operating at enterprise scope.
        </p>

        <p>
          We also built it for the people who support them: executive coaches, search firms, and transition advisors who need better
          visibility and better execution support between sessions.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The principle behind the product</h2>

        <p>
          Generic tools create generic outcomes. Executive transitions need role-specific context, disciplined execution, and timing awareness.
          That is the gap we built Starting Monday to close.
        </p>

      </div>
    </BlogPost>
  )
}
