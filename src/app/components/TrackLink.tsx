'use client'
import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import { withDeterministicVariant } from '@/lib/experiment-variants'

type Props = ComponentPropsWithoutRef<typeof Link> & {
  event: string
  properties?: Record<string, string | number | boolean | null>
  logToUserEvents?: boolean
}

export function TrackLink({ event, properties, onClick, children, logToUserEvents = false, ...props }: Props) {
  const posthog = usePostHog()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const enrichedProperties = withDeterministicVariant(properties, null)

    try {
      posthog?.capture(event, enrichedProperties)
    } catch {
      // analytics must never block navigation
    }

    if (logToUserEvents) {
      try {
        void fetch('/api/events/channel-funnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, properties: enrichedProperties }),
          keepalive: true,
        })
      } catch {
        // never block navigation
      }
    }

    onClick?.(e)
  }

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  )
}
