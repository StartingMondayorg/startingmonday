'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type RunState = 'idle' | 'running' | 'done' | 'error'

type OnDemandButtonProps = {
  label: string
  runningLabel: string
  doneLabel: string
  triggerUrl: string
  pollUrl: string
  requestBody?: Record<string, unknown>
}

const POLL_INTERVAL_MS = 4_000
const POLL_TIMEOUT_MS = 120_000

function OnDemandActionButton({ label, runningLabel, doneLabel, triggerUrl, pollUrl, requestBody }: OnDemandButtonProps) {
  const router = useRouter()
  const [state, setState] = useState<RunState>('idle')
  const [detail, setDetail] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }

  async function poll() {
    if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
      stopPolling()
      setState('done')
      setDetail('Still working in the background. Results will appear as they land.')
      router.refresh()
      return
    }
    try {
      const res = await fetch(pollUrl)
      if (!res.ok) return
      const json = await res.json() as { progress?: { done?: boolean; completed?: number; total?: number } }
      if (json.progress) {
        const { completed = 0, total = 0, done } = json.progress
        setDetail(total > 0 ? `${completed}/${total} complete` : null)
        if (done) {
          stopPolling()
          setState('done')
          setDetail(null)
          router.refresh()
        }
      }
    } catch {
      // transient poll failures are fine; keep polling until timeout
    }
  }

  async function trigger() {
    setState('running')
    setDetail(null)
    try {
      const res = await fetch(triggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody ?? {}),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? 'Request failed')
      }
      startedAt.current = Date.now()
      pollTimer.current = setInterval(poll, POLL_INTERVAL_MS)
    } catch (err) {
      setState('error')
      setDetail(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return <p className="mt-2 text-[12px] text-emerald-300">{doneLabel}{detail ? ` - ${detail}` : ''}</p>
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={trigger}
        disabled={state === 'running'}
        className="text-[12px] font-semibold text-orange-100 border border-orange-300/40 bg-orange-500/20 rounded px-2.5 py-1.5 hover:bg-orange-500/30 transition-colors cursor-pointer disabled:opacity-60"
      >
        {state === 'running' ? runningLabel : label}
      </button>
      {detail && (
        <p className={`mt-1.5 text-[11px] ${state === 'error' ? 'text-rose-300' : 'text-slate-400'}`}>{detail}</p>
      )}
    </div>
  )
}

export function OnDemandScanButton({ companyNames }: { companyNames: string[] }) {
  if (companyNames.length === 0) return null
  return (
    <OnDemandActionButton
      label="Scan now"
      runningLabel="Scanning…"
      doneLabel="Scan complete."
      triggerUrl="/api/onboarding/scan"
      pollUrl="/api/onboarding/scan"
      requestBody={{ companyNames }}
    />
  )
}

export function OnDemandEnrichButton() {
  return (
    <OnDemandActionButton
      label="Find contacts now"
      runningLabel="Enriching…"
      doneLabel="Enrichment complete."
      triggerUrl="/api/onboarding/enrich"
      pollUrl="/api/onboarding/enrich"
    />
  )
}
