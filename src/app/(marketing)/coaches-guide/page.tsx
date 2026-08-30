import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for Executive Coaches - Partner Guide',
  description: 'How executive coaches use Starting Monday to give clients an intelligence advantage in their search. Features, outcomes, and how to get clients started.',
  robots: { index: true },
}

const FEATURES = [
  {
    name: 'Intelligence Scanner',
    forCoach: 'Your client is watching 30 companies. You cannot track 30 companies between sessions. The scanner does it for you. It surfaces executive departures, board changes, funding announcements, and career page postings for every company your client is tracking. When a pattern clusters into a pre-search signal, the platform names it and flags it.',
    outcome: 'Clients reach out before the search is posted. That window is the whole game at the senior level.',
  },
  {
    name: 'AI Prep Brief',
    forCoach: 'Before every coaching session where your client has an interview coming up, read their prep brief. It usually takes about a minute to generate. It covers the company situation, the likely objections, the questions only a peer would think to ask, and the narrative your client should lead with. You arrive at the session as a peer, not as someone who needs to be briefed by your client.',
    outcome: 'Clients walk into interviews prepared at a depth that is hard to achieve manually. Coaches spend session time on strategy, not research.',
  },
  {
    name: 'Pipeline Command Center',
    forCoach: 'The pipeline shows every company your client is tracking, the stage of each relationship, pending follow-ups, and conversation notes. If your client grants you view access, you see the search exactly as it is between sessions, not as your client remembers it.',
    outcome: 'Conversations about what to prioritize are grounded in data. You stop hearing "I think I have a few companies in process."',
  },
  {
    name: 'Search Strategy Brief',
    forCoach: 'The strategy brief is a full AI synthesis of your client\'s background, target roles, sector fit, positioning gaps, and recommended outreach sequence. It is generated from their resume and target list. Read it before your first session.',
    outcome: 'You walk into session one with a clear view of where your client is competitive, where they are not, and what the narrative needs to accomplish.',
  },
  {
    name: 'Daily Morning Briefing',
    forCoach: 'The platform sends your client a morning digest of new signals, pending follow-ups, and pipeline actions. It creates the discipline and rhythm you have been trying to install in your client manually.',
    outcome: 'Clients stay engaged between sessions. The accountability layer moves from you to the platform.',
  },
]

export default function CoachesGuidePage() {
  return (
    <div className="min-h-screen bg-background font-sans">

      {/* Nav */}
      <nav className="dark text-foreground bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              See a demo
            </Link>
            <Link
              href="/partners"
              className="text-[13px] font-semibold text-primary-foreground bg-primary px-4 py-1.5 rounded hover:bg-primary/90 transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </nav>

      <main>

      {/* Header */}
      <header className="dark text-foreground bg-background px-4 sm:px-6 pt-14 pb-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-4">
            Partner Guide
          </p>
          <h1 className="text-[30px] sm:text-[38px] font-bold text-foreground leading-[1.15] tracking-tight mb-4">
            Starting Monday for <span className="whitespace-nowrap">Executive Coaches</span>
          </h1>
          <p className="text-[16px] text-foreground leading-relaxed">
            The infrastructure that handles research and accountability so you can focus on the work only you can do.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto space-y-14">

          {/* What it is */}
          <section id="coach-fit" className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
            <h2 className="text-[22px] font-bold text-foreground">What Starting Monday is</h2>
            <p>
              Starting Monday is an AI-powered job search platform built for VP and C-suite executives.
              It gives them the intelligence infrastructure that senior searches require: monitoring of
              target companies for pre-search signals, AI-generated prep briefs for every interview,
              a structured pipeline for tracking relationships and conversations, and a daily briefing
              that keeps the search moving between sessions.
            </p>
            <p>
              It is not a job board. It is not a coaching tool. It is the research and infrastructure
              layer that sits underneath the strategic work you do.
            </p>
          </section>

          {/* The gap */}
          <section className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
            <h2 className="text-[22px] font-bold text-foreground">The gap it fills</h2>
            <p>
              Your clients in transition are spending the majority of their time on tasks that have
              nothing to do with the quality of their relationships or the strength of their candidacy.
              Researching companies before interviews. Manually tracking where each conversation stands.
              Preparing the night before because there was no structured prep process. Waiting for roles
              to appear on job boards that were filled through informal networks three weeks earlier.
            </p>
            <p>
              The result: they arrive at your sessions with uneven preparation and you spend session
              time reconstructing context instead of doing strategy work.
            </p>
            <p>
              Starting Monday handles the infrastructure. You handle the human work.
            </p>
          </section>

          {/* How coaches use it */}
          <section id="coach-playbook" className="space-y-6">
            <h2 className="text-[22px] font-bold text-foreground">How coaches use it</h2>
            <div className="space-y-8">
              {FEATURES.map(f => (
                <details key={f.name} className="border-l-2 border-primary/30 pl-5 group" open>
                  <summary className="list-none cursor-pointer flex items-center justify-between">
                    <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-primary">{f.name}</p>
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">v</span>
                  </summary>
                  <div className="mt-2">
                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-2">{f.forCoach}</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-muted-foreground">Outcome: </span>{f.outcome}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section id="execution-rhythm" className="space-y-6">
            <h2 className="text-[22px] font-bold text-foreground">Execution rhythm your clients follow</h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Keep the cadence language consistent in every client kickoff: Monday morning review, every morning action, and prep brief before each interview.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="border-t-2 border-primary/30 pt-4">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">Monday morning</p>
                <p className="text-[13px] font-semibold text-foreground mb-1.5">Review your pipeline</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Update stages, remove stale paths, and select this week&rsquo;s outreach priorities.</p>
              </div>
              <div className="border-t-2 border-border pt-4">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">Every morning</p>
                <p className="text-[13px] font-semibold text-foreground mb-1.5">Act on overnight signals</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Make one decision first: who to contact now based on fresh signal clusters.</p>
              </div>
              <div className="border-t-2 border-border pt-4">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">Before each interview</p>
                <p className="text-[13px] font-semibold text-foreground mb-1.5">Run the prep brief</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Usually one minute to get win thesis, likely objections, and peer-level questions.</p>
              </div>
            </div>
          </section>

          {/* What it does not do */}
          <section className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
            <h2 className="text-[22px] font-bold text-foreground">What it does not do</h2>
            <p>
              Starting Monday does not provide the strategic judgment, the relationship capital, or the
              human calibration that executive coaching provides. It does not know when your client
              is self-sabotaging in interviews. It does not know that they are underselling a specific
              achievement. It does not have the relationship with the search firm partner that you may
              have spent years building.
            </p>
            <p>
              It handles the research, the tracking, and the rhythm. You handle everything else.
            </p>
          </section>

          {/* For your practice */}
          <section id="coach-practice" className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
            <h2 className="text-[22px] font-bold text-foreground">For your practice</h2>
            <p>
              The simplest way to start: recommend Starting Monday to your next client entering
              transition and ask them to share view access to their pipeline with you. Within one
              week you will have a clear picture of their search activity that would have taken three
              sessions to reconstruct verbally.
            </p>
            <ul className="space-y-2 pl-4">
              {[
                'Your clients get a 30-day free trial, no credit card required',
                'Active plan ($199/month) includes all AI features - prep briefs, strategy brief, advisor chat, resume tailoring',
                'Monitor plan ($49/month) for clients who primarily need signal monitoring and pipeline tracking',
                'View access for coaches: your client controls who sees their pipeline',
                'Partner program: apply at startingmonday.app/partners to receive your referral link, commission tracking, and partner resource kit',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary font-bold shrink-0 mt-0.5">+</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Confidentiality standard: client data is private by default and coaching visibility is controlled by the client.
              </p>
          </section>

          {/* Apply CTA */}
          <section className="bg-muted border border-border rounded-lg p-7">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3">
              Ready to partner?
            </p>
            <h2 className="text-[20px] font-bold text-foreground mb-3 leading-snug">
              Apply to the partner program
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
              Fill out the application and we will follow up within 2 business days with your referral link, commission tracking, and partner resource kit.
            </p>
            <Link
              href="/partners#apply"
              className="inline-block bg-primary text-primary-foreground text-[14px] font-bold px-7 py-3 rounded hover:bg-primary/90 transition-colors"
            >
              Get started now &rarr;
            </Link>
            <p className="text-[13px] text-muted-foreground mt-4">
              Want to see the platform first?{' '}
              <Link href="/demo" className="text-muted-foreground underline hover:text-foreground transition-colors">
                Walk through a live demo
              </Link>
              .
            </p>
          </section>

        </div>
      </div>

      </main>

      {/* Footer */}
      <footer className="dark text-foreground bg-background border-t border-border px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <p className="text-[11px] text-muted-foreground">
            Questions? contact@startingmonday.app
          </p>
        </div>
      </footer>

    </div>
  )
}

