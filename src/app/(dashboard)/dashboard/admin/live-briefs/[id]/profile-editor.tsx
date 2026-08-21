'use client'

import { useState } from 'react'

export default function ProfileEditor({ requestId, initialProfile }: { requestId: string; initialProfile: Record<string, unknown> }) {
  const [value, setValue] = useState(JSON.stringify(initialProfile, null, 2))
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const profile = JSON.parse(value) as unknown
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Use a JSON object for the reviewed profile.')
      const response = await fetch(`/api/admin/live-briefs/${requestId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewed_profile: profile }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Unable to save reviewed profile')
      setMessage('Saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save reviewed profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={24} className="mt-4 block w-full rounded bg-primary p-4 font-mono text-[12px] leading-5 text-primary-foreground outline-none focus:ring-2 focus:ring-primary/30" aria-label="Reviewed profile JSON" />
      <div className="mt-3 flex items-center justify-end gap-3">
        {message && <span className={`text-[12px] ${message === 'Saved' ? 'text-success' : 'text-destructive'}`}>{message}</span>}
        <button type="button" onClick={save} disabled={saving} className="rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save reviewed profile'}</button>
      </div>
    </div>
  )
}