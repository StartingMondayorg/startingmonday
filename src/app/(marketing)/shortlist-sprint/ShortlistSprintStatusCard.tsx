'use client'

import { useCallback, useEffect, useState } from 'react'

type EntitlementStatus = 'not_started' | 'checkout_started' | 'active' | 'delivered' | 'converted' | 'expired'

type EntitlementResponse = {
  ok: boolean
  offer_code: 'shortlist_sprint'
  status: EntitlementStatus
  checkout_started_at: string | null
  purchased_at: string | null
  delivered_at: string | null
  converted_at: string | null
  expires_at: string | null
  sla_breached: boolean
}

const ACTIONS: Array<{ key: string; label: string }> = [
  { key: 'checkout_started', label: 'Mark checkout started' },
  { key: 'purchase_recorded', label: 'Mark purchase recorded' },
  { key: 'delivery_marked', label: 'Mark package delivered' },
  { key: 'credit_applied', label: 'Mark credit applied' },
]

export default function ShortlistSprintStatusCard() {
  const [status, setStatus] = useState<EntitlementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shortlist-sprint/entitlement', { cache: 'no-store' })
      if (!response.ok) {
        if (response.status === 401) {
          setError('Sign in to view entitlement status and delivery checkpoints.')
          setStatus(null)
          return
        }

        const payload = await response.json().catch(() => ({})) as { error?: string }
        setError(payload.error ?? 'Unable to load entitlement status.')
        return
      }

      const payload = await response.json() as EntitlementResponse
      setStatus(payload)
    } catch {
      setError('Unable to load entitlement status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  async function runAction(action: string) {
    setSavingAction(action)
    setError(null)

    try {
      const response = await fetch('/api/shortlist-sprint/entitlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        setError(payload.error ?? 'Unable to update entitlement status.')
        return
      }

      const payload = await response.json() as EntitlementResponse
      setStatus(payload)
    } catch {
      setError('Unable to update entitlement status.')
    } finally {
      setSavingAction(null)
    }
  }

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">Sprint entitlement status</p>
      <p className="mt-2 text-[13px] text-slate-200">
        Operational view for SMK-396 and SMK-397. Status is derived from canonical user events.
      </p>

      {loading ? (
        <p className="mt-3 text-[13px] text-slate-300">Loading status...</p>
      ) : null}

      {!loading && status ? (
        <div className="mt-3 space-y-2 text-[13px] text-slate-200">
          <p>
            <span className="font-semibold text-white">Current status:</span> {status.status}
          </p>
          <p>
            <span className="font-semibold text-white">Purchased:</span> {status.purchased_at ?? 'not yet'}
          </p>
          <p>
            <span className="font-semibold text-white">Delivered:</span> {status.delivered_at ?? 'not yet'}
          </p>
          <p>
            <span className="font-semibold text-white">Credit applied:</span> {status.converted_at ?? 'not yet'}
          </p>
          <p>
            <span className="font-semibold text-white">SLA:</span> {status.sla_breached ? 'at risk' : 'on track'}
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[13px] text-rose-300">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2.5">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={Boolean(savingAction)}
            onClick={() => runAction(action.key)}
            className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingAction === action.key ? 'Saving...' : action.label}
          </button>
        ))}
      </div>
    </article>
  )
}
