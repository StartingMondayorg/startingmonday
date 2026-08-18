import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { BlogCallout } from '@/components/BlogCallout'
import { getPost } from '@/lib/blog-posts'

const post = getPost('cio-job-search-timeline')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/cio-job-search-timeline',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/cio-job-search-timeline',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CioJobSearchTimelinePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/cio-job-search-timeline"
      cta={{
        headline: 'Start building before the clock starts.',
        body: 'Starting Monday monitors your target companies for organizational signals before a search is formalized. Set up your watchlist now and be ready when the call comes.',
        label: 'Start watching now →',
        href: '/signup',
        note: 'Free for 30 days. No credit card.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The honest answer most people do not say out loud: six to eighteen months. The range is that wide
          for a reason, and where you land in it depends on decisions you make before you start - not after.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The timeline nobody posts</h2>

        <p>
          A CIO search has three phases, and only one of them shows up on the calendar you share with your
          spouse.
        </p>

        <p>
          The first phase is pre-market positioning: the twelve months before you are actively looking. This is
          where the search is actually won or lost. The executives who land fastest in active search are the ones
          who spent the year before it building relationships with the search firms that fill CIO mandates,
          tracking the organizations they wanted to land at, and getting clear on their narrative before they
          needed it. Most do not do this. They start from scratch in month zero.
        </p>

        <p>
          The second phase is active search: the period when you are in market, having conversations, and moving
          companies through your pipeline. This typically runs three to nine months at the CIO level. Shorter if
          your network is warm and your positioning is sharp. Longer if you are cold-starting relationships with
          search firms who do not yet know you.
        </p>

        <p>
          The third phase is close: offer, negotiation, notice period, start date. Add sixty to ninety days.
        </p>

        <p>
          Run the math. Even the fast version is eight months from decision to first day. The realistic version
          is twelve to fifteen.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What determines where you land</h2>

        <p>
          <strong className="text-slate-900">Sector.</strong> Healthcare and financial services run long - both
          have deeper compliance requirements in the hiring process and more stakeholders in the decision.
          Growth-stage and PE-backed mandates move faster. A PE-backed CIO search can move from first call to
          offer in six weeks when the sponsor has a burning platform and the candidate is already known to the
          firm.
        </p>

        <p>
          <strong className="text-slate-900">Compensation level.</strong> The higher the comp, the longer the
          search. A $500K total-comp CIO role at a public company involves the CHRO, the board compensation
          committee, and two or three rounds of executive interviews. Expect twelve to eighteen months. A $350K
          role at a Series D company may move in three.
        </p>

        <p>
          <strong className="text-slate-900">Network temperature.</strong> &ldquo;I know someone at Korn
          Ferry&rdquo; is not a warm network. A warm network is one where a specific partner already has your
          name in their system, has met you in the last eighteen months, and would call you first when a
          relevant search opens. Most CIOs significantly overestimate how warm their search firm relationships
          actually are.
        </p>

        <p>
          <strong className="text-slate-900">Narrative clarity.</strong> The searches that move fast are the
          ones where the candidate can answer three questions cleanly in a thirty-minute first call: What kind
          of mandate are you best at? What have you built that proves it? What are you looking for that you do
          not have now? Candidates who hedge, cover too many bases, or lead with their title instead of their
          impact stall at the second call.
        </p>

        <BlogCallout
          headline="The executives who land fastest started building before they needed to."
          body="Starting Monday monitors your target companies every 48 hours. When signals cluster before a search opens, you know. Set up your watchlist now."
          label="Start watching now →"
          href="/signup"
        />

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What actually speeds it up</h2>

        <p>
          The fastest CIO searches are won by executives who were already on the short list when the search
          opened. That means being known to the right search firm partners before you need them - not
          calling them when your role is eliminated.
        </p>

        <p>
          It also means having done the research on your target organizations before the first call. The
          candidate who walks in knowing why the mandate exists, what the company has struggled to solve
          technically, and where their specific record is the right fit moves from first call to final round
          faster than the one who is still forming opinions on the second conversation.
        </p>

        <p>
          Starting Monday tracks the organizational signals that tend to precede CIO searches - board-level
          technology committee changes, transformation announcements, leadership gaps in technology
          functions - so you can watch your target organizations before they post a role. The{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            prep brief
          </Link>{' '}
          assembles your win thesis, likely objections, and questions from the company&rsquo;s actual situation
          in sixty seconds. The pipeline tracks every relationship and conversation so nothing goes cold while
          you wait.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The question worth sitting with</h2>

        <p>
          If a search firm partner called you today about a CIO mandate that opened this morning, how long would
          it take you to send them a brief that was ready for a board audience?
        </p>

        <p>
          If the answer is more than an hour, that is the search you are already running. It just is not on the
          calendar yet.
        </p>

      </div>
    </BlogPost>
  )
}
