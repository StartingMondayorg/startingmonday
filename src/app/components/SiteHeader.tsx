import Link from 'next/link'

type SiteHeaderProps = {
  className?: string
}

export function SiteHeader({ className = '' }: SiteHeaderProps) {
  return (
    <nav className={`sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl ${className}`.trim()}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-white/95 transition-opacity hover:opacity-80 inline-flex items-center min-h-[48px]" aria-label="Go to homepage">
          <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-orange-500 text-slate-900 text-[13px] font-bold px-3.5 min-h-[48px] rounded hover:bg-orange-600 transition-colors"
            aria-label="Sign up"
          >
            Sign Up
          </Link>
          <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition-colors inline-flex items-center min-h-[48px] px-3" aria-label="Log in">
            Log in
          </Link>
        </div>
      </div>
    </nav>
  )
}
