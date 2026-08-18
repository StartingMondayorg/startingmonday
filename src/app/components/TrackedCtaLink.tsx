'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'

type TrackedCtaLinkProps = {
  href: string
  eventName: string
  eventProps?: Record<string, string | number | boolean>
  className?: string
  children: ReactNode
}

export default function TrackedCtaLink({
  href,
  eventName,
  eventProps,
  className,
  children,
}: TrackedCtaLinkProps) {
  const posthog = usePostHog()
  const isExternal = href.startsWith('http') || href.startsWith('mailto:')

  const handleClick = () => {
    posthog?.capture(eventName, {
      href,
      ...eventProps,
    })
  }

  if (isExternal) {
    return (
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}