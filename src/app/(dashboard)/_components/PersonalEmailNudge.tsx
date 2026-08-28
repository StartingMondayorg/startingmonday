'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, Button } from '@/components/ui'
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com',
  'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'pm.me',
  'hey.com', 'fastmail.com', 'fastmail.fm', 'aol.com', 'zoho.com',
])

const DISMISS_KEY = 'sm_personal_email_nudge_v1'

function isCorporate(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return !!domain && !PERSONAL_DOMAINS.has(domain)
}

export function PersonalEmailNudge({ email }: { email: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isCorporate(email)) return
    if (localStorage.getItem(DISMISS_KEY)) return
    setVisible(true)
  }, [email])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <Alert className="rounded-none border-x-0 border-b-0 bg-muted border-border text-muted-foreground flex-row items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
      <AlertDescription className="text-[12px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Work email on file.</span>{' '}
        If an assistant manages your inbox, your daily briefings may not reach you directly.{' '}
        <Link
          href="/dashboard/profile#briefing-email"
          className="underline text-muted-foreground hover:text-foreground transition-colors"
        >
          Set a personal delivery address in profile settings.
        </Link>
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={dismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        Dismiss
      </Button>
    </Alert>
  )
}
