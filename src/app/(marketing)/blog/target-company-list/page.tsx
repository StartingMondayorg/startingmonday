import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('target-company-list')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/target-company-list',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/target-company-list',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function TargetCompanyListPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/target-company-list"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          Most CIOs start an executive search by updating their resume. The ones who land fastest
          start by making a list.
        </p>

        <p>
          Not a list of job openings. Those are late. A list of forty to sixty organizations where
          they would say yes before the offer was made - companies they had studied, understood,
          and decided they wanted. That list is the instrument. Everything else is the work of
          playing it.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Why the list has to come first</h2>

        <p>
          A senior technology search is not a job application process. It is an influence campaign.
          The people who fill CIO roles at $300,000 and above are not responding to postings. They
          are receiving calls from partners at Spencer Stuart and Korn Ferry who have tracked their
          careers for years, who know their track record without asking, and who are assembling short
          lists before the role has a name.
        </p>

        <p>
          Being on one of those short lists requires something specific: the right people have to
          know who you are and why you are relevant to the company in question. That knowledge does
          not arrive through applications. It arrives through relationships, timing, and attention.
          The list determines what you are paying attention to.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What belongs on the list</h2>

        <p>
          Start with companies you would say yes to before the salary is negotiated. This is a
          tighter constraint than it sounds. A list built around aspiration - companies you would
          accept only under perfect conditions - produces the same outcome as no list at all.
        </p>

        <p>
          Scale is the first boundary. CIO roles in organizations between $500 million and $5 billion
          in revenue tend to offer the combination of scope, budget authority, and transformation
          mandate that makes the work meaningful. Below that threshold, the role is often an IT
          management position with a better title. Above it, the function can fragment, with a Chief
          Digital Officer or CTO absorbing the strategic half.
        </p>

        <p>
          Your sector history sets the second constraint. The scar tissue you carry from fifteen
          years in a sector - the vendor relationships, the regulatory patterns, the specific
          failure modes - is not easily transferable. A CIO who has spent a career in financial
          services is a harder case to make in healthcare than one who has been there from the start.
          Be honest about where your record is dense and where it is thin.
        </p>

        <p>
          Organizational stage is the third dimension. Post-acquisition integration. Post-IPO scaling.
          Digital transformation at a company that has never attempted it before. PE portfolio company
          building toward exit. Each creates a different CIO mandate and a different definition of
          success. Not all of them match your history. The list should include companies where your
          specific pattern of experience is genuinely relevant, not just companies that interest you
          in the abstract.
        </p>

        <p>
          Geography is the fourth. Remote has loosened this constraint, but not as much as candidates
          claim at the CIO level. Boards want to see technology leaders in the building. Before adding
          a company to your list, ask whether you would actually relocate. If the honest answer is no,
          the company should not be on the list.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to find the companies</h2>

        <p>
          The list is built from five sources. The discipline is to work all five rather than
          defaulting to the one that feels most comfortable.
        </p>

        <p>
          Your network first. Ask the fifteen people you trust most - former CEOs, operating
          partners, board members, retained search partners - which organizations they are
          currently watching. Not which ones are hiring. Which ones are moving. These are different
          questions with different answers, and the second produces better intelligence.
        </p>

        <p>
          PE and VC portfolio sites second. A private equity firm that acquired a company in your
          sector eighteen months ago is likely evaluating its technology leadership. The search has
          often not been formally opened. Sometimes the current CIO does not know it is coming. Map
          the portfolios of the six to eight most active firms in your sectors and work back through
          your network to anyone connected to those funds.
        </p>

        <p>
          Leadership change tracking third. A new CEO or CFO at a company in your target sector is
          one of the highest-probability signals for an upcoming technology leadership change. New
          CEOs restructure within twelve months. New CFOs impose systems change within eighteen. A
          board that adds a technology committee is explicitly elevating technology governance. These
          precede formal searches by six months to a year.
        </p>

        <p>
          Industry association boards fourth. CHIME for health system CIOs. ISACA for
          governance-focused technology leaders. The industry organizations that publish leadership
          rosters tell you who holds the seat now and which companies take the role seriously enough
          to invest in the community. Those are the organizations that build the right mandates.
        </p>

        <p>
          Sector-specific press fifth. The trade publications for your target industries, read
          specifically for organizational signals: transformation announcements, major system
          implementations, executive quotes about technology investment, M&amp;A activity. Not
          general business news - the vertical press, where signals appear six months before they
          reach broader coverage.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What you do with the list</h2>

        <p>
          A list is static. The signal is in what changes.
        </p>

        <p>
          A company on your list that announces a new CEO, begins a public conversation about
          transformation investment, acquires an organization in an adjacent sector, or appoints board
          members from technology-forward companies is telling you something. The two weeks before
          they open a formal CIO search is when the informal short list is being assembled. That is
          the window. The candidate who is already in conversation with the right search partner or
          board member when the search forms is the candidate who gets the first call. The one who
          updated their LinkedIn profile the week before is not.
        </p>

        <p>
          Watch the list. Know when something moves. Be ready when it does.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The only version of ready that matters</h2>

        <p>
          Most CIO candidates position themselves as available and excellent. That is necessary but
          not sufficient.
        </p>

        <p>
          The executives who land consistently in their class position themselves as already paying
          attention - to the right organizations, at the right moment, for the right reasons.
          That attention starts with a list. It is maintained by watching the list. And it culminates
          in being the candidate who was already in motion when the search opened.
        </p>

        <p>
          Build it before you need it. The time to start is not when the role appears.
        </p>

      </div>
    </BlogPost>
  )
}
