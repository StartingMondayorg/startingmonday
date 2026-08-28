import Link from 'next/link'

type SiteHeaderProps = {
  className?: string
}

export function SiteHeader({ className = '' }: SiteHeaderProps) {
  return (
    <nav className={`sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl ${className}`.trim()}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-foreground/95 transition-opacity hover:opacity-80 inline-flex items-center min-h-[48px]" aria-label="Go to homepage">
          <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-[13px] font-bold px-3.5 min-h-[48px] rounded hover:bg-primary/90 transition-colors"
            aria-label="Sign up"
          >
            Sign Up
          </Link>
          <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[48px] px-3" aria-label="Log in">
            Log in
          </Link>
        </div>
      </div>
    </nav>
  )
}
