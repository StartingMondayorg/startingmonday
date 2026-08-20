'use client'

import { useEffect, useMemo } from 'react'
import { usePostHog } from 'posthog-js/react'

type EmiMarketingTelemetryProps = {
  pageSlug: string
  personaSegment: string
  experimentId?: string
}

export function getWeekStartISO(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session'
  const key = 'emi_session_id'
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `emi-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem(key, next)
  return next
}

export function EmiMarketingTelemetry({
  pageSlug,
  personaSegment,
  experimentId = 'sprint1_emi_content_a_plus',
}: EmiMarketingTelemetryProps) {
  const ph = usePostHog()
  const weekStart = useMemo(() => getWeekStartISO(new Date()), [])

  useEffect(() => {
    if (!ph) return

    const sessionId = getSessionId()
    const baseProps = {
      page_slug: pageSlug,
      persona_segment: personaSegment,
      experiment_id: experimentId,
      session_id: sessionId,
      week_start: weekStart,
    }

    try {
      ph.capture('emi_page_view', {
        ...baseProps,
        cta_id: null,
        proof_id: null,
        objection_id: null,
      })
    } catch {
      // analytics must never block rendering
    }

    const ctaHandler = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null
      if (!target) return
      const ctaId = target.getAttribute('data-emi-cta')
      if (!ctaId) return
      const toPath = target.getAttribute('data-emi-to') || (target as HTMLAnchorElement).getAttribute('href') || null

      try {
        ph.capture('emi_cta_click', {
          ...baseProps,
          cta_id: ctaId,
          proof_id: null,
          objection_id: null,
          to_path: toPath,
        })

        if (toPath) {
          ph.capture('emi_path_transition', {
            ...baseProps,
            cta_id: ctaId,
            proof_id: null,
            objection_id: null,
            to_path: toPath,
          })
        }
      } catch {
        // analytics must never block interaction
      }
    }

    const ctaElements = Array.from(document.querySelectorAll<HTMLElement>('[data-emi-cta]'))
    ctaElements.forEach((el) => el.addEventListener('click', ctaHandler))

    const seenProofIds = new Set<string>()
    const proofObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        const proofId = el.getAttribute('data-emi-proof')
        if (!proofId || seenProofIds.has(proofId)) return
        seenProofIds.add(proofId)
        try {
          ph.capture('emi_proof_block_view', {
            ...baseProps,
            cta_id: null,
            proof_id: proofId,
            objection_id: null,
          })
        } catch {
          // analytics must never block interaction
        }
      })
    }, { threshold: 0.35 })

    const proofElements = Array.from(document.querySelectorAll<HTMLElement>('[data-emi-proof]'))
    proofElements.forEach((el) => proofObserver.observe(el))

    const objectionHandler = (event: Event) => {
      const target = event.currentTarget as HTMLDetailsElement | null
      if (!target || !target.open) return
      const objectionId = target.getAttribute('data-emi-objection')
      if (!objectionId) return
      try {
        ph.capture('emi_objection_expand', {
          ...baseProps,
          cta_id: null,
          proof_id: null,
          objection_id: objectionId,
        })
      } catch {
        // analytics must never block interaction
      }
    }

    const objectionElements = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-emi-objection]'))
    objectionElements.forEach((el) => el.addEventListener('toggle', objectionHandler))

    const sectionVisibleSince = new Map<string, number>()
    const sectionObserver = new IntersectionObserver((entries) => {
      const now = Date.now()
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement
        const sectionId = el.getAttribute('data-emi-section')
        if (!sectionId) return

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!sectionVisibleSince.has(sectionId)) {
            sectionVisibleSince.set(sectionId, now)
          }
          return
        }

        const startedAt = sectionVisibleSince.get(sectionId)
        if (!startedAt) return
        sectionVisibleSince.delete(sectionId)

        const dwellMs = now - startedAt
        if (dwellMs < 1200) return
        try {
          ph.capture('emi_section_dwell', {
            ...baseProps,
            cta_id: null,
            proof_id: null,
            objection_id: null,
            section_id: sectionId,
            dwell_ms: dwellMs,
          })
        } catch {
          // analytics must never block interaction
        }
      })
    }, { threshold: [0.5] })

    const sectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-emi-section]'))
    sectionElements.forEach((el) => sectionObserver.observe(el))

    const firedScrollMilestones = new Set<number>()
    const onScroll = () => {
      const root = document.documentElement
      const scrollable = Math.max(root.scrollHeight - window.innerHeight, 1)
      const pct = Math.round((window.scrollY / scrollable) * 100)
      const milestones = [25, 50, 75, 100]

      for (const milestone of milestones) {
        if (pct < milestone || firedScrollMilestones.has(milestone)) continue
        firedScrollMilestones.add(milestone)
        try {
          ph.capture('emi_scroll_depth', {
            ...baseProps,
            cta_id: null,
            proof_id: null,
            objection_id: null,
            depth_pct: milestone,
          })
        } catch {
          // analytics must never block interaction
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    const flushSectionDwell = () => {
      const now = Date.now()
      for (const [sectionId, startedAt] of sectionVisibleSince.entries()) {
        const dwellMs = now - startedAt
        if (dwellMs < 1200) continue
        try {
          ph.capture('emi_section_dwell', {
            ...baseProps,
            cta_id: null,
            proof_id: null,
            objection_id: null,
            section_id: sectionId,
            dwell_ms: dwellMs,
          })
        } catch {
          // analytics must never block interaction
        }
      }
      sectionVisibleSince.clear()
    }

    window.addEventListener('beforeunload', flushSectionDwell)

    return () => {
      flushSectionDwell()
      ctaElements.forEach((el) => el.removeEventListener('click', ctaHandler))
      proofObserver.disconnect()
      objectionElements.forEach((el) => el.removeEventListener('toggle', objectionHandler))
      sectionObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', flushSectionDwell)
    }
  }, [experimentId, pageSlug, personaSegment, ph, weekStart])

  return null
}
