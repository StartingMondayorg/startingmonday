import type { Metadata } from 'next'
import Link from 'next/link'
import { ProofStoriesModule } from '@/components/channel/ProofStoriesModule'

export const metadata: Metadata = {
  title: 'Starting Monday for C-suite and Technology Associations - Partner Guide',
  description: 'How leadership and technology associations offer Starting Monday as a member benefit during role transitions.',
  alternates: { canonical: 'https://startingmonday.app/for-cio-associations' },
  openGraph: {
    title: 'Starting Monday for C-suite and Technology Associations',
    description: 'Give your members a search advantage in transition - not just access to a directory.',
    url: 'https://startingmonday.app/for-cio-associations',
  },
}

const FEATURES = [
  {
    name: 'Member Benefit Program',
    forAssociation: 'Starting Monday is available as a subsidized or sponsored member benefit. Members activate through a dedicated association referral code and receive discounted access. Usage data is shared on an aggregated basis so you can see member engagement. Your members get the platform for less. You offer a benefit that is concretely useful in transition, not just aspirationally useful in general.',
    outcome: 'Members who transition with Starting Monday stay connected to the association as a source of real support. Retention through transition improves because the association delivered value at the moment that mattered.',
  },
  {
    name: 'Research Partnership',
    forAssociation: 'Starting Monday monitors hundreds of company career pages and tracks organizational signals that precede C-suite technology searches. That data becomes association-branded research: quarterly reports on technology executive hiring trends, sector-by-sector signal analysis, and role demand patterns. Your members receive intelligence they cannot get anywhere else.',
    outcome: 'The association publishes credible, original research based on real market signals. Member value increases. Media coverage and membership inquiries follow.',
  },
  {
    name: 'Content and Education Access',
    forAssociation: 'Starting Monday publishes practical guidance specifically for C-suite technology executives: search strategy, search firm relationships, compensation negotiation, interview preparation. Association members receive access to this content through the platform. Selected pieces can be co-published under your brand.',
    outcome: 'Your education program gains a continuous stream of practitioner-level content without internal production cost.',
  },
  {
    name: 'Transition Support Program',
    forAssociation: 'When a member enters transition, they often disengage from professional associations - the dues feel less justified when they are not being paid by an employer. A Starting Monday partnership gives you something concrete to offer at that exact moment: a search platform built for executives at their level, available at member rates or through a sponsorship. The moment of transition is when association support matters most.',
    outcome: 'Members in transition stay engaged. They renew because the association delivered value when it mattered. That is the retention metric that compounds.',
  },
]

const ASSOCIATION_PROOF_STORIES = [
  {
    title: 'Member transition support',
    role: 'Association program owner',
    outcome: 'Members in transition stayed engaged longer when given an operating tool, not just directory access.',
  },
  {
    title: 'Benefit activation pilot',
    role: 'Chapter operations lead',
    outcome: 'Discounted benefit activation produced clearer program value than generic career content offers.',
  },
  {
    title: 'Research co-brand launch',
    role: 'Association content team',
    outcome: 'Original signal-based reports increased member interest in transition-focused programming.',
  },
]

export default function ForCioAssociationsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              See a demo
            </Link>
            <Link
              href="/partners"
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </nav>

      <main>
{/* Header */}
        <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              Partner Guide
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              Starting Monday for <span className="whitespace-nowrap">C-suite and Technology Associations</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Give your members a search advantage in transition - not just access to a directory.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Why now</p>
              <p className="text-[13px] leading-relaxed text-slate-200">Members evaluate value most intensely during transition windows. Practical operating support outperforms static member benefits in that moment.</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">This week</p>
              <ol className="space-y-1 text-[13px] leading-relaxed text-slate-200">
                <li>1. Select one member segment in active transition.</li>
                <li>2. Launch a 30-day benefit pilot with activation baseline.</li>
                <li>3. Review member engagement and retention signals at day 30.</li>
              </ol>
            </div>
          </div>
        </header>

        <ProofStoriesModule
          title="Role-specific outcomes for association programs"
          stories={ASSOCIATION_PROOF_STORIES}
          sourceNote="Directional partner outcomes used for pilot decisions; validate against your own member baseline."
        />

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            {/* What it is */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered search platform built for leadership-transition technology
                executives. It gives them the intelligence infrastructure that senior searches require:
                monitoring of target companies for pre-search signals, AI-generated prep briefs for
                every interview, structured pipeline tracking, and a daily briefing that keeps the
                search moving.
              </p>
              <p>
                For C-suite and technology associations, the platform is a member benefit that
                delivers concrete value at the moment members need it most - when they are in
                transition. Most professional associations offer their members the same set of
                benefits: a directory, a network, events, and a job board. At the VP and C-suite
                level, those are necessary but not sufficient.
              </p>
              <p>
                Technology executives entering transition need more than introductions. They need an
                intelligence infrastructure that tells them which companies to watch, what signals
                precede a search, and how to show up to an interview having done the research that a
                peer would do. The executives in your membership are exactly the people Starting
                Monday was built for. When you make Starting Monday available as a member benefit,
                you give your members a tool that works - not a workshop they attend once and a job
                board they check twice.
              </p>
            </section>

            {/* How associations use it */}
            <section className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">How associations use it</h2>
              <div className="space-y-8">
                {FEATURES.map(f => (
                  <div key={f.name} className="border-l-2 border-orange-500 pl-5">
                    <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600 mb-2">{f.name}</p>
                    <p className="text-[15px] text-slate-700 leading-relaxed mb-2">{f.forAssociation}</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      <span className="font-semibold text-slate-700">Outcome: </span>{f.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* What it does not do */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What it does not do</h2>
              <p>
                Starting Monday does not replace the peer relationships, the chapter events, or
                the credentialing programs that make a technology association worth joining. It
                does not provide the introduction from a board member that opens a specific door,
                or the knowledge that comes from being in the room with peers.
              </p>
              <p>
                It handles the research, the tracking, and the daily search discipline. Your
                association handles the relationships.
              </p>
            </section>

            {/* For your association */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">For your association</h2>
              <p>
                The simplest way to start: make Starting Monday available as a member benefit with
                a discounted access code for your membership. Members self-activate. You track
                adoption. We share anonymized usage data.
              </p>
              <ul className="space-y-2 pl-4">
                {[
                  'Member benefit programs with dedicated referral codes and discounted access',
                  'Active plan ($199/month) includes all AI features: prep briefs, strategy brief, company intelligence',
                  'Monitor plan ($49/month) for members building a target list or monitoring the market passively',
                  'Aggregated usage reporting for your association - see which benefit programs are driving activation',
                  'Research partnership available - contact us to discuss co-branded market intelligence reports',
                  'Apply to the partner program at startingmonday.app/partners to receive your referral code and partnership terms',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-orange-500 font-bold shrink-0 mt-0.5">+</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Trust and confidentiality: member activity data is shared only in aggregate reporting, never as private personal search detail.
              </p>
            </section>

            {/* Apply CTA */}
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-7">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
                Ready to partner?
              </p>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3 leading-snug">
                Apply to the partner program
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                Fill out the application and we will follow up within 2 business days to discuss member benefit terms, referral codes, and partnership structure.
              </p>
              <p className="text-[12px] text-slate-500 mb-4">CTA: get started now by applying to the partner program.</p>
              <Link
                href="/partners#apply"
                className="inline-block bg-orange-500 text-slate-900 text-[14px] font-bold px-7 py-3 rounded hover:bg-orange-600 transition-colors"
              >
                Get started now &rarr;
              </Link>
              <p className="text-[13px] text-slate-200 mt-4">
                Want to see the platform first?{' '}
                <Link href="/demo" className="text-slate-600 underline hover:text-slate-900 transition-colors">
                  Walk through a live demo
                </Link>
                .
              </p>
            </section>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-500">
            Questions? contact@startingmonday.app
          </p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>

    </div>
  )
}

