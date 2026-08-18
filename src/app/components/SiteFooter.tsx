import Link from 'next/link'

type SiteFooterProps = {
  centered?: boolean
  className?: string
}

export function SiteFooter({ centered = false, className = '' }: SiteFooterProps) {
  return (
    <footer className={`bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-10 ${className}`.trim()}>
      <div className="max-w-5xl mx-auto">
        <div className={centered ? 'flex flex-col items-center gap-5' : 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'}>
          <span className={centered ? 'text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 text-center' : 'text-[12px] sm:text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400'}>
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className={centered ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3 text-[12px] text-slate-400 justify-items-center text-center' : 'flex items-center gap-4 sm:gap-5 flex-wrap text-[12px] text-slate-400'}>
            <Link href="/evidence-hub" className="hover:text-slate-300 transition-colors">Evidence Hub</Link>
            <Link href="/blog" className="hover:text-slate-300 transition-colors">Blog</Link>
            <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <Link href="/optimize" className="hover:text-slate-300 transition-colors">Free Profile Grade</Link>
            <a href="https://www.linkedin.com/company/starting-monday" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">LinkedIn</a>
            <Link href="/security" className="hover:text-slate-300 transition-colors">Security</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>

        {centered ? (
          <p className="text-[11px] text-slate-500 mt-5 text-center">
            Privacy-first by design. No sale of user data, ever. {' '}|{' '} &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-slate-500 mt-5">Privacy-first by design. No sale of user data, ever.</p>
            <p className="text-[11px] text-slate-500 mt-2">&copy; {new Date().getFullYear()} Starting Monday. All rights reserved.</p>
          </>
        )}
      </div>
    </footer>
  )
}

