'use client'

import { useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { HeroEventName } from '@/lib/channel-metrics-events'

type HeroPageViewTelemetryProps = {
  event: HeroEventName
  properties?: Record<string, string | number | boolean | null>
}

export function HeroPageViewTelemetry({ event, properties }: HeroPageViewTelemetryProps) {
  const posthog = usePostHog()
  const hasCaptured = useRef(false)

  useEffect(() => {
    if (hasCaptured.current) return
    hasCaptured.current = true

    try {
      posthog?.capture(event, properties)
    } catch {
      // Analytics must never block the page.
    }
  }, [event, posthog, properties])

  return null
}
