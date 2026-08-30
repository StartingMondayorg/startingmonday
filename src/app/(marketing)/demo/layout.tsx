import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://startingmonday.app/demo',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">Demo route</span>
          <Link href="/dashboard" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-background/92">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-[12px] text-muted-foreground">Continue from demo into your live workspace.</p>
          <Link href="/dashboard" className="text-[13px] font-semibold text-primary transition-colors">
            Back to dashboard
          </Link>
        </div>
      </footer>
    </>
  )
}
