import Link from 'next/link'
import { SiteFooter } from '@/app/components/SiteFooter'

type ChannelSectionLayoutProps = {
  sectionHref: string
  sectionLabel: string
  children: React.ReactNode
}

export function ChannelSectionLayout({ sectionHref, sectionLabel, children }: ChannelSectionLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={sectionHref}
              className="inline-flex items-center justify-center rounded border border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:px-4"
            >
              {sectionLabel}
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
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
