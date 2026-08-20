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
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/88 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-400">Demo route</span>
          <Link href="/dashboard" className="text-[13px] font-semibold text-slate-200 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10 bg-slate-950/92">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-[12px] text-slate-400">Continue from demo into your live workspace.</p>
          <Link href="/dashboard" className="text-[13px] font-semibold text-orange-300 hover:text-orange-200 transition-colors">
            Back to dashboard
          </Link>
        </div>
      </footer>
    </>
  )
}
