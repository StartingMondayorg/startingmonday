import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement FAQ | Starting Monday',
  description: 'FAQ for outplacement and transition firms evaluating Starting Monday as an execution layer for executive cohorts.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/faq' },
}

const FAQS = [
  {
    id: 'fit',
    category: 'Program Fit',
    question: 'Who is the best fit for this workflow?',
    answer: 'Best fit is VP and C-suite transition cohorts where speed, positioning quality, and interview readiness directly affect program outcomes. It is strongest when participants are in active or near-active search mode and willing to maintain weekly pipeline discipline.',
  },
  {
    id: 'replacement',
    category: 'Program Fit',
    question: 'Does this replace counselors, workshops, or coaching?',
    answer: 'No. It handles the operating layer between sessions: signal detection, workflow tracking, and prep generation. Your counselors remain the strategic and human layer. The intent is to increase session quality, not replace people.',
  },
  {
    id: 'activation',
    category: 'Rollout',
    question: 'How fast can a cohort go live?',
    answer: 'Most programs can launch within a week. Typical flow is kickoff alignment, seat provisioning, cohort invitation, and a brief orientation for counselors and participants. First meaningful usage usually appears in week one.',
  },
  {
    id: 'measurement',
    category: 'Measurement',
    question: 'How do we measure whether this is working?',
    answer: 'Use a 30-day scorecard: activation rate, signal-driven actions, prep brief usage before interviews, and momentum markers such as first qualified outreach or interview progression. Compare against your current cohort baseline.',
  },
  {
    id: 'privacy',
    category: 'Security & Privacy',
    question: 'How is participant data controlled?',
    answer: 'Access is permission-based and revocable. Participant-level sharing can be managed at the program level with audit visibility into activity. This allows counselor support without removing participant control.',
  },
  {
    id: 'security',
    category: 'Security & Privacy',
    question: 'What security posture should firms expect?',
    answer: 'Data is encrypted in transit and at rest, with role-based access controls and row-level protections in the data layer. We can provide additional documentation for partner due diligence conversations.',
  },
  {
    id: 'procurement-pack',
    category: 'Security & Privacy',
    question: 'What does your trust and procurement pack include?',
    answer: 'The trust pack covers data ownership model, participant permission controls, access logging and audit visibility, retention and deletion approach, and incident-response process. Most firms run security and legal review in parallel with pilot setup.',
  },
  {
    id: 'participant-lifecycle',
    category: 'Rollout',
    question: 'How do you handle participant lifecycle states such as pause, exit, or restart?',
    answer: 'Programs can manage participant status as active, paused, or exited. Access and visibility follow program permissions, and cohort reporting can segment by status so your team can distinguish adoption risk from planned inactivity.',
  },
  {
    id: 'integration',
    category: 'Rollout',
    question: 'What is manual versus automated in the pilot?',
    answer: 'The pilot is intentionally lightweight: participant setup, company targeting, and counselor workflow are designed to run without heavy integration work. Program teams can evaluate fit first, then decide whether deeper process integration is needed for scale.',
  },
  {
    id: 'sla',
    category: 'Rollout',
    question: 'What support model and response times should we expect?',
    answer: 'Support tiers are defined by impact and captured in partner commercial terms: P1 (pilot blocking) same-business-day response target, P2 (high impact with workaround) next-business-day response target, and P3 (configuration/content request) two-business-day response target. Pilot agreements can include escalation contacts and review cadence obligations.',
  },
  {
    id: 'intervention-thresholds',
    category: 'Rollout',
    question: 'What are the intervention trigger thresholds for stalled participants?',
    answer: 'Baseline trigger examples: no meaningful action for 7 days, overdue follow-up count above threshold, or prep-brief usage below expected level for active interview participants. Each trigger maps to named counselor and program-owner interventions in the runbook.',
  },
  {
    id: 'socialize-counselors',
    category: 'Rollout',
    question: 'How do we socialize this to counselors without adoption backlash?',
    answer: 'Position it as counselor leverage, not counselor replacement. First-session script: "This does not replace coaching. It removes repeatable tracking/admin work so we can spend more time on strategy and decision quality." The runbook includes rollout checklist and reinforcement prompts.',
  },
  {
    id: 'session-prep',
    category: 'Rollout',
    question: 'What exactly should counselors review before the next session?',
    answer: 'Use a three-part prep scan: what changed since last session, which participants are stalled by trigger threshold, and which high-stakes conversations need prep-brief review. The runbook includes a verbatim pre-session template.',
  },
  {
    id: 'pricing',
    category: 'Commercials',
    question: 'How does pricing work for outplacement cohorts?',
    answer: 'Programs are typically structured with seat-based pricing and centralized billing. Cohort volume and term can influence pricing bands. Start with pilot seats and scale after pass/fail review.',
  },
  {
    id: 'pilot-contract',
    category: 'Commercials',
    question: 'How is the pilot contract structured?',
    answer: 'Pilot agreements are typically scoped to one cohort, one scorecard window, and explicit pass/fail criteria. Expansion is a separate decision milestone after pilot readout, so procurement risk stays controlled.',
  },
  {
    id: 'results',
    category: 'Commercials',
    question: 'Can we use this in RFP or client outcome conversations?',
    answer: 'Yes, with appropriate claim discipline. Use your own observed cohort outcomes first, and treat shared pilot metrics as directional context unless explicitly approved as external claims.',
  },
]

const OBJECTIONS = [
  {
    objection: 'Our participants are already overloaded and will not adopt another platform.',
    response: 'Start with a small pilot cohort and set one daily action expectation. Framing matters: this is not another app, it is the operating layer that reduces uncertainty and morning decision fatigue.',
  },
  {
    objection: 'Our counselors already do this manually.',
    response: 'Manual support is valuable, but expensive at scale. The platform handles repeatable operating work so counselors can stay focused on judgment, positioning, and confidence coaching.',
  },
  {
    objection: 'Security review will slow us down.',
    response: 'Treat security review as a parallel track during pilot planning. Most teams can run legal and security diligence while the pilot workflow and scorecard are being prepared.',
  },
]

export default function OutplacementFaqPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Back to outplacement page
            </Link>
          </div>
        </div>
      </nav>

      <header className="bg-slate-950 px-4 sm:px-6 pt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
            Outplacement FAQ
          </p>
          <h1 className="text-[32px] sm:text-[42px] font-bold text-white leading-[1.15] tracking-tight mb-4">
            Questions, objections, and rollout clarity for partner firms.
          </h1>
          <p className="text-[15px] text-slate-200 leading-relaxed">
            If you cannot find your question here, contact us at contact@startingmonday.app.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-20">
<div className="max-w-3xl mx-auto">
          <div className="mb-12 pb-8 border-b border-slate-200">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-4">Quick jump:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(FAQS.map((faq) => faq.category))).map((category) => (
                <a
                  key={category}
                  href={`#${category.toLowerCase().replace(/ /g, '-')}`}
                  className="inline-flex px-3 py-1.5 text-[12px] font-medium border border-slate-300 rounded-full hover:border-orange-400 hover:bg-orange-50/30 transition-colors text-slate-600 hover:text-orange-700"
                >
                  {category}
                </a>
              ))}
              <a
                href="#objections"
                className="inline-flex px-3 py-1.5 text-[12px] font-medium border border-slate-300 rounded-full hover:border-orange-400 hover:bg-orange-50/30 transition-colors text-slate-600 hover:text-orange-700"
              >
                Common objections
              </a>
            </div>
          </div>

          {Array.from(new Set(FAQS.map((faq) => faq.category))).map((category) => (
            <section key={category} id={category.toLowerCase().replace(/ /g, '-')} className="mb-12">
              <h2 className="text-[20px] font-bold text-slate-900 mb-6 sticky top-14 bg-white pt-2 pb-3 border-b border-orange-200">
                {category}
              </h2>
              <div className="space-y-6">
                {FAQS.filter((faq) => faq.category === category).map((faq) => (
                  <div key={faq.id} id={faq.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-3">{faq.question}</h3>
                    <p className="text-[14px] text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section id="objections" className="mt-16 pt-12 border-t border-slate-300">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6">Common objections</h2>
            <div className="space-y-6">
              {OBJECTIONS.map((item) => (
                <div key={item.objection} className="border-l-4 border-orange-500 bg-orange-50/40 rounded-r-lg p-5">
                  <p className="text-[14px] font-semibold text-slate-900 mb-3">{item.objection}</p>
                  <div className="bg-white border border-orange-100 rounded-lg p-4">
                    <p className="text-[13px] text-slate-700 leading-relaxed">{item.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 border border-slate-200 rounded-2xl p-6 bg-slate-50">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Next step</p>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
              If this aligns with your delivery model, review pricing and pilot structure on the economics page.
            </p>
            <div className="flex flex-wrap gap-4 text-[13px]">
              <Link href="/for-outplacement/economics" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
                View outplacement economics
              </Link>
              <Link href="/for-outplacement/runbook" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
                Open pilot runbook and templates
              </Link>
              <Link href="/for-outplacement/executive-summary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
                View committee one-pager
              </Link>
              <Link href="/for-outplacement/trust-pack" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
                Open trust and governance pack
              </Link>
              <Link href="/for-outplacement" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
                Return to outplacement preview
              </Link>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-4">
              Decision without pressure: if pilot pass criteria are not met, close with no expansion commitment.
            </p>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

