'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string | number
      remove?: (widgetId: string | number) => void
    }
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void
  onStatusChange?: (status: 'loading' | 'ready' | 'error') => void
}

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function ensureTurnstileScript(onLoad: () => void, onError: () => void) {
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    if (window.turnstile) onLoad()
    else {
      existing.addEventListener('load', onLoad, { once: true })
      existing.addEventListener('error', onError, { once: true })
    }
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = SCRIPT_SRC
  script.async = true
  script.defer = true
  script.addEventListener('load', onLoad, { once: true })
  script.addEventListener('error', onError, { once: true })
  document.head.appendChild(script)
}

export default function TurnstileWidget({ onTokenChange, onStatusChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    let active = true
    onTokenChange(null)
    onStatusChange?.('loading')

    const fail = (message: string) => {
      if (!active) return
      onTokenChange(null)
      setLoadError(message)
      onStatusChange?.('error')
    }

    if (!siteKey) {
      fail('Security check is unavailable. Please try again later.')
      return
    }

    const render = () => {
      if (!containerRef.current || !window.turnstile) {
        fail('Security check failed to load. Refresh and try again.')
        return
      }

      setLoadError(null)
      containerRef.current.innerHTML = ''
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onTokenChange(token),
        'expired-callback': () => onTokenChange(null),
        'error-callback': () => {
          fail('Security check failed. Please refresh and retry.')
        },
        theme: 'light',
      })
      onStatusChange?.('ready')
    }

    const scriptLoadTimeout = window.setTimeout(() => {
      if (!window.turnstile) {
        fail('Security check failed to load. Refresh and try again.')
      }
    }, 8000)

    ensureTurnstileScript(render, () => {
      fail('Security check failed to load. Refresh and try again.')
    })

    return () => {
      active = false
      window.clearTimeout(scriptLoadTimeout)
      if (window.turnstile?.remove && widgetIdRef.current != null) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
    }
  }, [onStatusChange, onTokenChange, siteKey])

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      {loadError ? <p className="text-[12px] text-red-600">{loadError}</p> : null}
      <p className="text-[11px] text-slate-400">Complete the security check before signing in.</p>
    </div>
  )
}
