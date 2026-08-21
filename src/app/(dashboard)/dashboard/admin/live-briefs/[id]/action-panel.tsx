'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ActionPanelProps = {
  requestId: string
  status: string
  reviewedProfile: Record<string, unknown>
}

export default function ActionPanel({ requestId, status, reviewedProfile }: ActionPanelProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState('')
  const [deliveryUrl, setDeliveryUrl] = useState('')

  async function call(path: string, body?: unknown) {
    setWorking(path)
    setMessage('')
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const result = await response.json() as { error?: string; token?: string }
      if (!response.ok) throw new Error(result.error ?? 'Action failed')
      if (path.endsWith('/release') && typeof result.token === 'string') {
        setDeliveryUrl(`${window.location.origin}/live-brief/${result.token}`)
      }
      setMessage('Action completed')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setWorking('')
    }
  }

  return (
    <div className="rounded border border-border bg-card p-5 shadow-sm">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Workflow action</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {status === 'reviewing' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/finalize`, { brief_payload: reviewedProfile })} disabled={Boolean(working)} className="rounded border border-border bg-card px-3 py-2 text-[12px] font-semibold text-muted-foreground disabled:opacity-50">{working.includes('/finalize') ? 'Finalizing…' : 'Finalize reviewed profile'}</button>}
        {status === 'ready_for_review' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/release`)} disabled={Boolean(working)} className="rounded bg-success px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-50">{working.includes('/release') ? 'Releasing…' : 'Release private link'}</button>}
        {status === 'delivered' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/revoke`)} disabled={Boolean(working)} className="rounded bg-destructive px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-50">{working.includes('/revoke') ? 'Revoking…' : 'Revoke delivery'}</button>}
      </div>
      {message && <p role="status" className="mt-3 text-[12px] text-muted-foreground">{message}</p>}
      {deliveryUrl && <div className="mt-4 rounded border border-success/30 bg-success/10 p-3"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-success">Private link ready</p><div className="mt-2 flex gap-2"><input readOnly value={deliveryUrl} aria-label="Private delivery URL" className="min-w-0 flex-1 rounded border border-success/30 bg-card px-2 py-1.5 text-[11px] text-muted-foreground" /><button type="button" onClick={() => void navigator.clipboard.writeText(deliveryUrl)} className="shrink-0 rounded bg-success px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-success/90">Copy link</button></div></div>}
    </div>
  )
}