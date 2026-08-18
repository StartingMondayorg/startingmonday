import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { getPost } from '@/lib/blog-posts'

const post = getPost('cio-compensation-negotiation')!

export const metadata: Metadata = {
  title: `${post.title} - Starting Monday`,
  description: post.description,
  keywords: post.keywords,
  alternates: {
    canonical: 'https://startingmonday.app/blog/cio-compensation-negotiation',
  },
  openGraph: {
    title: post.title,
    description: post.description,
    url: 'https://startingmonday.app/blog/cio-compensation-negotiation',
    type: 'article',
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
}

export default function CioCompensationNegotiationPage() {
  return (
    <BlogPost
      title={post.title}
      description={post.description}
      date={post.date}
      readTime={post.readTime}
      url="https://startingmonday.app/blog/cio-compensation-negotiation"
    >
      <h1 className="sr-only">{post.title}</h1>
      <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <p>
          The compensation conversation for a CIO role is different from every negotiation you have done before.
          Most executives approach it as a salary discussion. The best outcomes come from treating it as a mandate
          discussion.
        </p>

        <p>
          What you are paid is a function of what the organization believes you will deliver. Get the mandate
          right and the compensation follows. Negotiate the number before the mandate is clear and you leave
          money on the table regardless of the outcome.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Understand the structure before you negotiate any of it</h2>

        <p>
          CIO total compensation at the $300K&ndash;$700K range has four components that move independently:
          base salary, annual incentive target, long-term incentive, and benefits. Each has different flexibility
          and different risk.
        </p>

        <p>
          <strong className="text-slate-900">Base salary</strong> is the most visible number and often the least
          flexible at large companies, because it ties to compensation bands the CHRO manages across peers. Pushing
          hard on base can create peer friction before you start. It is rarely where the real negotiation is.
        </p>

        <p>
          <strong className="text-slate-900">Annual incentive target</strong> is worth understanding before you
          accept any number. What does it pay when the company hits plan? What does it pay when the company misses
          plan by 10%? The target percentage is almost irrelevant without the payout curve. Ask for the payout
          history for the last three years. The answer will tell you more than the target does.
        </p>

        <p>
          <strong className="text-slate-900">Long-term incentive</strong> is where the largest dollars often
          sit for a CIO at public or PE-backed companies. At a public company, this is typically restricted stock
          or options with a four-year vest. At a PE-backed company, it is equity with a payout tied to an exit
          event. The gap between the two is enormous. Understand the exit thesis before you value PE equity.
        </p>

        <p>
          <strong className="text-slate-900">Sign-on and make-whole</strong> components are often the most
          negotiable. If you are leaving unvested equity or a bonus payout, ask to be made whole. This is a
          standard ask and most companies expect it. Not asking is common. It is also expensive.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The mandate conversation comes first</h2>

        <p>
          Before any compensation conversation, you need a clear answer to three questions: What does this
          company need the CIO to deliver in the first eighteen months? Who does the CIO report to and how much
          budget authority do they have? What happened with the last person in the role?
        </p>

        <p>
          The answers to those questions determine what the role is actually worth to the organization. A CIO
          mandate with a ten-year technology modernization ahead of it, a direct CEO reporting line, and a board
          that is watching the transformation closely is worth more than the same title at a company in maintenance
          mode. If you negotiate without knowing this, you are pricing the title, not the mandate.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Where executives leave money on the table</h2>

        <p>
          Three patterns show up consistently in CIO negotiations that end badly.
        </p>

        <p>
          The first is <strong className="text-slate-900">negotiating too early</strong>. If you discuss
          compensation before the company is convinced you are the candidate, you are negotiating from a position
          of interest rather than a position of need. Once the company decides you are the answer to their
          problem, the negotiation dynamic shifts entirely. Wait for that moment.
        </p>

        <p>
          The second is <strong className="text-slate-900">anchoring on current compensation</strong>. Your
          current total compensation is a data point, not a floor. If the market rate for the mandate is higher,
          anchor there. If you are making a significant step up in scope, make the case for the scope, not the
          increment over what you are currently earning.
        </p>

        <p>
          The third is <strong className="text-slate-900">accepting the first offer without a counter</strong>.
          Most companies leave room in the first offer for negotiation. The executives who ask for a specific
          increment, with a reason, move past it faster than the ones who say &ldquo;I need some time to think
          about it.&rdquo; A specific counter signals confidence. Silence signals uncertainty.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The search firm dynamic</h2>

        <p>
          When a retained search firm is involved, they are managing the negotiation on behalf of the client. They
          want the search to close. They have an incentive for the candidate to accept.
        </p>

        <p>
          That does not make them adversarial. But it means that the information they give you about
          &ldquo;what the client can do&rdquo; is a starting point, not a limit. The most experienced search
          firm partners will tell you to make a clean, specific ask rather than an open-ended one. Follow that
          advice. It closes faster and produces better outcomes than extended back-and-forth.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">What Starting Monday tracks</h2>

        <p>
          Understanding what a specific mandate is worth requires knowing what the company has committed to, who
          is watching the outcome, and what the prior tenure looked like. Starting Monday assembles that context
          from organizational signals before the search opens.
        </p>

        <p>
          The{' '}
          <Link href="/for-cio" className="text-slate-900 underline hover:text-slate-600 transition-colors">
            prep brief
          </Link>{' '}
          builds the mandate context, likely objections, and company-specific intelligence in sixty seconds.
          Walking into a compensation conversation with that picture is a different experience than walking in
          with only the job description.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">The number that matters</h2>

        <p>
          Total compensation over the first three years, risk-adjusted, is the number worth optimizing. Not
          base salary. Not the headline total comp. The real economic value of the offer, net of risk.
        </p>

        <p>
          Most executives do not calculate that number before they accept. The ones who do negotiate differently.
        </p>

      </div>
    </BlogPost>
  )
}
