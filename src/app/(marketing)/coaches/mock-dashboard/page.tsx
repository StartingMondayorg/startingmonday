import type { Metadata } from 'next'
import Link from 'next/link'
import { MOCK_CLIENTS, MOCK_PORTFOLIO_KPIS } from './mock-data'
import { getClientStatusTone, getMomentumTone, getOverdueTone } from './status-theme'
import { DASHBOARD_THEME } from './theme-tokens'

export const metadata: Metadata = {
  title: 'Mock Coach Dashboard | Starting Monday',
  description:
    'Preview the coach command center: portfolio risk, weekly execution, and client-level next actions in one view.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/mock-dashboard',
  },
}

export default function MockCoachDashboardPage() {
  return (
    <div className={`min-h-screen ${DASHBOARD_THEME.appBg} ${DASHBOARD_THEME.inkStrong}`}>
      <nav className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/coaches" className="text-[13px] text-slate-200 transition-colors hover:text-white">
            Back to coaches
          </Link>
        </div>
      </nav>

      <header className={`border-b px-4 py-10 sm:px-6 sm:py-12 ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-orange-600">Mock coach dashboard</p>
          <h1 className={`mt-2 font-serif text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[42px] ${DASHBOARD_THEME.inkStrong}`}>
            Your next coaching session should start with decisions, not recap.
          </h1>
          <p className={`mt-4 max-w-3xl text-[15px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>
            Manage your full client portfolio in one place, then click into any client to see the intervention plan,
            session agenda, commitment risk, and momentum signals before you meet.
          </p>
          <p className={`mt-3 max-w-3xl text-[14px] leading-[1.6] ${DASHBOARD_THEME.ink}`}>
            This is what your view looks like when 3-5 clients are in active search. Accountability research shows
            that coach visibility into between-session execution is one of the strongest moderators of coaching
            outcomes.
          </p>
          <p className={`mt-2 text-[12px] ${DASHBOARD_THEME.metalStrong}`}>Source: Bozer and Jones, 2018.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={`font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Scan by state:</span>
            <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-1 font-semibold text-rose-800">High risk</span>
            <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-1 font-semibold text-amber-900">Needs intervention</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">Stable</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MOCK_PORTFOLIO_KPIS.map((kpi) => (
            <article key={kpi.label} className={`rounded-xl border p-4 shadow-[0_6px_22px_rgba(15,23,42,0.06)] ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
              <p className={`text-[11px] font-semibold tracking-[0.1em] ${DASHBOARD_THEME.metalStrong}`}>{kpi.label}</p>
              <p className={`mt-2 text-[28px] font-semibold leading-none ${DASHBOARD_THEME.inkStrong}`}>{kpi.value}</p>
              <p className={`mt-1 text-[12px] ${DASHBOARD_THEME.metal}`}>{kpi.note}</p>
            </article>
          ))}
        </section>

        <section className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${DASHBOARD_THEME.panelBorder} ${DASHBOARD_THEME.paper}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className={`text-[11px] font-semibold tracking-[0.12em] ${DASHBOARD_THEME.metalStrong}`}>Portfolio command center</p>
            <p className={`text-[12px] ${DASHBOARD_THEME.metalStrong}`}>Click any client to open the detailed coach dashboard</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className={`border-b ${DASHBOARD_THEME.panelBorder}`}>
                  <th className={`py-2 pr-3 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Client</th>
                  <th className={`py-2 pr-3 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Track</th>
                  <th className={`py-2 pr-3 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Status</th>
                  <th className={`py-2 pr-3 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Momentum</th>
                  <th className={`py-2 pr-3 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Overdue</th>
                  <th className={`py-2 text-[11px] font-semibold tracking-[0.08em] ${DASHBOARD_THEME.metalStrong}`}>Next session focus</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CLIENTS.map((client) => {
                  const statusTone = getClientStatusTone(client.status)
                  return (
                  <tr key={client.id} className={`border-b border-white/10 align-top transition-colors hover:bg-white/5 ${statusTone.border}`}>
                    <td className="py-3 pr-3">
                      <Link href={`/coaches/mock-dashboard/${client.id}`} className={`text-[13px] font-semibold ${DASHBOARD_THEME.inkStrong} hover:text-orange-700`}>
                        {client.name}
                      </Link>
                    </td>
                    <td className={`py-3 pr-3 text-[13px] ${DASHBOARD_THEME.ink}`}>{client.roleTrack}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${statusTone.badge}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className={`py-3 pr-3 text-[13px] font-semibold ${getMomentumTone(client.momentum)}`}>{client.momentum}</td>
                    <td className={`py-3 pr-3 text-[13px] font-semibold ${getOverdueTone(client.overdueActions)}`}>{client.overdueActions}</td>
                    <td className={`py-3 text-[13px] ${DASHBOARD_THEME.ink}`}>{client.nextSessionObjective}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
          <h2 className="text-[23px] font-bold leading-tight">When this is live, coaching quality compounds.</h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-200">
            You spend less time chasing status and more time making high-leverage calls with clients.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/partners#apply"
              className="inline-flex items-center justify-center rounded bg-orange-500 px-6 py-3 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-orange-600"
            >
              Request the coach preview
            </Link>
            <Link
              href="/dashboard/coach"
              className="inline-flex items-center justify-center rounded border border-slate-600 px-6 py-3 text-[14px] font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
            >
              Open live coach dashboard
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
