'use client'

import { TrackLink } from '@/app/components/TrackLink'

const EVENT_NAME = 'coach_preview_requested'
const EVENT_PROPERTIES = {
  page: 'for-coaches',
  audience: 'executive_coaches',
  motion: 'warm_intro_preview',
} as const

export function CoachPreviewActions() {
  return (
    <div className="space-y-2.5">

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Choose your start lane</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        <TrackLink
          href="/for-coaches/micro-products"
          data-emi-cta="coaches_small_fee_start"
          data-emi-to="/for-coaches/micro-products"
          event={EVENT_NAME}
          properties={{ ...EVENT_PROPERTIES, lane: 'small_fee_products' }}
          className="inline-flex items-center justify-center rounded bg-warning px-6 py-3 text-[13px] font-semibold text-warning-foreground transition-colors hover:bg-warning/90"
        >
          Start with a small-fee signal product
        </TrackLink>
        <a
          href="https://app-na2.hubspot.com/meetings/246442927"
          className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Book a meeting
        </a>
        <TrackLink
          href="/partners#apply"
          data-emi-cta="coaches_request_preview"
          data-emi-to="/partners#apply"
          event={EVENT_NAME}
          properties={EVENT_PROPERTIES}
          className="inline-flex items-center justify-center rounded border border-border px-6 py-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Start coach partner pilot
        </TrackLink>
      </div>
    </div>
  )
}
