import Link from 'next/link'

type PublicPageHeaderProps = {
  backHref: string
  backLabel?: string
  className?: string
}

export function PublicPageHeader({ backHref, backLabel = 'Back', className = '' }: PublicPageHeaderProps) {
  return (
    <nav className={`sticky top-0 z-20 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl ${className}`.trim()}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-[48px] items-center text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-white/95 transition-opacity hover:opacity-80" aria-label="Go to homepage">
          <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-3.5 text-[12px] font-semibold text-slate-200 transition-colors hover:border-white/25 hover:text-white"
          >
            {backLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-orange-500 px-3.5 text-[12px] font-semibold text-slate-950 transition-colors hover:bg-orange-600"
          >
            Home
          </Link>
        </div>
      </div>
    </nav>
  )
}