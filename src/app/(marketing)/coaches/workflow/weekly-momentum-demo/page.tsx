import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Weekly Momentum Demo | Starting Monday',
  description:
    'Example walkthrough for coaches: running weekly momentum discipline with commitment tracking and risk intervention.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/workflow/weekly-momentum-demo',
  },
}

const weeklyBoard = [
  { item: 'Rewrite board-ready opening narrative', owner: 'Client', status: 'Done' },
  { item: 'Pressure-test compensation objection response', owner: 'Coach', status: 'Blocked' },
  { item: 'Send refined thesis to retained-search partner', owner: 'Client', status: 'Due in 2 days' },
]

const intervention = [
  'Flag blocked actions within 48 hours, not at next session.',
  'Convert blocked item into one concrete next action and owner.',
  'Re-check confidence score and message readiness at end of week.',
]

export default function WeeklyMomentumDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Workflow demo 2</p>
        <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-foreground sm:text-[52px]">
          Run weekly momentum discipline.
        </h1>
        <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-foreground sm:text-[19px]">
          This demo shows how coaches keep transition momentum from leaking between sessions.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Weekly commitment board</p>
          <div className="mt-3 grid gap-3">
            {weeklyBoard.map((row) => (
              <article key={row.item} className="rounded-xl border border-border bg-background/55 p-4">
                <p className="text-[14px] font-semibold text-foreground">{row.item}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">Owner: {row.owner}</p>
                <p className="mt-1 text-[12px] text-foreground">Status: {row.status}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Intervention sequence</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {intervention.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/coaches" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Back to coach workflow
          </Link>
          <Link href="/coaches/objections" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
            Review coach objections
          </Link>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
