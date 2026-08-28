'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-muted font-sans flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-[24px] font-bold text-foreground">Something went wrong</h1>
        <p className="text-[14px] text-muted-foreground mt-2">An unexpected error occurred.</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={reset}
            className="text-[14px] font-semibold text-primary-foreground bg-primary px-4 py-2.5 rounded hover:bg-muted cursor-pointer border-0"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-[14px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
