import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('vp-to-cio-transition')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/vp-to-cio-transition',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/vp-to-cio-transition',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function VpToCioTransitionPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/vp-to-cio-transition"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The executives who make the VP-to-CIO move well understand something that the ones who stall do not: it is
          not a promotion. It is a repositioning. The skills that made you excellent at VP level are necessary but not
          sufficient. The CIO seat requires a different orientation, a different narrative, and a different
          relationship with the organizations that fill those roles.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What actually changes in the CIO seat</h2>

        <p>
          At the VP level, you are accountable for a function. You deliver on a scope. You are evaluated on
          whether the technology works and whether you managed the budget.
        </p>

        <p>
          At the CIO level, you are accountable for a business outcome. The question shifts from &ldquo;did the
          system go live&rdquo; to &ldquo;did the business change because of what you built.&rdquo; The
          board conversation is not about systems. It is about competitive position, risk, and
          capital allocation.
        </p>

        <p>
          The VP who makes the transition successfully has already been operating at that altitude in their current
          role. They have been framing their work in business terms, not technology terms. They have been in the
          room with the CFO and the CEO making decisions, not reporting to someone who is. If that is not already
          true, the narrative work is harder.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What search firms look for</h2>

        <p>
          The search firms that fill CIO mandates are looking for candidates who have already crossed the line in
          substance, even if not in title. They want to see scope that maps to CIO accountability: full technology
          P&amp;L, direct relationships with C-suite peers, and at least one business outcome you can claim
          unambiguously.
        </p>

        <p>
          They are also assessing whether you can survive a board presentation. Can you answer the question
          &ldquo;what does the technology organization enable the business to do that it could not do before you
          were there&rdquo; in sixty seconds, in terms a non-technical board member will find credible?
        </p>

        <p>
          Candidates who hedge on scope (&ldquo;I oversaw most of the infrastructure&rdquo;) or lead with team size
          do not make short lists. Candidates who lead with the business problem they solved and the evidence it
          worked do.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The organizations most likely to take the bet</h2>

        <p>
          Not every company will consider a VP making the first CIO move. The organizations that do tend to share
          specific characteristics: mid-market companies that have historically underfunded technology and are now
          investing seriously, PE-backed companies installing their first real CIO after years of fragmented
          leadership, and growth-stage companies formalizing a technology function that has been running informally.
        </p>

        <p>
          These are not consolation prizes. They are the right mandates for a first CIO role because the scope is
          real, the proximity to the CEO is direct, and the transformation story you build there is the record that
          opens the next door.
        </p>

        <p>
          The Fortune 500 CIO search at your first pass is a harder argument. Not impossible, but the competition
          is primarily sitting CIOs. The sequencing matters.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The narrative work that has to happen first</h2>

        <p>
          The most common mistake VP candidates make is updating their resume and starting to apply. That is the
          wrong order of operations.
        </p>

        <p>
          The work that precedes active search is repositioning every significant role in your record so that it
          reads as CIO-level accountability rather than VP-level delivery. Not fabrication. Translation. The
          transformation program you delivered was a CIO-level decision with a VP-level title. The narrative has
          to say that.
        </p>

        <p>
          It also means identifying the search firm partners who place first-time CIOs at the kinds of companies
          where you are a credible candidate, and getting in front of them before you need them. Most do not do
          this. They call when the urgency is acute, which is exactly when the relationship is worth the least.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What Starting Monday tracks</h2>

        <p>
          Starting Monday watches for the organizational signals that precede CIO mandates at companies where a
          VP-to-CIO candidate is a realistic fit: PE ownership changes, CEO transitions at mid-market companies,
          transformation initiatives that have outgrown the current technology leadership, and growth-stage
          companies announcing significant technology investment for the first time.
        </p>

        <p>
          The{' '}
          <Link href="/for-executives" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            prep brief
          </Link>{' '}
          assembles your win thesis, likely objections, and company-specific questions in sixty seconds. The
          pipeline tracks every search firm relationship and every target company so nothing goes cold while you
          wait.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The question worth sitting with</h2>

        <p>
          If a search firm partner called you today and asked you to describe your current scope in CIO terms, how
          long would it take you to have a crisp answer?
        </p>

        <p>
          That answer exists. The work is finding it before the call, not during it.
        </p>

      </div>
    </BlogPost>
  )
}
