import type { Metadata } from 'next'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-coaching-job-search')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: 'https://startingmonday.app/blog/executive-coaching-job-search' },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-coaching-job-search',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
}

export default function ExecutiveCoachingJobSearchPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-coaching-job-search"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          There is a moment that happens in almost every executive coaching engagement focused on a
          job search. You ask your client how the week went. They give you a summary. It is accurate
          in broad strokes, but vague on specifics. You spend fifteen minutes reconstructing context
          before you can do any real work. By the end of the session, you have covered less ground
          than you planned because you were briefed instead of advising.
        </p>

        <p>
          This is not a failure of your client. It is a structural problem. The search is happening
          mostly between sessions, and you have no visibility into it. The tools your client is using
          to manage it are either inadequate or nonexistent. And the research burden alone, tracking
          dozens of companies, preparing for interviews, monitoring for signals before roles are
          posted, is consuming the time and attention that should be going toward relationship
          building and positioning.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What the search actually looks like from inside</h2>

        <p>
          A senior executive in transition is managing a campaign that would overwhelm a first-time
          job seeker. Forty to sixty target companies. Multiple relationships at each company in various
          stages. Search firm partners at six to eight firms, each of whom needs to be in current
          conversation. A LinkedIn presence that requires calibration without telegraphing urgency.
          Interview preparation for companies in completely different sectors. Follow-up sequences
          that go cold if not maintained precisely.
        </p>

        <p>
          Most executives are doing all of this without a system. They are tracking companies in a
          spreadsheet that is three weeks out of date. They are preparing for interviews the evening
          before, pulling information from press releases and a quick scan of the executive team page.
          They are missing signals because they are not monitoring the right things at the right
          frequency. The role at the company they have been watching for six months was created when
          the CEO changed. They found out when it appeared on LinkedIn, three weeks after the informal
          short list was already being assembled.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The question most coaches cannot answer</h2>

        <p>
          At the end of a typical coaching session, you know what your client told you. You know
          their intentions going into the week. You do not know whether they followed up on the
          conversation they said they would. You do not know whether they added the three companies
          you discussed to their list. You do not know whether the company they are most excited about
          has had any material developments since you last spoke.
        </p>

        <p>
          Your coaching is only as good as your client's execution between sessions. Most of the time,
          you have no direct visibility into that execution. You are working from their self-report.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What changes with the right infrastructure</h2>

        <p>
          The most useful thing you can do for a client in transition is not always in the session.
          It is making sure they have a system that keeps them accountable, informed, and prepared in
          the hours and days between your conversations.
        </p>

        <p>
          Consider what changes when your client is using a platform that monitors their target
          companies continuously, surfaces signals before roles are posted, generates a prep brief in about a minute
          before every interview, and sends them a morning digest of pending actions and
          new developments. They arrive at your session prepared. They have notes on conversations.
          They have already read the brief on the company they are interviewing with on Thursday.
          The session time that was going to context-building can go to strategy.
        </p>

        <p>
          And if your client grants you view access to their pipeline, you see the search the way
          it actually is between sessions. Which companies have gone quiet. Which follow-ups are
          overdue. Which relationships have been neglected since the last conversation you had
          about them. You ask better questions because you have better information.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The prep brief as a coaching instrument</h2>

        <p>
          One of the specific tools worth understanding is the AI-generated prep brief. Before an
          interview, your client can generate a brief on the target company in under a minute. The
          brief covers the company situation, the technology or operational context, the narrative
          your client should lead with, the likely objections and how to address them, and the
          questions that demonstrate genuine preparation at the peer level.
        </p>

        <p>
          As a coach, you can read the same brief before your session. You arrive already oriented.
          Your contribution is not summarizing public information your client could find themselves.
          Your contribution is the calibration work: what to emphasize and what to leave out, where
          the candidate has a real strength and where they should not try to fake one, what the
          interviewer is actually evaluating underneath the questions they are asking.
        </p>

        <p>
          That is the work that justifies a coaching engagement. The research does not.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The signal advantage</h2>

        <p>
          At the senior level, the executive who finds out about an opportunity when it is posted
          is already behind. The informal short list is assembled before the search firm is engaged.
          It comes from board relationships, operating partner networks, and the professional
          reputations that precede formal processes.
        </p>

        <p>
          The signals that precede CIO and CTO searches are readable if you know what to look for.
          A new CEO from a technology-forward background at a company with an aging infrastructure
          platform. A PE acquisition in a sector with a known technology deficit. An 8-K disclosing
          a digital transformation initiative without a named technology leader. An executive
          departure followed by silence. Each of these appears weeks or months before a search is
          formalized. Clients who are watching for them, systematically, across a list of forty to
          sixty target companies, get into conversations before the field is set.
        </p>

        <p>
          Monitoring forty companies manually is not realistic. A platform that does it automatically
          and surfaces the patterns is.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">A practical starting point</h2>

        <p>
          If you have a client entering transition in the next thirty days, recommend they try
          Starting Monday for their first month. Ask them to add their target companies, generate
          the search strategy brief, and share their pipeline with you before your next session.
          Read the brief on the company they are most excited about before you meet.
        </p>

        <p>
          The session will be different. Not because of the tool. Because you will both arrive with
          more useful information, and the conversation can start at a higher level than it usually does.
        </p>

        <p>
          That is the purpose of the infrastructure. Not to do your job. To make it possible for you
          to do the parts of it that only you can do.
        </p>

      </div>
    </BlogPost>
  )
}
