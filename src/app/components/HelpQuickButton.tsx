'use client'

import { TrackLink } from '@/app/components/TrackLink'
import { useEffect, useState } from 'react'

export function HelpQuickButton({
  source,
  href = '/dashboard/help',
}: {
  source: 'dashboard' | 'briefing' | 'onboarding'
  href?: string
}) {
  const [hideNearFooter, setHideNearFooter] = useState(false)

  useEffect(() => {
    const footer = document.getElementById('dashboard-footer')
    if (!footer) return
    const observer = new IntersectionObserver(
      (entries) => setHideNearFooter(entries[0]?.isIntersecting ?? false),
      { threshold: 0.12 },
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <TrackLink
      href={href}
      event="help_quick_button_clicked"
      properties={{ source }}
      className={[
        'fixed bottom-32 sm:bottom-10 left-4 sm:left-6 z-40 inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-2 text-[12px] font-semibold text-muted-foreground shadow-md backdrop-blur hover:text-foreground transition-all',
        hideNearFooter ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 pointer-events-auto translate-y-0',
      ].join(' ')}
    >
      Need help?
    </TrackLink>
  )
}