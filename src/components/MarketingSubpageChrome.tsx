import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'

type MarketingSubpageChromeProps = {
  children: React.ReactNode
  backHref: string
  backLabel: string
}

export function MarketingSubpageChrome({ children, backHref, backLabel }: MarketingSubpageChromeProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,1)_100%)]" />

      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-white/95 transition-opacity hover:opacity-80"
            aria-label="Go to homepage"
          >
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 px-4 text-[12px] font-semibold text-slate-100 transition-colors hover:border-white/25 hover:text-white"
            >
              Home
            </Link>
            <Link
              href={backHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-orange-500 px-4 text-[12px] font-semibold text-slate-950 transition-colors hover:bg-orange-400"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative">{children}</div>

      <SiteFooter className="border-t border-slate-800 bg-slate-950" />
    </div>
  )
}