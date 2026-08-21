'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePanel({ requestId, enabled }: { requestId: string; enabled: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')

  async function deleteRequest() {
    setWorking(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/live-briefs/${requestId}/delete`, { method: 'POST' })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Unable to delete request')
      router.push('/dashboard/admin/live-briefs')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete request')
      setWorking(false)
    }
  }

  if (!enabled) return null

  return (
    <div className="rounded border border-red-200 bg-red-50/60 p-5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-red-800">Danger zone</h2>
      <p className="mt-2 text-[12px] leading-5 text-red-700">Redacts private profile, source, artifact, scan, and delivery data. The audit event remains.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!confirming ? <button type="button" onClick={() => setConfirming(true)} className="rounded border border-red-300 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100">Delete request</button> : <><span className="text-[12px] font-semibold text-red-800">Delete permanently?</span><button type="button" onClick={deleteRequest} disabled={working} className="rounded bg-red-700 px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{working ? 'Deleting…' : 'Confirm deletion'}</button><button type="button" onClick={() => setConfirming(false)} disabled={working} className="text-[12px] font-semibold text-slate-600">Cancel</button></>}
        {message && <span role="alert" className="text-[12px] text-red-700">{message}</span>}
      </div>
    </div>
  )
}