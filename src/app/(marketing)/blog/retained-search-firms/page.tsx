import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('retained-search-firms')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/retained-search-firms',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/retained-search-firms',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function RetainedSearchFirmsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/retained-search-firms"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The retained search firm is paid by the company doing the hiring. That single fact explains
          almost everything about how the relationship works and where most candidates go wrong.
        </p>

        <p>
          This is not a criticism of search firms. The best search firm partners are genuine allies in
          a process that is difficult for both sides. But they are allies with a primary obligation to
          their client. The candidate who understands that navigates the relationship more effectively
          than the candidate who expects the firm to advocate for them.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How retained search actually works</h2>

        <p>
          A retained search begins when a company pays a firm a fee, typically one-third of first-year
          total compensation, to find and deliver a short list of qualified candidates. The fee is
          split: one-third on engagement, one-third at presentation of candidates, one-third at
          placement.
        </p>

        <p>
          The firm is incentivized to close the search. A search that does not close is a partial fee.
          That incentive structure aligns the firm with the candidate more than most candidates realize.
          A search firm that presents you to a client wants you to get the role. What it cannot do is
          make the client want you.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Getting in the file versus getting on the short list</h2>

        <p>
          Most candidates approach search firms with the goal of getting a call. The real goal is being
          in the file before the search opens.
        </p>

        <p>
          Every search firm maintains a database of candidates. When a search opens, the first place
          they look is their own database. A CIO who has a relationship with two or three senior
          partners at the firms that run searches in their sector is three steps ahead before the
          search starts.
        </p>

        <p>
          Building that relationship takes time and does not produce immediate results. The candidates
          who are consistently on short lists started building those relationships years before they
          needed them.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The relationship before the search opens</h2>

        <p>
          The right way to build a relationship with a search firm is to be useful before you need
          anything. Share an insight about a company in your sector. Make an introduction to someone
          you know. Respond to their outreach with a thoughtful answer even when the role is not right.
        </p>

        <p>
          Search firm partners remember candidates who made their jobs easier. They also remember
          candidates who called only when they were looking and went quiet otherwise. The file you are
          in reflects that memory.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to say in the first call</h2>

        <p>
          The first call with a search firm partner is a screening call whether or not it is presented
          that way. They are assessing scope of experience, career narrative, and how you present
          yourself under low-stakes conditions. How you present on a fifteen-minute informal call is
          how they will represent you to clients.
        </p>

        <p>
          Three things that help: a clear one-sentence answer to what you are looking for, a specific
          example of the most relevant transformation you have led, and a name or two you can offer as
          a connection they do not have. The last one is underrated. It signals network depth and
          generosity at the same time.
        </p>

        <p>
          Three things that hurt: vagueness about what you want, a long list of things you will not
          do, and pressure to be presented before the relationship is established.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Following up without becoming a nuisance</h2>

        <p>
          The right follow-up cadence with a search firm is quarterly when you are not in active search
          and monthly when you are. A short email with something useful, an article you wrote, a
          contact they might want, an observation about movement in your sector, outperforms a
          check-in that asks what searches they have open.
        </p>

        <p>
          If you have been presented as a candidate and have not heard back in two weeks, one follow-up
          is appropriate. After that, the silence is information. Either you are not the finalist or
          the search is moving slowly. Neither is solved by more outreach.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">When the firm comes to you</h2>

        <p>
          The call you want from a search firm is the one where they are presenting you, not screening
          you. That call comes when your profile matches a search that is already open. The way to be
          ready for it is to have your story clear, your resume current, and your availability honest.
        </p>

        <p>
          If the timing is wrong, say so directly and say why. &ldquo;I have been in this role for
          eighteen months and am not looking to move before the two-year mark&rdquo; is a more useful
          answer than a vague deferral. It gives the firm information they can use when the next search
          opens that does match your timing.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What Starting Monday tracks</h2>

        <p>
          Starting Monday logs every search firm conversation and every referral in the pipeline, so
          you always know which firms have seen your materials, which partners have introduced you to
          clients, and where each relationship stands. Nothing goes cold because it was not tracked.
        </p>

        <p>
          The platform also monitors the organizational signals that precede retained searches before
          the search firms receive the mandate. The{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            early role intelligence feature
          </Link>{' '}
          surfaces those signals so you can reach out to the right firm partners before the search
          opens, not after it closes.
        </p>

      </div>
    </BlogPost>
  )
}
