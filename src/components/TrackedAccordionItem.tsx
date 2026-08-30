'use client'

import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'
import type { SyntheticEvent } from 'react'

type Props = {
  title: string
  summary: string
  detail: string
  href: string
  channel: 'executives' | 'coaches' | 'outplacement' | 'search_firms'
  route: string
  blockId: string
}

export function TrackedAccordionItem({ title, summary, detail, href, channel, route, blockId }: Props) {
  const ph = usePostHog()

  function handleToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    const open = e.currentTarget.open
    const properties = {
      channel,
      route,
      block_id: blockId,
      action: open ? 'accordion_open' : 'accordion_close',
    }

    try {
      ph?.capture('trust_block_interacted', properties)
    } catch {
      // never block UI interactions
    }

    try {
      void fetch('/api/events/channel-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'trust_block_interacted',
          properties,
        }),
        keepalive: true,
      })
    } catch {
      // never block UI interactions
    }
  }

  return (
    <details className="rounded-md border border-border bg-primary px-3 py-2" onToggle={handleToggle}>
      <summary className="cursor-pointer list-none text-[13px] font-semibold text-primary-foreground flex items-start justify-between gap-3">
        <span>{title}</span>
        <span className="text-[11px] text-primary shrink-0">Learn more</span>
      </summary>
      <p className="text-[12px] text-primary-foreground mt-2 [text-wrap:pretty]">{summary}</p>
      <p className="text-[12px] text-primary-foreground mt-2 [text-wrap:pretty]">{detail}</p>
      <Link href={href} className="inline-flex mt-2 text-[12px] text-primary transition-colors">
        Open related article
      </Link>
    </details>
  )
}
