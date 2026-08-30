import Link from 'next/link'

type PublicPageHeaderProps = {
  backHref: string
  backLabel?: string
  className?: string
}

export function PublicPageHeader({ backHref, backLabel = 'Back', className = '' }: PublicPageHeaderProps) {
  return (
    <nav className={`sticky top-0 z-20 border-b border-border bg-background/78 backdrop-blur-xl ${className}`.trim()}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-[48px] items-center text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-foreground/95 transition-opacity hover:opacity-80" aria-label="Go to homepage">
          <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-border px-3.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Home
          </Link>
        </div>
      </div>
    </nav>
  )
}