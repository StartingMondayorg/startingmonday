import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('cio-board-presentation')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/cio-board-presentation',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/cio-board-presentation',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CioBoardPresentationPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/cio-board-presentation"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The first board presentation as a new CIO is not a technology briefing. The audience has
          heard hundreds of technology briefings. Most of them learned to stop listening.
        </p>

        <p>
          What the board wants is three things: what is the technology risk to the business right now,
          what is the technology capability the business needs to compete, and how confident should they
          be that you can close those two gaps. Everything else is detail.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Know what kind of board you are presenting to</h2>

        <p>
          Not all boards engage with technology the same way. A board with an audit committee that has
          been asking about technology risk is a different room than a board that approved a digital
          transformation budget three years ago and wants to know where the value is.
        </p>

        <p>
          Before you write a slide, talk to the lead independent director or the chair of the audit
          committee. Ask what the board has been worried about and what they approved that has not
          delivered yet. That conversation shapes the entire presentation.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The structure that works</h2>

        <p>
          The presentations that land follow a simple architecture. Start with the business situation,
          not the technology situation. State the company&rsquo;s three most important strategic objectives
          for the next eighteen months. Then show where technology is an enabler and where it is a
          constraint. Close with what you are going to do about it and what you need from the board
          to do it.
        </p>

        <p>
          That is a five-slide presentation. Most new CIOs bring twenty.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The questions behind the questions</h2>

        <p>
          Boards ask different questions than the questions they appear to be asking. When a board
          member asks about cybersecurity maturity, they are asking whether they should be worried about
          a breach headline. When they ask about the technology roadmap, they are asking whether the
          company can execute against its strategy without a multi-year IT overhaul.
        </p>

        <p>
          Prepare for the question behind the question. The answer to the surface question is the data.
          The answer to the real question is your judgment.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The 90-day framing</h2>

        <p>
          New CIOs who present to the board in the first ninety days have a structural advantage. The
          board expects an assessment, not a defense. Use that window. Present what you found. Present
          what you think the highest-priority risks are. Present what you are going to do first and why.
        </p>

        <p>
          If you have been in the seat longer than ninety days and have not yet presented to the board,
          the framing shifts. You are no longer assessing. You are accountable.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What to leave out entirely</h2>

        <p>
          Leave out the technology detail. Leave out the vendor names unless a vendor is a strategic
          risk. Leave out the organizational chart unless it is the topic of the presentation. Leave out
          anything that requires a technical explanation before the business point lands.
        </p>

        <p>
          The board is not your audience for the platform migration. They are your audience for what
          the platform migration means for the company&rsquo;s ability to serve customers in two years.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The practice you need before you walk in</h2>

        <p>
          Practice the three hardest questions you expect and your answers to each one. Do it out loud,
          not in your head. The preparation that happens in writing is different from the preparation
          that happens under a board member&rsquo;s direct eye contact.
        </p>

        <p>
          If you have a sponsor on the board, brief them twenty-four hours before the meeting. They will
          tell you if the framing is off before the room does.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What Starting Monday assembles</h2>

        <p>
          Walking into a board presentation without knowing what the board has been worried about is
          the most preventable mistake a new CIO makes. The organizational signals that precede those
          concerns are visible before the first meeting: prior audit findings, transformation commitments
          made to shareholders, technology incidents that reached the press, and board committee
          composition changes.
        </p>

        <p>
          The{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            prep brief
          </Link>{' '}
          builds that context from the company&rsquo;s actual history in sixty seconds, so the first
          presentation is already calibrated to what the room is thinking.
        </p>

      </div>
    </BlogPost>
  )
}
