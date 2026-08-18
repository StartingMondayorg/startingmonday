import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-search-firms-cio')!

export const metadata: Metadata = {
  title: 'CIO Executive Search: What Executive Search Firms Actually Want - Starting Monday',
  description: 'CIO executive search guide for senior technology leaders. Learn how retained search firms build long lists, what gets candidates shortlisted, and how timing affects CIO search outcomes.',
  keywords: [...post.keywords, 'cio executive search', 'executive search cio', 'cio search firms'],
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-search-firms-cio',
  },
  openGraph: {
    title: 'CIO Executive Search: What Executive Search Firms Actually Want',
    description: 'CIO executive search guide for senior technology leaders and retained firm processes.',
    url: 'https://startingmonday.app/blog/executive-search-firms-cio',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CIO Executive Search: What Executive Search Firms Actually Want',
    description: 'CIO executive search guide for senior technology leaders and retained firm processes.',
  },
}

export default function ExecutiveSearchFirmsCioPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-search-firms-cio"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Most technology executives think about executive search firms the wrong way. They think of them as
          the people who find jobs. The firms think of themselves as the people who fill mandates - a
          different orientation, with different implications for how you should approach them.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How retained search actually works</h2>

        <p>
          When a company engages a retained search firm for a CIO, they pay a retainer
          upfront - typically one-third of the estimated first-year compensation, which for a $400K CIO
          role means $130K before a single candidate is presented. That money buys the firm&rsquo;s full
          attention and exclusivity. The client is not talking to three firms. They are talking to one.
        </p>

        <p>
          The firm assembles a long list - fifteen to twenty-five names - through three sources: their
          existing database of known candidates, direct outreach to executives they have tracked over time, and
          referrals from the client&rsquo;s network. Applications are rarely on that list.
        </p>

        <p>
          They reduce the long list to a short list of four to six candidates through research, reference calls,
          and screening conversations. The short list goes to the client. Two or three of those candidates make
          it to final rounds.
        </p>

        <p>
          The critical insight: the search is mostly over before it starts. If your name is not in the
          firm&rsquo;s database with enough context to surface in a relevant search, you will not be on the long
          list. If you are not on the long list, you do not exist to this search.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What gets you on the short list</h2>

        <p>
          The firms that fill CIO mandates at $300K and above - Korn Ferry, Spencer Stuart,
          Heidrick &amp; Struggles, Russell Reynolds, and the boutique technology practices - are looking
          for candidates who can answer one question clearly: What business problem have you solved, at what
          scale, and how do I know it worked?
        </p>

        <p>
          Not: What systems have you implemented. Not: What budget have you managed. What business
          problem - in terms a CFO or CEO would recognize - have you solved, and what is the measurable
          evidence that it worked?
        </p>

        <p>
          The candidates who make short lists fastest are the ones who have a clean answer to that question, who
          have delivered it at recognizable organizations (brand matters; a CIO at a company the client has
          heard of carries more weight than a CIO at a company they have not), and who the partner has met in
          person at least once in the last two years.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The calibration conversation</h2>

        <p>
          Every search firm screening call has a second agenda: calibration. The associate or partner is trying
          to determine whether you will fit in the client&rsquo;s culture, whether your compensation
          expectations are in range, and whether your narrative will resonate with a board audience.
        </p>

        <p>
          This is where most candidates lose searches they should win. They lead with technology instead of
          business impact. They under-sell the scale of what they have built or over-sell the scope of their
          mandate. They talk about what they managed rather than what changed because of them.
        </p>

        <p>
          The prep that matters is not practicing your career story. It is being able to describe every
          significant role in two sentences: what the company needed to solve, and what was measurably different
          after you were there.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Timing: why it matters more than almost anything else</h2>

        <p>
          Search firm relationships are time-sensitive in a specific way. A partner who meets you today and
          thinks you are excellent will have a different relationship with you in eighteen months than one who
          was introduced to you three years ago and has followed your career since.
        </p>

        <p>
          The executives who consistently land well are the ones who built search firm relationships when they
          did not need them - who had coffee with a Korn Ferry partner when they were two years into a
          successful CIO role, not the week after their role was eliminated.
        </p>

        <p>
          The signals that precede CIO searches are knowable. A company announces a major digital
          transformation initiative and the current technology function is clearly not built for it. A new CEO
          comes from a company known for technology investment. A board adds a technology committee. A PE firm
          acquires a company in a sector with a known technology deficit. These are the indicators that a CIO
          search is forming - often six to twelve months before the search is formally opened.
        </p>

        <p>
          The CIO who is already in conversation with the right firm partner when the search opens is the
          candidate who gets the call. Not the one who updated their LinkedIn profile the week before.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What Starting Monday tracks</h2>

        <p>
          Starting Monday watches the organizational signals that precede CIO searches - transformation
          announcements, leadership changes, board composition shifts, investment activity - across the
          companies you are targeting. The point is not to apply faster. It is to be in the right conversations
          before the search formally exists.
        </p>

        <p>
          When a search does open, the{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            prep brief
          </Link>{' '}
          assembles your win thesis, likely objections, and company-specific questions in sixty
          seconds - the document that converts a warm search firm conversation into a first-round interview.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The only question that matters</h2>

        <p>
          When the right partner calls - and if your positioning is right, they will - the outcome
          depends on one thing: whether you are already known to them in the right way, at the right moment.
        </p>

        <p>
          That is not luck. It is preparation with a specific shape.
        </p>

      </div>
    </BlogPost>
  )
}
