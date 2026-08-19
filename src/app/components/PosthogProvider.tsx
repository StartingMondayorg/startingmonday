'use client'
import posthog from 'posthog-js'
import { PostHogProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { HERO_EVENT_NAMES } from '@/lib/channel-metrics-events'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    ph?.capture('$pageview')

    if (pathname === '/' && document.querySelector('[data-hero-evidence-actions]')) {
      ph?.capture(HERO_EVENT_NAMES.heroView, { source_page: '/' })
    }

    if (pathname === '/example') {
      ph?.capture(HERO_EVENT_NAMES.exampleView, { source_page: '/example' })
    }
  }, [pathname, searchParams, ph])

  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
