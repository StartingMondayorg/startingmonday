import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('executive-resume-gaps')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/executive-resume-gaps',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/executive-resume-gaps',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function ExecutiveResumeGapsPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/executive-resume-gaps"
      cta={{
        headline: 'Something is blocking your search. Find out what.',
        body: 'The AI strategy brief synthesizes your positioning, targets, and pipeline to surface what is holding you back. Run it in about a minute.',
        label: 'Run your strategy brief →',
        href: '/signup',
        note: 'Free for 30 days. No credit card.',
      }}
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The first person to read your resume in a retained search is not the partner. It is an
          associate running a long list against a criteria sheet.
        </p>

        <p>
          That associate is looking for five or six signals. If those signals are absent or ambiguous,
          your name does not reach the partner. The resume that earns the first call is not the most
          impressive resume. It is the one that most clearly shows the criteria the search is
          screening for.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The first filter and what it looks for</h2>

        <p>
          Search firms build criteria sheets from the client brief. For a CIO role, the standard
          criteria include: scope of prior role (revenue, employees, technology budget), industry
          experience, P&amp;L or budget ownership, board or C-suite exposure, and a transformation or
          modernization narrative.
        </p>

        <p>
          If those criteria are not visible within the first two-thirds of your resume, the associate
          moves on. It does not matter that the experience is there. If it is not readable at speed,
          it is not findable at scale.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Technology outputs instead of business outcomes</h2>

        <p>
          The most common gap in CIO resumes is describing what was built instead of what it delivered.
          Migrated the ERP. Deployed a cloud infrastructure. Built a data platform. Those are technology
          outputs. They tell the reader what happened, not whether it mattered.
        </p>

        <p>
          The business outcome version: led a two-year ERP migration that reduced order-to-cash cycle
          time by thirty percent and eliminated three legacy systems that were costing two million a
          year in maintenance. That version answers the question the search firm is actually asking:
          what did you do for the business?
        </p>

        <p>
          Every bullet that describes a technology deliverable should have a business outcome attached
          to it. Revenue, cost, speed, risk reduction. If you cannot quantify it, describe the strategic
          significance. Do not leave it as a technology deliverable alone.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The P&amp;L gap</h2>

        <p>
          Many technology executives have never held formal P&amp;L ownership. The resume shows technology
          budget management, which is cost accountability, not P&amp;L ownership. At the CIO level,
          search firms want evidence that you understand and have influenced the revenue side of the
          business, not just the cost side.
        </p>

        <p>
          The fix is not to claim P&amp;L ownership you did not have. It is to make visible the ways your
          technology decisions affected revenue. A platform that enabled a new product line. An
          integration that accelerated a market entry. A system that supported a pricing model change
          that improved margin. Those are P&amp;L-adjacent outcomes that signal commercial fluency without
          overstating your role.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Tenure patterns and how they read</h2>

        <p>
          Short tenures require explanation. Two years at three consecutive companies raises a pattern
          question before the associate has read a single bullet. The context matters: a turnaround
          situation, an acquisition, a carve-out. But the context has to be visible on the resume or
          it reads as instability.
        </p>

        <p>
          The fix is a one-line context note after the title: &ldquo;Role created for post-merger
          integration; mandate completed in 22 months.&rdquo; That converts a potential red flag into
          a credential.
        </p>

        <p>
          Long tenures at a single company raise a different question: has this person&rsquo;s
          experience been deep or narrow? If you spent twelve years at one organization, the resume
          needs to show expanding scope across those years. New mandates, new geographies, new business
          units. Lateral depth reads as stagnation. Expanding scope reads as career progression.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The language gap</h2>

        <p>
          CIO resumes written in technology language do not read as executive documents. Agile
          transformations. DevSecOps implementations. Cloud-native architectures. Those phrases signal
          technical fluency and executive distance at the same time.
        </p>

        <p>
          Executives talk about business objectives. Technology leaders talk about capability delivery.
          The resume that gets on the short list talks about business objectives in the language an
          executive committee recognizes.
        </p>

        <p>
          Replace &ldquo;implemented a zero-trust security architecture&rdquo; with &ldquo;redesigned
          the company&rsquo;s security posture to meet enterprise client requirements and close two
          deals that had been blocked by security reviews.&rdquo; Same work. Different language.
          Different audience.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">How to fix it before you send</h2>

        <p>
          Read your resume as if you are looking for someone else. Does it answer what the business
          got for every role you held? Does it show scope clearly enough for an associate to check a
          criteria box in fifteen seconds? Does it read in executive language or technology language?
        </p>

        <p>
          Fix the five weakest bullets before you send anything. The weakest bullets are the ones that
          describe activity without outcome, use technology language without business translation, or
          show scope without context.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What the quality check does</h2>

        <p>
          Starting Monday&rsquo;s resume quality check reads your resume against the role you are
          targeting. It returns an ATS score, a recruiter-grade assessment, and a prioritized list of
          bullets that need to be strengthened before you send.
        </p>

        <p>
          The{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            resume tailoring feature
          </Link>{' '}
          rewrites each bullet in the language of the specific job description without keyword stuffing,
          so the resume reads as a match to both the search criteria and the human reading it.
        </p>

      </div>
    </BlogPost>
  )
}
