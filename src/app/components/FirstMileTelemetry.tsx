'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

type FirstMileTelemetryProps = {
  eventName: 'homepage_viewed' | 'homepage_dwell_10s' | 'homepage_dwell_30s' | 'homepage_cta_clicked' | 'first_mile_section_dwell' | 'dashboard_first_run_viewed'
  pageName: 'homepage' | 'dashboard_first_run'
  enabled?: boolean
  properties?: Record<string, string | number | boolean | null>
}

async function logChannelEvent(event: string, properties: Record<string, string | number | boolean | null>) {
  try {
    await fetch('/api/events/channel-funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties }),
      keepalive: true,
    })
  } catch {
    // Analytics must never block the experience.
  }
}

export function FirstMileTelemetry({ eventName, pageName, enabled = true, properties = {} }: FirstMileTelemetryProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!enabled) return

    const baseProps = {
      page_name: pageName,
      ...properties,
    }

    posthog?.capture(eventName, baseProps)
    void logChannelEvent(eventName, baseProps)

    const sectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-first-mile-section]'))
    const sectionVisibleSince = new Map<string, number>()
    const sectionObserver = new IntersectionObserver((entries) => {
      const now = Date.now()
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        const sectionId = element.getAttribute('data-first-mile-section')
        if (!sectionId) continue

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!sectionVisibleSince.has(sectionId)) {
            sectionVisibleSince.set(sectionId, now)
          }
          continue
        }

        const startedAt = sectionVisibleSince.get(sectionId)
        if (!startedAt) continue
        sectionVisibleSince.delete(sectionId)
        const dwellMs = now - startedAt
        if (dwellMs < 1200) continue
        const dwellProps = {
          ...baseProps,
          section_id: sectionId,
          dwell_ms: dwellMs,
        }
        posthog?.capture('first_mile_section_dwell', dwellProps)
        void logChannelEvent('first_mile_section_dwell', dwellProps)
      }
    }, { threshold: [0.5] })

    sectionElements.forEach((element) => sectionObserver.observe(element))

    if (eventName !== 'homepage_viewed') {
      return () => {
        sectionObserver.disconnect()
      }
    }

    const fired = new Set<string>()
    const timeouts = [
      { key: 'homepage_dwell_10s', delay: 10_000 as const },
      { key: 'homepage_dwell_30s', delay: 30_000 as const },
    ]

    const handles = timeouts.map(({ key, delay }) => window.setTimeout(() => {
      if (fired.has(key)) return
      fired.add(key)
      const dwellProps = {
        ...baseProps,
        dwell_ms: delay,
      }
      posthog?.capture(key, dwellProps)
      void logChannelEvent(key, dwellProps)
    }, delay))

    return () => {
      handles.forEach((handle) => window.clearTimeout(handle))
      sectionObserver.disconnect()
    }
  }, [enabled, eventName, pageName, posthog, properties])

  return null
}