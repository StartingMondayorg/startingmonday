'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
    <div className="bg-slate-800 border-t border-slate-700 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[12px] text-slate-300 leading-relaxed">
        <span className="font-semibold text-white">Work email on file.</span>{' '}
        If an assistant manages your inbox, your daily briefings may not reach you directly.{' '}
        <Link
          href="/dashboard/profile#briefing-email"
          className="underline text-slate-400 hover:text-white transition-colors"
        >
          Set a personal delivery address in profile settings.
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-[12px] text-slate-300 hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  )
}
