import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'

type MarketingSubpageChromeProps = {
  children: React.ReactNode
  backHref: string
  backLabel: string
}

export function MarketingSubpageChrome({ children, backHref, backLabel }: MarketingSubpageChromeProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      <nav className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-foreground/95 transition-opacity hover:opacity-80"
            aria-label="Go to homepage"
          >
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-4 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href={backHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative">{children}</div>

      <SiteFooter className="border-t border-border bg-background" />
    </div>
  )
}