import type { Metadata } from 'next'
import Link from 'next/link'
import { CoachValueNudge } from '@/app/components/CoachValueNudge'

export const metadata: Metadata = {
  title: 'Executive Coaching Session Operating Worksheet | Starting Monday',
  description:
    'Executive-grade coaching worksheet for high-stakes transition sessions. Align mandate, evidence, objections, and next actions in one operating format.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches/coach-prep-worksheet' },
  openGraph: {
    title: 'Executive Coaching Session Operating Worksheet | Starting Monday',
    description:
      'A practical operating worksheet for coaches preparing executive clients for recruiter, board, and leadership conversations.',
    url: 'https://startingmonday.app/for-coaches/coach-prep-worksheet',
  },
}

type WorksheetSection = {
  title: string
  purpose: string
  prompts: string[]
}

const WORKSHEET_SECTIONS: WorksheetSection[] = [
  {
    title: '1) Mandate Context and Session Target',
    purpose: 'Define the exact decision quality objective for this session.',
    prompts: [
      'Target role or mandate this prep supports:',
      'Conversation type (search firm, board, CEO, peer, HR):',
      'Single outcome that must be true by session end:',
      'What changed since the previous session that matters now:',
    ],
  },
  {
    title: '2) Signal Interpretation (Not Signal Flood)',
    purpose: 'Separate useful signal from distracting noise and set timing implications.',
    prompts: [
      'Top 3 market or company signals this week:',
      'What each signal changes in positioning or outreach timing:',
      'What to ignore this week and why:',
      'Risk if client overreacts to current noise:',
    ],
  },
  {
    title: '3) Narrative Precision by Audience',
    purpose: 'Strengthen message quality for the specific audience in scope.',
    prompts: [
      'One-sentence executive positioning statement:',
      'Two proof points with measurable business outcomes:',
      'Most likely pushback and concise non-defensive response:',
      'What language to remove because it weakens authority:',
    ],
  },
  {
    title: '4) Conversation Rehearsal Plan',
    purpose: 'Rehearse one critical exchange to improve live performance quality.',
    prompts: [
      'High-stakes moment to rehearse:',
      'Opening frame for the conversation:',
      'Anchor evidence line and supporting detail:',
      'Recovery line if conversation pressure increases:',
    ],
  },
  {
    title: '5) Seven-Day Operating Commitments',
    purpose: 'Convert insight into observable execution before next session.',
    prompts: [
      'Three actions (verb + owner + date):',
      'One metric proving momentum this week:',
      'Early warning trigger requiring interim check-in:',
      'Day/time for between-session accountability touchpoint:',
    ],
  },
]

const SCORE_DIMENSIONS = [
  'Positioning clarity',
  'Evidence quality',
  'Pushback readiness',
  'Decision ownership',
  'Execution reliability',
]

export default function CoachPrepWorksheetPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="dark bg-background sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span>
            <span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/for-coaches" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Back to for-coaches
            </Link>
            <Link href="/" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Back home
            </Link>
          </div>
        </div>
      </nav>

      <header className="bg-primary px-4 sm:px-6 pt-10 pb-12 print:bg-card print:pt-0 print:pb-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3 print:text-primary-foreground">
            Executive Coaching Operating Worksheet
          </p>
          <h1 className="mb-4 font-bold tracking-tight leading-[1.02] text-primary-foreground print:text-primary-foreground">
            <span className="block text-[26px] sm:text-[32px]">
              Coach in strategy mode.
            </span>
            <span className="block text-[30px] sm:text-[38px]">
              Execute with measurable follow-through.
            </span>
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-primary-foreground print:text-primary-foreground">
            Built for executive-transition coaching, where clear mandate, sharper narrative, and seven-day follow-through matter most.
          </p>
          <div className="mt-5 rounded-lg border border-border bg-primary/10 p-4 print:border-border print:bg-card">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary print:text-muted-foreground">BLUF</p>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed print:text-muted-foreground">
              Use one worksheet per session. Define one strategic outcome, rehearse one high-stakes exchange, and leave
              with actions that have owners and dates.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <section className="mb-8 print:hidden">
          <CoachValueNudge
            eyebrow="Use this with the preview"
            title="The worksheet makes more sense when the coach preview is already visible."
            body="Use the preview to see the workflow, then use this worksheet to run one focused session with clearer mandate, better evidence, and a cleaner next step."
            sourcePage="/for-coaches/coach-prep-worksheet"
            secondaryHref="/for-coaches"
            secondaryLabel="Open the coach preview"
          />
        </section>

        <section className="border border-border rounded-2xl p-5 sm:p-6 bg-muted mb-8">
          <h2 className="text-[15px] font-semibold text-foreground mb-3">Session Header</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-muted-foreground">
            <p>Coach: ________________________________</p>
            <p>Client: ________________________________</p>
            <p>Date: _________________________________</p>
            <p>Session number: ________________________</p>
            <p className="sm:col-span-2">Mandate in scope this week: ______________________________________________</p>
          </div>
        </section>

        <div className="space-y-7">
          {WORKSHEET_SECTIONS.map((section) => (
            <section key={section.title} className="border border-border rounded-2xl p-5 sm:p-6 bg-card">
              <h2 className="text-[17px] font-semibold text-foreground mb-1">{section.title}</h2>
              <p className="text-[13px] text-muted-foreground mb-4">{section.purpose}</p>
              <ul className="space-y-3 text-[13px] text-muted-foreground">
                {section.prompts.map((prompt) => (
                  <li key={prompt}>
                    <p className="font-medium text-foreground">{prompt}</p>
                    <p className="mt-1 text-muted-foreground">______________________________________________________________________________</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="border border-primary/30 rounded-2xl p-5 sm:p-6 bg-primary/10 mt-8">
          <h2 className="text-[17px] font-semibold text-foreground mb-3">Session Quality Scorecard (1-5)</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            Score quickly at close. Any dimension below 3 becomes a required focus area in the next prep cycle.
          </p>
          <div className="space-y-2 text-[13px] text-muted-foreground">
            {SCORE_DIMENSIONS.map((item) => (
              <div key={item} className="flex items-center justify-between border border-primary/30 bg-card rounded-lg px-3 py-2">
                <span>{item}</span>
                <span>1 2 3 4 5</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">Overall session quality score: ______ / 25</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Most important improvement before next session: _________________________________</p>
        </section>

        <section className="mt-8 print:hidden">
          <CoachValueNudge
            eyebrow="Ready to move from worksheet to workflow"
            title="If the worksheet feels useful, the next step is to see the live coach setup."
            body="That keeps the value concrete: a cleaner session, clearer follow-through, and a low-risk preview before any broader rollout decision."
            sourcePage="/for-coaches/coach-prep-worksheet"
            secondaryHref="/for-coaches/trust-pack"
            secondaryLabel="Read the trust pack"
          />
        </section>
      </main>

      <footer className="dark bg-background border-t border-border px-4 sm:px-6 py-8 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4 text-[12px] text-foreground">
            <Link href="/for-coaches" className="hover:text-foreground transition-colors">for-coaches</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Back home</Link>
          </div>
        </div>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

