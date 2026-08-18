import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'

type ChannelSectionLayoutProps = {
  sectionHref: string
  sectionLabel: string
  children: React.ReactNode
}

export function ChannelSectionLayout({ sectionHref, sectionLabel, children }: ChannelSectionLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={sectionHref}
              className="inline-flex items-center justify-center rounded border border-slate-600 px-3 py-2 text-[12px] font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white sm:px-4"
            >
              {sectionLabel}
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded bg-orange-500 px-3 py-2 text-[12px] font-semibold text-slate-950 transition-colors hover:bg-orange-600 sm:px-4"
            >
              Start now
            </Link>
          </div>
        </div>
      </nav>

      {children}

      <SiteFooter />
    </div>
  )
}
