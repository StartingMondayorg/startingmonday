import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday | Demo Sandbox - Healthcare Executive Search Proof',
  description:
    'Private healthcare sandbox for coach-led executive search workflows, including signal-to-outreach mapping.',
  robots: { index: false, follow: false },
}

const COHORT_PROFILE = {
  targetRoles: [
    'Chief Operating Officer (Hospital System)',
    'Chief Financial Officer (Health System)',
    'Chief Strategy Officer (Provider Network)',
    'Division President, Acute Care',
  ],
  differentiators: [
    'Executive transition candidates with provider-side operational context',
    'Coach-mediated outreach strategy to bypass late-stage applicant funnels',
    'Signal-backed shortlists tied to leadership timing windows',
    'Board-ready narrative framing for outcomes, scale, and risk control',
  ],
  constraints: [
    'US market focus with healthcare-system relevance',
    'Role quality over volume; precision outreach over spray-and-pray',
    'Evidence-backed recommendation flow that can stand up to recruiter scrutiny',
  ],
}

type SignalRow = {
  signal: string
  whyItMatters: string
  coachAngle: string
  nextAction: string
}

const HEALTHCARE_SIGNALS: SignalRow[] = [
  {
    signal: 'Leadership transition markers in provider systems and regional networks',
    whyItMatters:
      'Transition windows often open before formal role publication, creating an early relationship advantage.',
    coachAngle:
      'Coaches can move clients from reactive applications to proactive executive positioning conversations.',
    nextAction:
      'Prioritize outreach to CHRO and division leadership within 72 hours of confirmed signal clusters.',
  },
  {
    signal: 'Operating pressure patterns around margin, throughput, and service-line expansion',
    whyItMatters:
      'These pressures frequently precede executive restructuring or role-scope upgrades.',
    coachAngle:
      'Translate client experience into measurable outcomes linked to current system pressure points.',
    nextAction:
      'Use a one-page value brief framing labor efficiency, quality, and growth readiness by service line.',
  },
  {
    signal: 'Executive appointment cadence among peer systems in the same region',
    whyItMatters:
      'Peer hiring momentum can indicate competitive response and upcoming parallel searches.',
    coachAngle:
      'Coach clients on timing narratives that position them as immediate de-risk operators.',
    nextAction:
      'Launch a peer-cluster outreach sprint with tailored messages for each target system archetype.',
  },
]

const ROLE_FIT = [
  {
    role: 'Hospital COO Search',
    score: 'High fit',
    rationale: 'Strong match for candidates with operator credibility and turnaround messaging strength.',
  },
  {
    role: 'Health System CFO Search',
    score: 'Medium-high fit',
    rationale: 'Effective where finance narrative can be tied to strategic service-line or margin execution.',
  },
  {
    role: 'Division President Search',
    score: 'High fit',
    rationale: 'Best fit when boards need a near-term growth and stabilization operator narrative.',
  },
]

export default function HealthcareSandboxPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <header className="mb-10">
          <p className="text-[11px] tracking-[0.08em] text-emerald-300">Private demo sandbox</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Healthcare Executive Search Proof Sandbox
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            This sandbox is designed for coach-led healthcare executive transitions. It shows how Starting Monday
            turns early signal detection into concrete outreach strategy before roles are posted publicly.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Built for private pilot discussions and evidence walkthroughs with executive coaches and recruiting partners.
          </p>
          <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
        </header>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-emerald-300">Cohort profile</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Target roles</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {COHORT_PROFILE.targetRoles.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Differentiators</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {COHORT_PROFILE.differentiators.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Search constraints</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {COHORT_PROFILE.constraints.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-emerald-300">Role-fit scoreboard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Fit</th>
                  <th className="px-3 py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_FIT.map((row) => (
                  <tr key={row.role} className="border-b border-white/5 align-top text-slate-200">
                    <td className="px-3 py-2">{row.role}</td>
                    <td className="px-3 py-2">{row.score}</td>
                    <td className="px-3 py-2 text-slate-300">{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-emerald-300">
            Healthcare signal board
          </h2>
          <div className="mt-4 space-y-4">
            {HEALTHCARE_SIGNALS.map((row) => (
              <article key={row.signal} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                <h3 className="text-sm font-semibold text-white">{row.signal}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Why it matters: </span>
                  {row.whyItMatters}
                </p>
                <p className="mt-1.5 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Coach angle: </span>
                  {row.coachAngle}
                </p>
                <p className="mt-1.5 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Next action: </span>
                  {row.nextAction}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-emerald-300">Pilot script cue card</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. Lead with one role-fit claim and one signal-backed timing claim.</li>
            <li>2. Show one healthcare case from the 20-case draw with source transparency.</li>
            <li>3. End with a 30-45 day pilot scorecard definition before any expansion ask.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-slate-950 hover:bg-emerald-300"
            >
              Return to main demo
            </Link>
            <Link
              href="/signup?from=demo"
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-white hover:border-white/40"
            >
              Start trial
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
