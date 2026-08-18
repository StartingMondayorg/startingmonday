import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('cto-job-search-timeline')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: 'https://startingmonday.app/blog/cto-job-search-timeline' },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/cto-job-search-timeline',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
}

export default function CtoJobSearchTimelinePage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/cto-job-search-timeline"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Ask a company how long a CTO search takes and they will say eight to twelve weeks. That is
          the time from search kickoff to offer acceptance - the company&rsquo;s experience of
          the process.
        </p>

        <p>
          Ask a CTO how long their search took and the answer is different. Six months to a year is
          common. Eighteen months is not rare. The timelines are measuring different things, and
          conflating them is one of the most expensive mistakes a technology executive can make when
          planning a transition.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The two timelines that get confused</h2>

        <p>
          The company&rsquo;s timeline starts when they engage a search firm or decide to search. The
          candidate&rsquo;s timeline starts the moment they begin thinking seriously about their next
          role.
        </p>

        <p>
          For the company, eight to twelve weeks is accurate because most of the work has already
          happened before it starts. The market has been warm for candidates through ongoing recruiter
          relationships. The board has already formed opinions about the kind of CTO they want. The
          search is a structured process to confirm and close a short list that was assembled
          informally - not to discover candidates from scratch.
        </p>

        <p>
          For the candidate, the work that matters happens before the company&rsquo;s search begins.
          The relationships with the right partners at Riviera Partners, True Search, or the
          technology practices at the major retained firms must be current, not assembled under
          urgency. The target company list must be built and watched. The positioning must be clear.
          The search that looks like it took eight weeks to close usually reflects eighteen months of
          preparation by the candidate before anyone knew they were looking.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What determines where you land in the range</h2>

        <p>
          Three variables dominate.
        </p>

        <p>
          Network currency is the first. How recently have you been in genuine conversation with the
          search firm partners and investors who fill CTO mandates? Not a coffee two years ago. A
          real conversation within the last ninety days, at a moment when you were not visibly
          searching. The candidates who land fastest are the ones who were already known, in a current
          way, to the people doing the search. Being known from a prior conversation that is now two
          years stale is almost the same as not being known.
        </p>

        <p>
          Positioning clarity is the second. Do you have a clean answer to which kind of CTO you are
          and which kind of company needs you? A technology executive with a consistent track
          record - external CTO at growth-stage companies, or engineering-focused CTO at scaling
          platforms - converts faster than one who has done both and cannot clearly say which fits
          best. Ambiguous positioning creates longer search cycles because every conversation has to
          do the work of calibration before it can move forward.
        </p>

        <p>
          Target list quality is the third. Candidates who have a live list of forty to sixty
          organizations they are actively watching land roles faster than candidates waiting to be
          found. The candidate who is already watching a company when the search forms is the one who
          gets the first conversation. The one who applies after the posting goes live is already
          behind.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The variables you can control right now</h2>

        <p>
          Network currency has a simple solution and a time cost. Reach out to ten search firm
          partners and investors this month - not to say you are available, but to share
          something genuinely useful, ask what they are seeing, and make the conversation worth their
          time. Six months from now, when you are ready to move, those relationships will be current.
          You cannot build that currency in a week once the urgency is real.
        </p>

        <p>
          Positioning clarity requires honest self-assessment. What kind of CTO does your track record
          clearly demonstrate? Not what you could be - what have you actually done, and where was
          the impact clearest? That answer, written in two sentences, is what you want every search
          partner to know about you before the conversation ends.
        </p>

        <p>
          Target list quality is the most mechanical problem. Build it now. Forty to sixty companies
          where you would say yes before the offer is made, filtered by the stage and type that
          matches your profile. Then monitor it for the signals that precede searches: funding
          announcements without named technical leadership, CEO changes, platform pivots, PE
          acquisitions in your sectors.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The honest answer</h2>

        <p>
          The CTO search that closes in six months is the one where all three variables were in order
          before the search formally started. The one that runs eighteen months is the one where the
          candidate was building those variables while searching, under urgency, when urgency is
          visible and visibility of urgency is a credibility tax.
        </p>

        <p>
          The preparation itself is not demanding when it is spread over time. Ten conversations per
          quarter with the right people. A target list reviewed twice a week. A positioning statement
          that says the same thing every time. These are not difficult tasks. They become difficult
          only when the urgency is already real and the foundation was never laid.
        </p>

        <p>
          Start before you need to. That is the entire answer.
        </p>

      </div>
    </BlogPost>
  )
}
