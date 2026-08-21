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

  async function call(path: string, body?: unknown) {
    setWorking(path)
    setMessage('')
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Action failed')
      setMessage('Action completed')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setWorking('')
    }
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500">Workflow action</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {status === 'reviewing' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/finalize`, { brief_payload: reviewedProfile })} disabled={Boolean(working)} className="rounded border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50">{working.includes('/finalize') ? 'Finalizing…' : 'Finalize reviewed profile'}</button>}
        {status === 'ready_for_review' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/release`)} disabled={Boolean(working)} className="rounded bg-emerald-700 px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{working.includes('/release') ? 'Releasing…' : 'Release private link'}</button>}
        {status === 'delivered' && <button type="button" onClick={() => call(`/api/admin/live-briefs/${requestId}/revoke`)} disabled={Boolean(working)} className="rounded bg-red-700 px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{working.includes('/revoke') ? 'Revoking…' : 'Revoke delivery'}</button>}
      </div>
      {message && <p role="status" className="mt-3 text-[12px] text-slate-500">{message}</p>}
    </div>
  )
}