import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('how-cios-find-jobs')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: 'https://startingmonday.app/blog/how-cios-find-jobs' },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/how-cios-find-jobs',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
}

export default function HowCiosFindJobsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/how-cios-find-jobs"
      cta={{
        headline: 'You know how it works. Here is the system for doing it consistently.',
        body: 'Starting Monday monitors the organizational signals that precede CIO searches and helps you act on them before the role is formalized. Start watching your target companies quietly.',
        label: 'Start watching now →',
        href: '/signup',
        note: 'Free for 30 days. No credit card.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The answer most people do not say out loud: almost nobody at the CIO level finds their next
          role through a job board. The process by which senior technology executives land their next
          position looks almost nothing like what the word &ldquo;job search&rdquo; suggests.
        </p>

        <p>
          Understanding how it actually works changes what you should be doing with your time.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How CIO searches are actually filled</h2>

        <p>
          At the $250,000 and above level, the process follows a consistent structure. A company
          decides they need a new CIO. Before engaging a search firm, the CEO and board make calls
          to people they trust: board members at comparable companies, operating partners at their
          private equity fund, the CEO of a peer organization. Those conversations produce three to
          seven names - people who are already known, already credible, and already in some form
          of relationship with the network around the company.
        </p>

        <p>
          If a retained search firm is engaged - and at this level they usually are - the
          firm conducts its own outreach to its database and existing relationships. The long list is
          fifteen to twenty-five names. Most of them came from the same informal network conversations
          the company was already having.
        </p>

        <p>
          Applications submitted through a posted job opening rarely appear on either list.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What this means for your search</h2>

        <p>
          Being findable when the search opens is a byproduct of being known before the search opens.
          Being known before the search opens is a function of three things: the quality of your
          relationships with retained search partners, your presence in the board and CEO networks
          around your target companies, and your visibility as a specific kind of technology
          leader - not a general-purpose executive, but one with a clear and recognizable profile.
        </p>

        <p>
          The executives who are named in those early conversations are not the ones who had the most
          applications in. They are the ones who had a real conversation with the right partner at
          Heidrick six months ago. They are the ones who were introduced to the operating partner at
          the PE fund by a mutual contact. They are the ones who published something about digital
          transformation that the CEO read three weeks before the search opened.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The three relationships that determine whether you get the call</h2>

        <p>
          Retained search firm partners. Not recruiters generally - specific partners at the
          firms that fill CIO mandates in your sectors. Korn Ferry, Spencer Stuart, Heidrick
          &amp; Struggles, Russell Reynolds, and the boutique technology practices are the most active
          at the $300,000 and above level. Each has partners who specialize in specific industries and
          company types. The goal is to be in genuine, current conversation with six to eight of the
          right ones - not because you are looking, but because they find the relationship useful.
          Search partners who find you useful introduce you to searches. Search partners who only hear
          from you when you are searching do not.
        </p>

        <p>
          Board members and operating partners. At the companies in your target sectors, every board
          member is a potential path to a CIO search. Operating partners at PE funds in your sector
          are even more direct, because they often initiate the CIO search themselves after a
          portfolio acquisition. These relationships are built over years, not assembled under
          urgency. The board member who knows you as a respected technology executive in their network
          is the one who mentions your name before the search firm is even engaged.
        </p>

        <p>
          Your peer network. Other CIOs and CTOs are your most valuable referral source. They are
          asked for recommendations by search firms and boards regularly. A recommendation from a
          technology executive the board respects carries more weight than almost any other channel.
          Invest in these relationships genuinely, not transactionally. The CIO who recommends you
          is not doing it as a favor - they are doing it because they trust your judgment and
          believe it reflects well on them.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The role of organizational intelligence</h2>

        <p>
          The executives who land the best roles fastest are not the ones who search hardest. They
          are the ones who are watching the right companies at the right moment.
        </p>

        <p>
          A CIO who knows that a company on their target list just named a new CEO from a
          technology-forward background is in a different position than one who finds out when the
          role is posted. The new CEO is having conversations about technology leadership before the
          search formally opens. Being in that conversation - because you were already watching
          the company, already in relationship with someone close to the board - is the difference
          between being on the informal short list and being an applicant.
        </p>

        <p>
          The signals that precede CIO searches are readable: a new CEO from a company known for
          technology investment, a board that adds a technology committee, a PE acquisition in a
          sector with a known technology deficit, a transformation announcement without a clear
          technology leader named. Each of these appears six months to a year before the formal
          search opens. Watching for them - systematically, across a list of forty to sixty
          target companies - is what puts you in the right conversations at the right moment.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to do this week</h2>

        <p>
          Build the target list before anything else. Forty to sixty companies where you would say
          yes before the offer is made, filtered by sector, stage, and the specific CIO profile your
          track record supports. This is the intelligence engine for everything else.
        </p>

        <p>
          Reach out to five search firm partners before the end of the month. Not to announce you are
          looking. To have a useful conversation - share a specific observation, ask what they are
          seeing in your sectors, be genuinely helpful. The relationship you build in that
          conversation will be current when the search opens.
        </p>

        <p>
          Identify three people in your peer network and schedule conversations in the next thirty
          days. Other CIOs and CTOs who know your work, who are likely to be asked for
          recommendations, and who you have not spoken to in the last six months. No agenda required.
          The relationship does the work.
        </p>

        <p>
          The search that looks effortless from the outside - the CIO who lands a great role
          quickly, apparently without trying - is almost always the product of preparation that
          was invisible because it happened before the urgency was visible. That is the only version
          of this that works reliably.
        </p>

      </div>
    </BlogPost>
  )
}
