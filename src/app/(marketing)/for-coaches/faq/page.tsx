import type { Metadata } from 'next'
import Link from 'next/link'
import { CoachPreviewActions } from '../coach-preview-actions'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { BrandIcon } from '@/components/BrandIcon'
import { CapabilityDisclosure } from '@/components/CapabilityDisclosure'

export const metadata: Metadata = {
  title: 'Coach FAQ & Objection Responses | Starting Monday',
  description: 'FAQ for executive coaches about Starting Monday. Covers data security, pricing, ROI, objections, and the fastest path to the preview.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches/faq' },
}

const CONTACT_EMAIL = 'contact@startingmonday.app'
const CONTACT_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`
const FAQ_COMPOSE_URL = `${CONTACT_COMPOSE_URL}&su=${encodeURIComponent('Coach FAQ Question')}`
const FEEDBACK_COMPOSE_URL = `${CONTACT_COMPOSE_URL}&su=${encodeURIComponent('Coach Feedback')}`

const FAQS = [
  {
    id: 'proof',
    category: 'Evidence & Validation',
    question: 'How do you validate your claims? Are these real results?',
    answer: 'We publish methods, not unverified outcome numbers. Our early-signal timing model is documented with sources and confidence notes, and the prep and pipeline workflow is verifiable in a free 30-day preview with your own clients. Pilot observations to date are directional and shared qualitatively. When verified cohort outcomes are available, we will publish them with sample sizes, date windows, and definitions - because coaches trust data over language.',
  },
  {
    id: 'integration',
    category: 'Technical & Operations',
    question: 'How does this integrate with my existing tools (CRM, email, calendar)?',
    answer: 'Starting Monday maintains a separate, private pipeline view for each client. We sync contact data and calendar context for prep briefs, but do not replace your CRM. During the preview, you\'ll see how clients can view your shared pipeline without your existing tools being affected. Integration roadmap includes Salesforce and HubSpot sync for coaches who want live data pull.',
  },
  {
    id: 'onboarding',
    category: 'Getting Started',
    question: 'How long does it take to set up for one coach preview?',
    answer: 'About 15 minutes. You schedule a session with our onboarding specialist, we create your coach workspace, invite 2-3 of your client accounts to the preview, and you\'re live. Clients can view your coach profile and shared pipeline immediately. No long setup or training required-the interface is designed for coaches to navigate on their first look.',
  },
  {
    id: 'client-benefits',
    category: 'Client Experience',
    question: 'What are the main benefits for my clients?',
    answer: 'Clients get four immediate benefits: (1) Stop missing signals-overnight detection of executive departures, board changes, funding, and hiring. They act before the market gets noisy. (2) Walk in prepared-gen-down prep briefs in about a minute with win thesis, likely objections, peer-level questions. (3) Nothing goes cold-every company, contact, and conversation tracked between sessions. (4) One decision each morning-a prioritized action list before the market opens, not 30 competing priorities. All this stays private and visible only to their coaches they invite.',
  },
  {
    id: 'sharing',
    category: 'Data Sharing & Collaboration',
    question: 'How does the coach and client sharing work?',
    answer: 'Coach and client see the same pipeline, signals, and prep briefs. This eliminates the translation layer. When you ask "Did you see the signal about the CFO?" the client already knows-because they saw it when it happened. You see their pipeline activity in real time. All data access is logged so you both know exactly what was seen and when. Clients grant you access and can revoke it anytime.',
  },
  {
    id: 'client-control',
    category: 'Privacy & Control',
    question: 'Can my clients control what I see? What if they want to restrict my access?',
    answer: 'Yes, completely. Clients decide which coaches can access their account and what they can view. You get full access during the preview, but in live usage, clients can grant or deny access to specific companies, signals, or briefs. Every coach access action is logged with timestamps-clients can review exactly when you viewed what. Clients can revoke your access instantly from their settings.',
  },
  {
    id: 'security',
    category: 'Data Security & Compliance',
    question: 'How do you protect client data? What is your security posture?',
    answer: 'Data security is foundational. All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We use role-based access control (RBAC) and row-level security (RLS) in Postgres so coaches can only see what clients grant. All access is logged for audit trails. Data is stored in US-based infrastructure. We are working toward SOC 2 Type II certification; current security controls are documented and available to enterprise partners through our diligence request process. Clients own their data-you cannot export without permission. We are designed with GDPR and CCPA principles; our privacy policy details data handling terms.',
  },
  {
    id: 'compliance',
    category: 'Legal & Compliance',
    question: 'Are there any compliance concerns for coaches using this with clients?',
    answer: 'No material compliance issues. We handle data security; you handle coaching ethics. If you work in regulated industries (PE, executive recruiting), our current trust and governance materials are available for review on request. We are not legal or investment advice-you retain full responsibility for your advice and recommendations. Our terms clarify that coaches are independent contractors, not Starting Monday employees, and Starting Monday does not provide coaching or investment guidance.',
  },
  {
    id: 'pricing',
    category: 'Investment & ROI',
    question: 'What does this cost and what is the ROI?',
    answer: 'Coach previews are free for 30 days-no payment, no commitment. After preview, coaches can choose a buyer plan: Starter Coach ($99/mo + $39 per active client seat), Studio Coach ($249/mo for a small active roster), or Team Coach ($599/mo for up to 10 client seats). They can also use a referral lane where clients subscribe directly and the coach earns recurring partner revenue. Coaches in our early pilot reported recovering prep time within 60 days, driven by less context rebuild and more strategy time per session. Detailed economics and ROI examples are on the economics page.',
  },
  {
    id: 'support',
    category: 'Support & Training',
    question: 'What kind of support and training do coaches get?',
    answer: 'You get onboarding support (15-30 minutes), access to our coach resource library (video walkthroughs, templates, guides), and a Slack channel with other coaches using the platform. We run monthly coach mastermind sessions. Support is via email with 24-hour response during business hours. Premium support with dedicated onboarding is available for coach firms handling 5+ client previews.',
  },
  {
    id: 'trial',
    category: 'Getting Started',
    question: 'Is there a trial? Can I get my money back if it does not work?',
    answer: 'Yes, 30-day free preview. No credit card, no commitment. If you decide it does not fit after the preview, you simply decline to roll into live client referrals. If you do roll in and change your mind within 30 days of paying, we offer a full refund. The risk is on us-we want coaches to experience the workflow before deciding.',
  },
  {
    id: 'time-commitment',
    category: 'Getting Started',
    question: 'How much time does this add to my week?',
    answer: 'Minimal. You spend about 5 minutes per client per week reviewing their overnight signals and pipeline activity. If clients are moving, this actually saves time because you spend less session time rebuilding context. Coaches report spending less total time on operational catch-up and more time on coaching work.',
  },
  {
    id: 'pipeline-types',
    category: 'Use Cases',
    question: 'What types of searches work best with Starting Monday?',
    answer: 'Best fit: senior technology transitions (CTO, VP Engineering, CISO), PE-backed post-acquisition integration roles, and long-cycle executive search (3-9 months). Good fit: startup hiring for senior tech roles, board-level positioning, and high-stakes turnarounds. Less ideal: entry-level placements or passive candidate management. During preview, you\'ll see if your typical client pipeline fits the workflow.',
  },
  {
    id: 'manual-work',
    category: 'Operations',
    question: 'Do clients have to manually update their pipeline, or is it automated?',
    answer: 'Clients update their own pipeline-we do not pull from LinkedIn or CRMs automatically (yet). This is intentional: the discipline of tracking is part of the accountability loop. Most clients spend 5 minutes per week updating 3-5 company stages. If they are not tracking their own pipeline, they probably are not serious about the search. The prep brief, signal detection, and interview tracking are fully automated.',
  },
  {
    id: 'switching-coaches',
    category: 'Client Experience',
    question: 'What happens if a client changes coaches or works with multiple coaches?',
    answer: 'Clients can grant access to multiple coaches independently. Each coach sees the same pipeline but has a separate access log. Clients can revoke access from one coach while keeping another active. There is no "switching" process-clients simply control who has access. This is useful for coaches working in pairs or client firms rotating coaches.',
  },
]

const OBJECTIONS = [
  {
    id: 'competitors',
    objection: '"My clients already have LinkedIn Premium and a CRM. Why do they need another tool?"',
    response: "Precisely. This isn't a replacement for LinkedIn or CRM-it's the operating layer beneath them. LinkedIn is passive discovery and profile browsing. This is active, automated signal tracking-when CFOs leave or boards shift, your clients know immediately. A CRM is for contact management. This is for structured pipeline discipline and prep generation. Think of it as: LinkedIn finds leads, this tracks momentum and prepares for conversations.",
  },
  {
    id: 'workload',
    objection: '"I already handle this in my coaching-pipeline review, prep work, accountability. This feels like overhead."',
    response: 'Not necessarily. Most coaches spend 20-30 minutes per session on operational catch-up: "So where did we leave off? What companies have you contacted?" This tool answers those questions before the session starts. You arrive knowing the state of the pipeline, what signals moved, and what prep the client reviewed. Session time stays the same-more of it goes to strategy instead of context rebuilding. Early coaches report spending less total time on operational work.',
  },
  {
    id: 'adoption',
    objection: '"My clients will not adopt another platform. They have decision fatigue."',
    response: 'A fair concern. Preview the workflow with 2-3 real clients-concrete proof in 30 minutes. When it is positioned as "this reduces your work between sessions," adoption is consistently high in our experience. And this is not a standalone product-it is a layer for coaches. Clients access it through your recommendation, not a marketplace.',
  },
  {
    id: 'cost',
    objection: '"I cannot afford another monthly software subscription."',
    response: 'The preview is free. If it does not work, you pay nothing. If it does work, you have two pricing paths: a direct coach plan (Starter Coach at $99 + $39 per active seat, Studio Coach at $249 for a small active roster, or Team Coach at $599 for up to 10 client seats) or a referral path where clients subscribe and you earn recurring partner revenue. The economics page shows breakeven examples tied to recovered prep time and better client readiness.',
  },
  {
    id: 'data-risk',
    objection: '"I am nervous about data security and liability if coach data is breached."',
    response: 'Data security is foundational-AES-256 encryption at rest, TLS 1.2+ in transit, role-based access controls. You, as the coach, are not liable for platform security-that is on Starting Monday. The terms are clear: coaches are independent contractors, not employees, and Starting Monday carries liability for data handling. We are working toward SOC 2 Type II certification; security documentation is available to enterprise partners through our diligence request process. If your firm has specific security requirements, our enterprise team can discuss custom options.',
  },
  {
    id: 'privacy',
    objection: '"My clients are worried about their data being visible to a coach. How do I address that?"',
    response: 'Clients have full control. They decide which coaches can access their data and can revoke access instantly. All access is logged with timestamps-clients see exactly when and what a coach viewed. During preview setup, explain this to clients: "This is your data. I get to see the pipeline, signals, and prep you reviewed-but only what you grant me, and you can turn it off anytime." Early feedback from pilot participants suggests strong comfort when the permission model is clearly explained; we are expanding this validation across the growing user base.',
  },
  {
    id: 'competitive-concern',
    objection: '"What if I use this with a client who later works with another coach? Am I sharing intelligence with a competitor?"',
    response: 'No. Clients control access per coach. If a client switches coaches, the new coach does not automatically see the old coach\'s notes or activity-only the shared pipeline state. Old coach access is revoked unless the client re-grants it. This is by design. Coaches maintain privacy even when clients work with multiple coaches.',
  },
  {
    id: 'integration-roadmap',
    objection: '"If I adopt this now, will the features I need be built before I am ready to scale?"',
    response: 'Ask what specific integration you need during preview. Our roadmap includes Salesforce sync, HubSpot integration, and API access for custom workflows. If a feature matters for your firm, flag it during onboarding-we weight feedback from active coaches. Roadmap is transparent and updated quarterly.',
  },
  {
    id: 'effort',
    objection: '"This requires discipline from clients. My clients already do not track their pipelines consistently."',
    response: 'Fair. This tool works best with clients who are motivated and disciplined. If a client will not track their own pipeline 5 minutes a week, this tool will not make them do it-nothing will. But for your serious clients in active transition, this provides the structure and accountability they need to stay consistent. Use it selectively with clients who are committed to a disciplined search.',
  },
]

export default function CoachFaqPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.18),_transparent_36%),linear-gradient(180deg,_rgba(9,14,26,0.96)_0%,_rgba(10,15,28,0.96)_100%)]" />
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/for-coaches" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Back to coach page
            </Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-white/10 px-4 sm:px-6 pt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-amber-200 mb-3">
            Coach FAQ
          </p>
          <h1 className="text-[34px] sm:text-[46px] font-serif font-semibold text-white leading-[1.1] tracking-tight mb-4">
            Answers, objections addressed, and clear boundaries.
          </h1>
          <p className="text-[15px] text-slate-200 leading-relaxed">
            If you cannot find your question here, email us at {CONTACT_EMAIL}.
            If you want the fastest way to judge fit, request the coach preview first.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-20 bg-slate-950/40">
<div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <CoachValueNudge
              eyebrow="Fastest way to judge fit"
              title="The preview shows whether this saves time and improves prep before you commit."
              body="Use the preview to see the workflow, the trust boundary, and the client value together. If that passes the smell test, the FAQ can answer the deeper questions."
              sourcePage="/for-coaches/faq"
              secondaryHref="/for-coaches/economics"
              secondaryLabel="View pricing and economics"
            />
          </div>

          {/* FAQs grouped by category */}
          {Array.from(new Set(FAQS.map((faq) => faq.category))).map((category) => (
            <section
              key={category}
              id={category.toLowerCase().replace(/ /g, '-')}
              className="mb-12"
            >
              <h2 className="text-[22px] font-serif font-semibold text-white mb-6 sticky top-14 bg-slate-950/95 pt-2 pb-3 border-b border-white/10 backdrop-blur-xl">
                {category}
              </h2>
              <div className="space-y-6">
                {FAQS.filter((faq) => faq.category === category).map((faq) => (
                  <div key={faq.id} id={faq.id} className="border border-white/12 rounded-xl p-5 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.05))] transition-colors">
                    <h3 className="text-[16px] font-semibold text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-[14px] text-slate-200 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="mt-16">
            <CoachValueNudge
              eyebrow="Ready for a live look"
              title="If the FAQ answered your concerns, the next move is to see the preview in action."
              body="That keeps the decision grounded in workflow and value instead of more reading. Coaches usually know quickly once they see the preview with real client context."
              sourcePage="/for-coaches/faq"
              secondaryHref="/for-coaches"
              secondaryLabel="Return to coach preview"
            />
          </section>

          {/* Common objections */}
          <section id="objections" className="mt-16 pt-12 border-t border-white/12">
            <h2 className="text-[24px] font-serif font-semibold text-white mb-6">
              Common Objections & How to Think About Them
            </h2>
            <div className="space-y-6">
              {OBJECTIONS.map((obj) => (
                <div key={obj.id} className="border-l-4 border-amber-300/80 bg-[linear-gradient(145deg,rgba(120,53,15,0.18),rgba(120,53,15,0.05))] rounded-r-lg p-5">
                  <div className="mb-3">
                    <p className="text-[14px] font-semibold text-amber-100 italic mb-2">
                      "{obj.objection}"
                    </p>
                  </div>
                  <div className="bg-white/[0.04] border border-amber-200/20 rounded-lg p-4">
                    <p className="text-[13px] text-slate-200 leading-relaxed">
                      <span className="font-semibold text-amber-200">Our take: </span>
                      {obj.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data security deep dive */}
          <section id="security" className="mt-16 pt-12 border-t border-white/12">
            <h2 className="text-[24px] font-serif font-semibold text-white mb-4 inline-flex items-center gap-2">
              <BrandIcon name="security" className="h-5 w-5 text-orange-600" />
              Data Security &amp; Compliance Deep Dive
            </h2>
            <p className="text-[13px] text-slate-300 mb-6">
              The items below are live in production today. Roadmap items are clearly labeled.
            </p>
            <CapabilityDisclosure
              className="mb-8"
              live={[
                'AES-256 encryption at rest',
                'TLS 1.2+ encryption in transit',
                'Role-based access control (RBAC)',
                'Row-level security (RLS) in Postgres',
                'Per-coach, client-controlled access with instant revoke',
                'Audit logs with timestamps on all coach access',
                'US-based data infrastructure',
                'Vendor SOC 2 (Supabase, Stripe)',
              ]}
              roadmap={[
                { label: 'SOC 2 Type II certification (Starting Monday)', eta: 'In progress' },
                { label: 'Formal GDPR/CCPA compliance documentation', eta: 'Q3 2026' },
                { label: 'Enterprise security review packet', eta: 'Available via diligence request' },
              ]}
            />
            <div className="space-y-5">
              <div className="border border-emerald-200/35 rounded-lg p-5 bg-emerald-200/10">
                <p className="text-[13px] font-semibold text-emerald-100 mb-2">Encryption</p>
                <p className="text-[13px] text-emerald-50/95 leading-relaxed">
                  All data at rest uses AES-256 encryption. All data in transit uses TLS 1.2+. Client data is encrypted in separate database partitions so coaches cannot cross-access data.
                </p>
              </div>
              <div className="border border-emerald-200/35 rounded-lg p-5 bg-emerald-200/10">
                <p className="text-[13px] font-semibold text-emerald-100 mb-2">Access Control</p>
                <p className="text-[13px] text-emerald-50/95 leading-relaxed">
                  Role-based access control (RBAC) and row-level security (RLS) in Postgres. Coaches can only query rows their clients have explicitly granted access to. All access is logged with timestamps and IP addresses.
                </p>
              </div>
              <div className="border border-emerald-200/35 rounded-lg p-5 bg-emerald-200/10">
                <p className="text-[13px] font-semibold text-emerald-100 mb-2">Compliance</p>
                <p className="text-[13px] text-emerald-50/95 leading-relaxed">
                  We are working toward SOC 2 Type II certification. Data is stored in US-based infrastructure.
                  We are designed with GDPR and CCPA principles; data handling terms are in our privacy policy.
                  Vendor integrations (Supabase, Stripe) maintain their own SOC 2 certifications.
                  Detailed security documentation is available to enterprise partners through our diligence request process.
                </p>
              </div>
              <div className="border border-emerald-200/35 rounded-lg p-5 bg-emerald-200/10">
                <p className="text-[13px] font-semibold text-emerald-100 mb-2">Data Ownership</p>
                <p className="text-[13px] text-emerald-50/95 leading-relaxed">
                  Clients own their data. They can export at any time via their settings. They can delete their account and all associated data. We do not sell, trade, or use client data for third-party purposes.
                </p>
              </div>
              <p className="text-[12px] text-slate-300">
                Need a quick shareable trust summary? Use the{' '}
                <Link href="/for-coaches/trust-pack" className="underline underline-offset-2 text-amber-200 hover:text-amber-100 transition-colors">
                  Coach Trust Pack
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Still have questions? */}
          <section className="mt-16 pt-12 border-t border-white/12">
            <div className="bg-[linear-gradient(155deg,rgba(120,53,15,0.22),rgba(120,53,15,0.06))] border border-amber-200/30 rounded-2xl p-8 text-center">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-amber-100 mb-2">Still have questions?</p>
              <h3 className="text-[22px] font-serif font-semibold text-white mb-4">
                Schedule a call or send us a note.
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={FAQ_COMPOSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-5 py-2.5 bg-white/10 border border-amber-200/40 text-amber-100 font-semibold rounded-lg hover:bg-white/15 transition-colors"
                >
                  Email us
                </a>
                <Link
                  href="/for-coaches"
                  className="inline-flex px-5 py-2.5 bg-orange-500 text-slate-950 font-semibold rounded-lg hover:bg-orange-400 transition-colors"
                >
                  Back to overview
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8 mt-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-500">
            Questions?{' '}
            <a href={CONTACT_COMPOSE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors">
              {CONTACT_EMAIL}
            </a>{' '}
            ΓÇó{' '}
            <a href={FEEDBACK_COMPOSE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors">
              Send feedback
            </a>
          </p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

