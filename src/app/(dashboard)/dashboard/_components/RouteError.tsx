'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export function RouteError({
  error,
  reset,
  label = 'Page',
}: {
  error: Error & { digest?: string }
  reset: () => void
  label?: string
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <header className="border-b border-white/10 bg-slate-950/72">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-start">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 max-w-md">
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">
            {label} Error
          </div>
          <h1 className="text-[20px] font-bold text-white mb-3">
            Something went wrong.
          </h1>
          <p className="text-[14px] text-slate-300 leading-relaxed mb-6">
            This page failed to load. It is usually a temporary issue.
            Try refreshing - if it persists, the team has been notified.
          </p>
          <button
            onClick={reset}
            className="bg-orange-500 text-slate-950 text-[14px] font-semibold px-6 py-2.5 rounded cursor-pointer border-0 hover:bg-orange-400 transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  )
}

