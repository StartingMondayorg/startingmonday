'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button, Card } from '@/components/ui'
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
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-background/72">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-start">
        <Card variant="glass" className="gap-0 p-8 max-w-md">
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">
            {label} Error
          </div>
          <h1 className="text-[20px] font-bold text-foreground mb-3">
            Something went wrong.
          </h1>
          <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
            This page failed to load. It is usually a temporary issue.
            Try refreshing - if it persists, the team has been notified.
          </p>
          <Button onClick={reset} className="h-auto px-6 py-2.5 text-[14px] font-semibold">
            Try again
          </Button>
        </Card>
      </main>
    </div>
  )
}

