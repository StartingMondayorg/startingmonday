'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AppShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-shell]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center px-6">
      <Card className="p-8 max-w-md w-full">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">
          Starting Monday
        </div>
        <h1 className="text-[20px] font-bold text-slate-900 mb-3">
          Something went wrong.
        </h1>
        <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
          A temporary error occurred. Try refreshing - if it persists, the team has been notified.
        </p>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  )
}
