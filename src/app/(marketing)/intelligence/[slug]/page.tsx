import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getIntelCompany,
  getIntelSignals,
  validateAccessToken,
  signalLabel,
  SIGNAL_COLORS,
} from '@/lib/intelligence'

const FREE_LIMIT = 3
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const company = await getIntelCompany(slug)
  if (!company) return { title: 'Company Intelligence' }
  return {
    title: `${company.company_name} Intelligence`,
    description: company.description ?? `Executive signals, leadership moves, and company intelligence for ${company.company_name}.`,
    robots: { index: true, follow: false },
  }
}

export default async function IntelligencePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { slug } = await params
  const { t: token } = await searchParams

  const [company, isUnlocked] = await Promise.all([
    getIntelCompany(slug),
    validateAccessToken(slug, token ?? null),
  ])

  if (!company) notFound()

  const allSignals = await getIntelSignals(company.company_name)
  const visibleSignals = isUnlocked ? allSignals : allSignals.slice(0, FREE_LIMIT)
  const gatedCount = allSignals.length - visibleSignals.length
  const isGated = !isUnlocked && allSignals.length > FREE_LIMIT

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.18em] uppercase text-slate-200 hover:text-white transition-colors">
            <span className="text-white">Starting </span>
            <span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[13px] font-semibold text-slate-200 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-4 py-2 rounded transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
{/* Company hero */}
        <section id="company-overview" className="mb-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center text-white text-[16px] font-bold shrink-0">
              {company.company_name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-tight">
                {company.company_name}
              </h1>
              {company.sector && (
                <span className="text-[13px] font-semibold text-slate-200 tracking-wide uppercase">
                  {company.sector}
                </span>
              )}
            </div>
          </div>

          {company.description && (
            <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl">
              {company.description}
            </p>
          )}

          {/* Stats bar */}
          <div className="mt-6 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[13px] font-semibold text-slate-700">
                {allSignals.length} signal{allSignals.length !== 1 ? 's' : ''} tracked
              </span>
            </div>
            {company.website && (
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-slate-200 hover:text-slate-700 transition-colors"
              >
                {company.website.replace(/^https?:\/\//, '')} &nearr;
              </a>
            )}
            {isUnlocked && (
              <span className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600 bg-orange-50 px-2.5 py-1 rounded">
                Full access
              </span>
            )}
          </div>
        </section>

        {/* Intelligence feed */}
        <section id="recent-intelligence" className="mb-4">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Recent intelligence
          </h2>

          {allSignals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg px-6 py-12 text-center">
              <div className="text-[15px] font-semibold text-slate-900 mb-2">
                Building intelligence on {company.company_name}
              </div>
              <p className="text-[13px] text-slate-500 mb-6 max-w-sm mx-auto">
                Sign up to track this company. We scan for signals every 48 hours and alert you the moment something changes.
              </p>
              <p className="text-[13px] text-slate-500 mb-3">Outcome metric: signal scans every 48 hours improve timing before public search activity peaks.</p>
              <Link
                href="/signup"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold px-6 py-3 rounded transition-colors"
              >
                Get started now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleSignals.map((signal, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-lg px-5 py-4"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={[
                      'text-[13px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full',
                      SIGNAL_COLORS[signal.signal_type] ?? 'bg-slate-100 text-slate-600',
                    ].join(' ')}>
                      {signalLabel(signal.signal_type)}
                    </span>
                    <span className="text-[13px] text-slate-200">
                      {new Date(signal.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-700 leading-relaxed">
                    {signal.signal_summary}
                  </p>
                  {signal.source_url && !signal.source_url.startsWith('pattern://') && !signal.source_url.startsWith('sec-trend://') && (
                    <a
                      href={signal.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[13px] text-slate-200 hover:text-slate-700 transition-colors"
                    >
                      Source &nearr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gate */}
        {isGated && (
          <section id="access-gate" className="relative mt-2">
            {/* Blurred preview of next signal */}
            <div className="pointer-events-none select-none overflow-hidden rounded-lg" aria-hidden>
              <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 opacity-30 blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[13px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                    Exec Move
                  </span>
                  <span className="text-[13px] text-slate-200">Recent</span>
                </div>
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  Senior leadership change detected at {company.company_name}. New appointment signals a strategic shift in technology direction.
                </p>
              </div>
            </div>

            {/* Gate overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 rounded-lg px-6 py-8 text-center">
              <div className="text-[22px] font-bold text-slate-900 mb-2">
                {gatedCount} more signal{gatedCount !== 1 ? 's' : ''} available
              </div>
              <p className="text-[14px] text-slate-500 mb-6 max-w-xs">
                Track {company.company_name} and every company on your target list. Get daily alerts when timing shifts.
              </p>
              <p className="text-[13px] text-slate-500 mb-3">Trust and confidentiality: your tracked companies and signal workflow stay private to your account.</p>
              <Link
                href={`${APP_URL}/signup`}
                className="bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-semibold px-8 py-3 rounded transition-colors"
              >
                Start free trial
              </Link>
              <Link href="/login" className="mt-3 text-[13px] text-slate-200 hover:text-slate-700 transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </section>
        )}

        {/* Bottom CTA for unlocked pages */}
        {isUnlocked && allSignals.length > 0 && (
          <section id="next-step" className="mt-10 bg-slate-950 rounded-xl px-6 sm:px-8 py-8 text-center">
            <div className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">
              Starting Monday Intelligence
            </div>
            <h2 className="text-[22px] font-bold text-white mb-3">
              Track every company on your target list.
            </h2>
            <p className="text-[14px] text-slate-200 leading-relaxed mb-6 max-w-md mx-auto">
              Exec moves, funding rounds, acquisitions, and filing trends. Signals delivered daily before you start your day.
            </p>
            <p className="text-[13px] text-slate-200 leading-relaxed mb-4">Outcome metric: better signal timing improves outreach response windows and interview readiness.</p>
            <Link
              href="/signup"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-semibold px-8 py-3 rounded transition-colors"
            >
              Get started now
            </Link>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 border-t border-slate-200 mt-10">
        <p className="text-[13px] text-slate-200 text-center">
          <Link href="/" className="hover:text-slate-700 transition-colors">Starting Monday</Link>
          {' '}&middot;{' '}Executive intelligence for active job seekers
        </p>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}
