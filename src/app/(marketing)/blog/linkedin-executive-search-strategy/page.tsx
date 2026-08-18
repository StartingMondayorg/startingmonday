import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('linkedin-executive-search-strategy')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: 'https://startingmonday.app/blog/linkedin-executive-search-strategy' },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/linkedin-executive-search-strategy',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
}

export default function LinkedInExecutiveSearchPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/linkedin-executive-search-strategy"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          LinkedIn is the only professional platform where retained search partners, board members,
          and CEOs spend time in a professional context. That makes it uniquely valuable for CIO and
          CTO candidates - and uniquely easy to misuse.
        </p>

        <p>
          The executives who use LinkedIn best in an active search are not the ones who optimize
          their profiles and wait. They are the ones who understand what the platform signals, use it
          intentionally, and avoid the moves that mark them as someone searching desperately rather
          than someone whose attention is worth having.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Your profile is a board document, not a resume</h2>

        <p>
          At the CIO and CTO level, your LinkedIn profile will be reviewed by board members, search
          firm partners, CEOs, and operating partners before any conversation happens. Most of them
          are not reading for job history. They are reading for signal: is this person credible at
          the level of the role? Do they think clearly? Do they communicate with authority?
        </p>

        <p>
          The profile section that matters most is not the headline. It is the About section. This is
          the 2,600-character field that most technology executives waste on a summary of their last
          three roles. Use it differently. Write two to three paragraphs that establish your point of
          view: what you believe about technology leadership at the executive level, where you have
          created the most distinctive value, and what kind of mandate fits you best. Write it the way
          you would write a paragraph for a board bio - specific, confident, without hedging.
        </p>

        <p>
          The headline should describe your identity, not your most recent title.
          &ldquo;Transformation CIO | Healthcare and Financial Services | Large-Scale Platform
          Modernization&rdquo; tells the right people why to pay attention.
          &ldquo;Chief Information Officer at Acme Corp&rdquo; tells them nothing they could not
          read in the experience section.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to publish and why it matters</h2>

        <p>
          Publishing on LinkedIn during an active search serves one purpose: demonstrating that you
          think at the right level. Not performing expertise - demonstrating it.
        </p>

        <p>
          A 200-word post that makes a specific, defensible point about technology leadership - not a general observation, but a claim based on your actual experience - is read by
          exactly the people you need to reach. The retained search partners who track CIO and CTO
          candidates watch what those candidates publish. A post that shows you think well is worth
          more than ten recruiter emails.
        </p>

        <p>
          What to write: observations about organizational patterns you have seen, lessons from
          specific situations you have navigated, analysis of market moves from a technology
          leadership perspective. What not to write: motivational content, reshares with a one-line
          comment, anything that reads like it was written to generate engagement rather than to say
          something true.
        </p>

        <p>
          Publish at least once a week during an active search. Search partners and board members are
          not checking LinkedIn daily. If you publish once a month, the odds of being visible at the
          moment that matters are low.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The direct message approach that works</h2>

        <p>
          The DM is underused at the executive level because most executives either avoid it
          entirely or use it wrong. Wrong means starting with an ask. Right means starting with
          value.
        </p>

        <p>
          The best message to a search firm partner you have not spoken to in a while: three
          sentences. One acknowledging your last conversation or a specific thing they have written.
          One sharing a specific observation about the sector or role type they focus on. One genuine
          question about what they are seeing in the market. No ask. No &ldquo;I am currently in
          transition and would love to reconnect.&rdquo;
        </p>

        <p>
          The response rate to value-first DMs from technology executives with authoritative profiles
          is high. The response rate to transition announcements is approximately what you would
          expect.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The signal-watching function most executives miss</h2>

        <p>
          LinkedIn&rsquo;s most underused feature for a CIO or CTO in active search is the ability
          to follow companies and watch for organizational signals without anyone knowing you are
          watching.
        </p>

        <p>
          When a company on your target list posts a new executive appointment, announces a
          transformation initiative, adds a board member from a technology-forward background, or
          starts publishing engineering content they have not published before, LinkedIn surfaces it
          in your feed. These signals often appear six to twelve months before a search opens.
        </p>

        <p>
          Follow the forty to sixty companies on your target list. Check the feed on a fixed
          schedule - twice a week is enough. When something moves, act immediately. The first
          conversation with the right person, at the moment the signal appears, is worth more than
          every application submitted after the role is posted.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What not to do</h2>

        <p>
          The Open to Work badge: do not use it. The signal it sends - that you are available,
          publicly, and urgently - is not the signal you want to lead with at the CIO or CTO
          level. Search firm partners and board members who see it assume the search has been
          difficult. You can enable the version that is visible only to recruiters, but even that
          is not necessary if the rest of your profile is doing its job.
        </p>

        <p>
          Undirected connection requests: do not send them. Five specific, personalized requests to
          the right people are worth more than five hundred generic ones. Volume signals desperation;
          specificity signals judgment.
        </p>

        <p>
          Low-insight engagement: do not comment on posts you do not have a genuine perspective on.
          A visible record of generic comments on high-profile posts damages the credibility you are
          trying to build. If you have nothing specific to add, do not add anything.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The platform as intelligence infrastructure</h2>

        <p>
          Used well, LinkedIn is not just a visibility tool. It is an intelligence infrastructure.
          The companies you follow, the executives you monitor, the organizational changes you catch
          early - all of it feeds the target company list that is the foundation of a well-run
          search.
        </p>

        <p>
          The CIO or CTO who is already watching the right companies when the signal appears is in a
          different position than one who finds out when the role is posted. LinkedIn, combined with
          a live target list and a systematic monitoring cadence, is what makes that difference
          achievable.
        </p>

      </div>
    </BlogPost>
  )
}
