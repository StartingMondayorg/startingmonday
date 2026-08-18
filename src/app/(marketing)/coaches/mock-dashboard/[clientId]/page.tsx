import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findMockClient, MOCK_CLIENTS } from '../mock-data'
import { getClientStatusTone, getCommitmentStatusTone, getMomentumTone, getOverdueTone } from '../status-theme'
import { DASHBOARD_THEME } from '../theme-tokens'

type ClientPageProps = {
  params: Promise<{ clientId: string }>
}

export async function generateStaticParams() {
  return MOCK_CLIENTS.map((client) => ({ clientId: client.id }))
}

export async function generateMetadata({ params }: ClientPageProps): Promise<Metadata> {
  const { clientId } = await params
  const client = findMockClient(clientId)
  if (!client) {
    return {
      title: 'Client Dashboard | Starting Monday',
    }
  }

  return {
    title: `${client.name} | Mock Coach Client Dashboard`,
    description: `Coach view for ${client.name}: momentum, risks, commitments, and session plan in one page.`,
    alternates: {
      canonical: `https://startingmonday.app/coaches/mock-dashboard/${client.id}`,
    },
  }
}

export default async function MockCoachClientDashboardPage({ params }: ClientPageProps) {
  const { clientId } = await params
  const client = findMockClient(clientId)

  if (!client) {
    notFound()
  }

  const statusTone = getClientStatusTone(client.status)
  const priorityByStatus: Record<typeof client.status, { now: string; thisWeek: string; watch: string }> = {
    'High risk': {
      now: 'Reset commitment cadence in the first 15 minutes of session.',
      thisWeek: 'Recover overdue outreach and lock one non-negotiable execution rhythm.',
      watch: 'Sponsor confidence drift and momentum volatility.',
    },
    'Needs intervention': {
      now: 'Cut scope and sequence only the next high-value actions.',
      thisWeek: 'Close overdue commitments and re-stabilize prep quality.',
      watch: 'Execution confidence and signal response latency.',
    },
    Stable: {
      now: 'Protect consistency and sharpen decision quality.',
      thisWeek: 'Increase specificity in narrative and stakeholder touchpoints.',
      watch: 'Early signs of drift in follow-through quality.',
    },
  }
  const priority = priorityByStatus[client.status]

  return (
    <div className={`min-h-screen ${DASHBOARD_THEME.appBg} ${DASHBOARD_THEME.inkStrong}`}>
      <nav className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/coaches/mock-dashboard" className="text-[13px] text-slate-300 transition-colors hover:text-white">
            Back to portfolio dashboard
          </Link>
        </div>
      </nav>

      <header className={`border-b px-4 py-8 sm:px-6 sm:py-10 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-orange-600">Client dashboard (coach view)</p>
            <h1 className={`mt-2 font-serif text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[40px] ${DASHBOARD_THEME.inkStrong}`}>{client.name} · {client.roleTrack}</h1>
            <p className={`mt-3 max-w-4xl text-[15px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>{client.coachNarrative}</p>
            <div className="mt-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.09em] ${statusTone.badge}`}>
                {client.status}
              </span>
            </div>
          </div>

          <aside className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paperSoft}`}>
          <h2 className={`text-[11px] font-semibold tracking-[0.12em] ${DASHBOARD_THEME.metalStrong}`}>Coach Action Priority</h2>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.1em] text-rose-700">Now</p>
                <p className={`text-[13px] leading-[1.5] ${DASHBOARD_THEME.ink}`}>{priority.now}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.1em] text-amber-700">This week</p>
                <p className={`text-[13px] leading-[1.5] ${DASHBOARD_THEME.ink}`}>{priority.thisWeek}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.1em] text-emerald-700">Watch</p>
                <p className={`text-[13px] leading-[1.5] ${DASHBOARD_THEME.ink}`}>{priority.watch}</p>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <article className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] lg:col-span-1 ${statusTone.surface}`}>
            <p className={`text-[11px] font-semibold tracking-[0.09em] ${DASHBOARD_THEME.metalStrong}`}>Status</p>
            <p className={`mt-2 text-[14px] font-semibold ${statusTone.text}`}>{client.status}</p>
          </article>
          <article className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] lg:col-span-1 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
            <p className={`text-[11px] font-semibold tracking-[0.09em] ${DASHBOARD_THEME.metalStrong}`}>Momentum</p>
            <p className={`mt-2 text-[28px] font-bold leading-none ${getMomentumTone(client.momentum)}`}>{client.momentum}</p>
          </article>
          <article className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] lg:col-span-1 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
            <p className={`text-[11px] font-semibold tracking-[0.09em] ${DASHBOARD_THEME.metalStrong}`}>Overdue actions</p>
            <p className={`mt-2 text-[28px] font-bold leading-none ${getOverdueTone(client.overdueActions)}`}>{client.overdueActions}</p>
          </article>
          <article className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] lg:col-span-1 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
            <p className={`text-[11px] font-semibold tracking-[0.09em] ${DASHBOARD_THEME.metalStrong}`}>Last session</p>
            <p className={`mt-2 text-[14px] font-semibold ${DASHBOARD_THEME.inkStrong}`}>{client.lastSessionDate}</p>
          </article>
          <article className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] lg:col-span-1 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
            <p className={`text-[11px] font-semibold tracking-[0.09em] ${DASHBOARD_THEME.metalStrong}`}>Next session</p>
            <p className={`mt-2 text-[14px] font-semibold ${DASHBOARD_THEME.inkStrong}`}>{client.nextSessionDate}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${DASHBOARD_THEME.paper} ${statusTone.border}`}>
            <p className={`mb-3 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>Next-session objective</p>
            <p className={`text-[14px] leading-[1.65] ${DASHBOARD_THEME.ink}`}>{client.nextSessionObjective}</p>

            <p className={`mb-3 mt-6 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>Risk signals</p>
            <ul className={`space-y-2 text-[14px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>
              {client.riskSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${statusTone.accent}`}>•</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>

            <p className={`mb-3 mt-6 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>Coach intervention plan</p>
            <ul className={`space-y-2 text-[14px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>
              {client.interventionPlan.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${statusTone.accent}`}>→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
            <p className={`mb-3 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>This-week commitments</p>
            <div className="space-y-3">
              {client.thisWeekCommitments.map((commitment) => {
                const commitmentTone = getCommitmentStatusTone(commitment.status)
                return (
                <div key={`${commitment.task}-${commitment.owner}`} className={`rounded border bg-white/[0.03] p-3 ${commitmentTone.border}`}>
                  <p className={`text-[13px] font-semibold ${DASHBOARD_THEME.inkStrong}`}>{commitment.task}</p>
                  <p className={`mt-1 text-[12px] ${DASHBOARD_THEME.metalStrong}`}>Owner: {commitment.owner} · Due: {commitment.due}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${commitmentTone.badge}`}>
                    {commitment.status}
                  </span>
                </div>
                )
              })}
            </div>

            <p className={`mb-3 mt-6 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>Session agenda</p>
            <ul className={`space-y-2 text-[14px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>
              {client.sessionAgenda.map((agendaItem) => (
                <li key={agendaItem} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${DASHBOARD_THEME.metalStrong}`}>1.</span>
                  <span>{agendaItem}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
          <h2 className={`mb-3 text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>Recent signal activity</h2>
          <div className="space-y-3">
            {client.recentSignals.map((signal) => (
              <div key={`${signal.label}-${signal.at}`} className={`border-l-2 pl-4 ${statusTone.border.replace('border-l-4 ', '')}`}>
                <p className={`text-[13px] font-semibold ${DASHBOARD_THEME.inkStrong}`}>{signal.label}</p>
                <p className={`text-[13px] leading-[1.55] ${DASHBOARD_THEME.ink}`}>{signal.detail}</p>
                <p className={`mt-1 text-[11px] ${DASHBOARD_THEME.metalStrong}`}>{signal.at}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <h2 className="mb-2 text-[11px] font-bold tracking-[0.12em] text-emerald-800">Trust and next action</h2>
          <p className="text-[13px] leading-relaxed text-slate-700">
            This coach workspace is confidential and intended for private session preparation only. Teams using this workflow report clearer weekly decisions and faster follow-through on overdue commitments.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/coaches/mock-dashboard"
              className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Open coach portfolio dashboard
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-800 transition-colors hover:border-slate-500"
            >
              Start coach workflow setup
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
