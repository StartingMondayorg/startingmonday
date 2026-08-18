/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('why-executive-recruiters-go-quiet')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/why-executive-recruiters-go-quiet',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/why-executive-recruiters-go-quiet',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function WhyExecutiveRecruitersGoQuietPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/why-executive-recruiters-go-quiet"
      cta={{
        headline: 'Upgrade your outreach from competent to compelling.',
        body: 'Starting Monday helps you turn recruiter outreach into role-specific, context-rich messaging tied to real company signals.',
        label: 'See the live demo ->',
        href: '/demo',
        note: 'Use demo first, then run your own campaign.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">

        <p>
          Executive recruiters and hiring leaders do not usually go quiet because you are underqualified. They go quiet because
          decision pressure is high, inbox volume is extreme, and your message did not reduce their risk fast enough.
        </p>

        <p>
          If your outreach looks like polished competence without contextual relevance, it blends into the same stack as everyone else.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What is happening on their side</h2>

        <p>
          Most senior hiring processes run under three constraints at once: time pressure, political pressure, and uncertainty about fit.
          The decision maker is not asking, "Is this candidate impressive?" They are asking, "Can I defend this decision if it fails?"
        </p>

        <p>
          Good outreach answers that hidden question quickly.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Why typical outreach underperforms</h2>

        <ul className="list-disc pl-5 space-y-2">
          <li>It starts with biography instead of relevance to current business pressure.</li>
          <li>It asks for a call before establishing a credible reason to talk now.</li>
          <li>It uses generic language that could be sent to any company in any sector.</li>
          <li>It over-explains capability and under-explains fit.</li>
        </ul>

        <p>
          At senior levels, messaging that feels broad is interpreted as low signal even when the underlying candidate is strong.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A better outreach frame for C-suite and VP roles</h2>

        <p>
          Use this three-part structure:
        </p>

        <ol className="list-decimal pl-5 space-y-2">
          <li>Show you understand the pressure of their current decision context.</li>
          <li>Connect one concrete part of your background to that context.</li>
          <li>Make a low-friction ask that is easy to accept or decline.</li>
        </ol>

        <p>
          Example:
          "I know you are balancing speed and risk on this search. I have led two similar transformations in regulated environments,
          including one post-merger integration with a 20 percent cycle-time improvement. If useful, I can share a concise view on
          how I would approach your first 90 days scenario."
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to improve response rates this week</h2>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">1. Rewrite opening lines around their context</h3>

        <p>
          Start with a relevant company or role signal, not a self-introduction block.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">2. Cut every message to five to seven sentences</h3>

        <p>
          Brevity signals confidence and respect for executive time.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">3. Match evidence to role mandate</h3>

        <p>
          A CFO outreach note should not read like a CTO note. A COO note should not read like a CHRO note. Use role-specific proof.
        </p>

        <h3 className="text-[18px] font-bold text-slate-900 pt-2">4. Follow up with new signal, not repetition</h3>

        <p>
          If you follow up, add new context: recent earnings call language, leadership changes, or strategic announcements.
        </p>

        <p>
          The objective is not to force a response. The objective is to make the response decision easier.
        </p>

      </div>
    </BlogPost>
  )
}
