'use client'

import { useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import type { PostHog } from 'posthog-js'
import type { HeroEventName } from '@/lib/channel-metrics-events'

type HeroPageViewTelemetryProps = {
  event: HeroEventName
  properties?: Record<string, string | number | boolean | null>
}

type HeroTelemetryClient = Pick<PostHog, 'capture' | 'onFeatureFlags'>

export function captureHeroPageViewWhenReady(
  posthog: HeroTelemetryClient,
  event: HeroEventName,
  properties: HeroPageViewTelemetryProps['properties'],
  hasCaptured: { current: boolean },
) {
  return posthog.onFeatureFlags(() => {
    if (hasCaptured.current) return
    hasCaptured.current = true

    try {
      posthog.capture(event, properties)
    } catch {
      // Analytics must never block the page.
    }
  })
}

export function HeroPageViewTelemetry({ event, properties }: HeroPageViewTelemetryProps) {
  const posthog = usePostHog()
  const hasCaptured = useRef(false)

  useEffect(() => {
    if (!posthog) return
    return captureHeroPageViewWhenReady(posthog, event, properties, hasCaptured)
  }, [event, posthog, properties])

  return null
}
