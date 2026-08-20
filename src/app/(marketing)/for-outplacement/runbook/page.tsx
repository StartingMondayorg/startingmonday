import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Pilot Runbook | Starting Monday',
  description: 'Week-by-week pilot runbook, intervention playbook, counselor scripts, and downloadable templates for outplacement partners.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/runbook' },
}

const WEEKLY_CHECKLIST = [
  {
    week: 'Week 0',
    tasks: [
      'Confirm cohort list and owner responsibilities',
      'Approve scorecard baseline and intervention thresholds',
      'Run counselor briefing using first-session script pack',
    ],
  },
  {
    week: 'Week 1',
    tasks: [
      'Launch participant kickoff communications',
      'Complete setup and target-list baseline for each participant',
      'Run first operating review and assign any adoption interventions',
    ],
  },
  {
    week: 'Week 2',
    tasks: [
      'Enforce one signal-driven action per active participant',
      'Review stalled participant queue against trigger thresholds',
      'Coach counselor teams on prep-brief integration before meetings',
    ],
  },
  {
    week: 'Week 3',
    tasks: [
      'Validate prep quality on high-stakes conversations',
      'Measure session-yield ratio and context rebuild reduction',
      'Prepare day-30 decision packet with evidence and recommendations',
    ],
  },
]

const RED_FLAGS = [
  'No meaningful participant action for 7 days',
  'Two or more overdue follow-ups without counselor intervention',
  'Prep-brief adoption below 60% for interview-active participants',
  'Session-yield ratio below target for two consecutive weeks',
]

const INTERVENTION_ACTIONS = [
  'Trigger 1: counselor 1:1 reset within 48 hours',
  'Trigger 2: program-lead escalation and revised action plan',
  'Trigger 3: sponsor visibility if no movement after one intervention cycle',
]

const DOWNLOADS = [
  {
    label: 'Download pilot operator pack (markdown)',
    href: '/downloads/outplacement-pilot-operator-pack.md',
  },
  {
    label: 'Download pilot runbook (markdown)',
    href: '/downloads/outplacement-pilot-runbook.md',
  },
  {
    label: 'Download counselor enablement kit (markdown)',
    href: '/downloads/outplacement-counselor-enablement-kit.md',
  },
  {
    label: 'Download Friday MBR-lite packet template',
    href: '/downloads/outplacement-friday-mbr-template.md',
  },
  {
    label: 'Download participant kickoff template',
    href: '/downloads/outplacement-participant-kickoff-template.md',
  },
]

export default function OutplacementRunbookPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to outplacement page
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
<header className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">Pilot runbook</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Operator-ready checklists, scripts, and intervention playbooks.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            This is the concrete implementation layer for partner teams: week-by-week tasks, red-flag logic, and downloadable artifacts.
          </p>
        </header>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Week-by-week launch checklist</p>
          <div className="space-y-4">
            {WEEKLY_CHECKLIST.map((row) => (
              <div key={row.week} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-2">{row.week}</p>
                {row.tasks.map((task) => (
                  <p key={task} className="text-[13px] text-slate-700 leading-relaxed">+ {task}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Red flags and intervention triggers</p>
          {RED_FLAGS.map((item) => (
            <p key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</p>
          ))}
          <p className="text-[12px] font-semibold text-slate-900 mt-4 mb-2">Intervention sequence:</p>
          {INTERVENTION_ACTIONS.map((item) => (
            <p key={item} className="text-[14px] text-slate-700 leading-relaxed">+ {item}</p>
          ))}
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Before/after session prep walkthrough</p>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-2">Before: counselor spends 20-30 minutes reconstructing what happened since last call.</p>
          <p className="text-[14px] text-slate-700 leading-relaxed mb-2">After: counselor checks what-changed summary, trigger flags, and next high-stakes conversation prep in under 10 minutes.</p>
          <p className="text-[14px] text-slate-700 leading-relaxed">Target result: more session time on strategic decisions, less on status reconstruction.</p>
        </section>

        <section className="mb-8 border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Downloadable artifacts</p>
          <div className="space-y-2 text-[14px]">
            {DOWNLOADS.map((item) => (
              <a key={item.href} href={item.href} className="block text-slate-700 underline underline-offset-2 hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Next step</p>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Use the runbook as your operating source of truth for one cohort pilot. Carry the outputs into the day-30 decision review.
          </p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/for-outplacement/economics" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Back to economics
            </Link>
            <Link href="/for-outplacement/trust-pack" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Back to trust pack
            </Link>
            <Link href="/partners#apply" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Apply to partner program
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

